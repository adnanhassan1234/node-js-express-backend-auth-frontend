const XLSX = require('xlsx');

const { parseProfilePdf: parseLinkedinPdf } = require('../utils/linkedinPdf');

const {
  linkedinBuyerModel,
  askZainModel,
  linkedinDayModel,
  linkedinReportModel,
} = require('../model/linkedinModels');

const {
  STAGES,
  CLOSED_STAGES,
  STAGE_COLORS,
  BUYER_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_LABELS,
  STAGE_ACTIVITY,
  NEXT_ACTION,
  NEXT_STEP_DAYS,
  nextStepFor,
  WEEKLY_TARGETS,
  WEEKLY_REQUEST_LIMIT,
  WEEKLY_REQUEST_WARN,
  MONTHLY_GOAL,
  OUTREACH_STEPS,
  REPLY_GUIDE,
  SEARCH_HELPER,
  EXTRA_SEARCH,
  DAILY_TASKS,
  WEEKLY_TASKS,
  RULES,
  PROFILE_CHECKLIST,
  colorForStage,
  weekRange,
  dayKey,
  localDate,
} = require('../utils/linkedinRules');

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

const fail = (res, error, status = 500) => {
  console.error('[linkedin]', error);
  return res.status(status).json({
    success: false,
    message: error.message || 'Something went wrong',
  });
};

/** Query se buyers ka filter banata hai (list aur export dono isay use karte hain) */
const buildBuyerQuery = (q = {}) => {
  const { stage, country, buyerType, search, dueOnly, dueDays, from, to } = q;
  const query = {};

  if (stage && stage !== 'All') {
    const list = String(stage).split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length > 1) query.stage = { $in: list };
    else if (list.length === 1) query.stage = list[0];
  }

  if (country && country !== 'All') query.country = country;
  if (buyerType && buyerType !== 'All') query.buyerType = buyerType;

  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { company: rx }, { country: rx }, { jobTitle: rx }];
  }

  /**
   * Last Contact ki tareekh ka arsa.
   *
   * `to` ko us din ke AAKHIR tak le jaya jata hai. Warna "1 Oct se 6 Oct"
   * me 6 Oct ka kaam chhoot jata: us din ki aadhi raat ke baad ki har cheez
   * bahar reh jati, aur rows ghaib lagti hain.
   *
   * `$ne: null` is liye ke jin se abhi raabta hi nahi hua, wo kisi arse me
   * nahi aate.
   */
  if (from || to) {
    const range = { $ne: null };

    if (from) range.$gte = localDate(from);

    if (to) {
      const end = localDate(to);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }

    query.lastContactDate = range;
  }

  /**
   * Agla qadam kitne din ke andar.
   *
   * dueDays=2 ka matlab: guzar chuke + aaj + kal + parson -- yani theek wo
   * sab jo table me laal nazar aate hain. Follow-ups wala tab isi par chalta
   * hai.
   */
  if (dueDays !== undefined && dueDays !== '') {
    const n = Number(dueDays);

    if (Number.isFinite(n) && n >= 0) {
      const until = new Date();
      until.setDate(until.getDate() + n);
      until.setHours(23, 59, 59, 999);

      query.nextStepDate = { $ne: null, $lte: until };
    }
  }

  // Jin ka agla qadam aaj ya guzra hua hai
  if (dueOnly === 'true') {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    query.nextStepDate = { $ne: null, $lte: end };
  }

  return query;
};

/**
 * Kya ye kaam is buyer par AAJ pehle hi likha ja chuka hai?
 *
 * Zaroori hai: buyer add karte waqt stage se ek activity khud lag jati hai,
 * aur phir Outreach ka "Mark as sent" doosri laga deta -- yani ek hi connection
 * request do dafa gini jati aur hafte ki report jhooti ho jati. Ye guard usay
 * rokta hai, aur do dafa click ho jane se bhi bachata hai.
 */
const loggedToday = (buyer, type) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return (buyer.activity || []).some(
    (a) => a.type === type && new Date(a.at) >= start
  );
};

/* ================================================================== */
/*  1. PLAYBOOK — saara tay-shuda content                              */
/* ================================================================== */

/**
 * Frontend ko ek hi call me sab kuch de deta hai: stages, targets, templates,
 * reply guide, search helper, qawaid. Is se frontend me kuch bhi hardcode
 * nahi karna parta -- playbook badle to sirf linkedinRules.js badlegi.
 */
const getPlaybook = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        stages: STAGES,
        closedStages: CLOSED_STAGES,
        stageColors: STAGE_COLORS,
        buyerTypes: BUYER_TYPES,
        activityTypes: ACTIVITY_TYPES,
        activityLabels: ACTIVITY_LABELS,
        nextActions: NEXT_ACTION,
        nextStepDays: NEXT_STEP_DAYS,
        weeklyTargets: WEEKLY_TARGETS,
        requestLimit: WEEKLY_REQUEST_LIMIT,
        requestWarn: WEEKLY_REQUEST_WARN,
        monthlyGoal: MONTHLY_GOAL,
        outreachSteps: OUTREACH_STEPS,
        replyGuide: REPLY_GUIDE,
        searchHelper: SEARCH_HELPER,
        extraSearch: EXTRA_SEARCH,
        dailyTasks: DAILY_TASKS,
        weeklyTasks: WEEKLY_TASKS,
        rules: RULES,
        profileChecklist: PROFILE_CHECKLIST,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  2. BUYERS — pipeline                                               */
/* ================================================================== */

const listBuyers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));

    const query = buildBuyerQuery(req.query);

    // Default: jis ka agla qadam sab se qareeb hai wo upar
    const sortBy = req.query.sortBy || 'nextStepDate';
    const dir = req.query.sortDir === 'desc' ? -1 : 1;

    const [totalRecords, data] = await Promise.all([
      linkedinBuyerModel.countDocuments(query),
      linkedinBuyerModel
        .find(query)
        .sort({ [sortBy]: dir, updatedAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean(),
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return res.status(200).json({
      success: true,
      totalRecords,
      perPage,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalRecords / perPage)),
      data: data.map((b) => ({
        ...b,
        isDue: Boolean(b.nextStepDate && new Date(b.nextStepDate) <= new Date(startOfToday.getTime() + 86400000 - 1)),
        isOverdue: Boolean(b.nextStepDate && new Date(b.nextStepDate) < startOfToday),
      })),
    });
  } catch (error) {
    return fail(res, error);
  }
};

const getBuyer = async (req, res) => {
  try {
    const buyer = await linkedinBuyerModel.findById(req.params.id);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    return res.status(200).json({ success: true, data: buyer });
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * LinkedIn ke profile PDF se form bharne ke liye data.
 *
 * Kuch save NAHI hota -- sirf parh kar wapas bhej dete hain, aur frontend us
 * se Add Buyer ka form bhar deta hai. Aadmi dekh kar theek karta hai, phir
 * save dabata hai.
 *
 * Wajah: PDF ka dhancha har profile par thora alag hota hai, is liye andaze
 * par seedha record banana theek nahi.
 */
const parseProfilePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. The field name must be "file".',
      });
    }

    const data = await parseLinkedinPdf(req.file.buffer);

    if (!data.name && !data.linkedinUrl) {
      return res.status(422).json({
        success: false,
        message:
          'Is PDF me profile ka data nahi mila. LinkedIn par profile kholein → ' +
          'More → Save to PDF, aur wahi file bhejein.',
        data,
      });
    }

    return res.status(200).json({ success: true, message: 'PDF parh li', data });
  } catch (error) {
    return fail(res, error);
  }
};

const createBuyer = async (req, res) => {
  try {
    const p = req.body || {};

    if (!p.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (p.stage && !STAGES.includes(p.stage)) {
      return res.status(400).json({ success: false, message: `Stage must be one of: ${STAGES.join(', ')}` });
    }

    const buyer = new linkedinBuyerModel({
      name: p.name,
      company: p.company || '',
      country: p.country || '',
      buyerType: BUYER_TYPES.includes(p.buyerType) ? p.buyerType : 'Grassroots Club',
      jobTitle: p.jobTitle || '',
      linkedinUrl: p.linkedinUrl || '',
      email: p.email || '',
      stage: p.stage || 'Request Sent',
      /*
       * localDate: "2026-10-06" ko LOCAL din maanta hai. new Date() usay UTC
       * ki aadhi raat samajhti thi, jo yahan 6 Oct subah 5 baje ban jati --
       * aur backup/restore ke baad din ek aage peechhe hone lagta tha.
       */
      lastContactDate: p.lastContactDate ? localDate(p.lastContactDate) : new Date(),
      nextStep: p.nextStep || '',
      nextStepDate: p.nextStepDate ? localDate(p.nextStepDate) : null,
      notes: p.notes || '',
      contactId: p.contactId || null,
    });

    await buyer.save();

    return res.status(201).json({ success: true, message: 'Buyer added', data: buyer });
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Buyer update.
 *
 * Stage badle to activity khud likh di jati hai -- yehi hafte ki report ka
 * asal source hai, is liye user ko alag se kuch nahi karna parta.
 */
const updateBuyer = async (req, res) => {
  try {
    const buyer = await linkedinBuyerModel.findById(req.params.id);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    const p = req.body || {};
    const stageChanged = p.stage && p.stage !== buyer.stage;

    if (p.stage && !STAGES.includes(p.stage)) {
      return res.status(400).json({ success: false, message: `Stage must be one of: ${STAGES.join(', ')}` });
    }

    ['name', 'company', 'country', 'buyerType', 'jobTitle', 'linkedinUrl', 'email', 'stage', 'nextStep', 'notes']
      .forEach((f) => {
        if (p[f] !== undefined) buyer[f] = p[f];
      });

    // Wahi wajah jo createBuyer me likhi hai -- local din, UTC nahi
    if (p.lastContactDate !== undefined) {
      buyer.lastContactDate = p.lastContactDate ? localDate(p.lastContactDate) : null;
    }
    if (p.nextStepDate !== undefined) {
      buyer.nextStepDate = p.nextStepDate ? localDate(p.nextStepDate) : null;
    }

    if (stageChanged) {
      // Stage aage barha to us qadam ki tareekh mehfooz kar lo
      const type = STAGE_ACTIVITY[buyer.stage];
      if (type && !loggedToday(buyer, type)) {
        buyer.activity.push({ type, at: new Date() });
      }

      if (!p.lastContactDate) buyer.lastContactDate = new Date();

      /*
       * Naye stage ki apni tareekh. Sirf tab jab bheji HI na gayi ho --
       * modal apni tareekh khud bhejta hai aur usay chhedna ghalat hoga.
       * Table ka Action dropdown sirf { stage } bhejta hai, to wahan ye
       * khud lag jati hai.
       */
      if (p.nextStepDate === undefined) {
        buyer.nextStepDate = nextStepFor(buyer.stage);
      }
    }

    await buyer.save();

    return res.status(200).json({ success: true, message: 'Buyer updated', data: buyer });
  } catch (error) {
    return fail(res, error);
  }
};

const deleteBuyer = async (req, res) => {
  try {
    const gone = await linkedinBuyerModel.findByIdAndDelete(req.params.id);
    if (!gone) return res.status(404).json({ success: false, message: 'Buyer not found' });

    return res.status(200).json({ success: true, message: 'Buyer deleted' });
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Koi ek kaam alag se likhna (maslan "mock-up offer bhej diya").
 *
 * Outreach page ka "Mark as sent" yehi bulata hai. Agar us qadam ka koi stage
 * bhi hai to stage bhi aage barh jata hai.
 */
const logActivity = async (req, res) => {
  try {
    const { type, note, stage } = req.body || {};

    if (!ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${ACTIVITY_TYPES.join(', ')}`,
      });
    }

    const buyer = await linkedinBuyerModel.findById(req.params.id);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    // Aaj pehle hi lag chuka ho to dobara na ginein
    const already = loggedToday(buyer, type);

    if (!already) {
      buyer.activity.push({ type, at: new Date(), note: note || '' });
    }

    buyer.lastContactDate = new Date();

    if (stage && STAGES.includes(stage) && stage !== buyer.stage) {
      buyer.stage = stage;
      buyer.color = colorForStage(stage);
    }

    /*
     * Kaam ho gaya -- ab agla qadam kab. Ye har dafa nayi lagti hai, chahe
     * stage badla ho ya nahi: "Mark as sent" ka matlab hi yehi hai ke kaam
     * aaj hua, to agla dekhna aaj se ginna chahiye.
     *
     * Pehle ye chhooti hi nahi thi, is liye accept ke baad table me Next Step
     * ka khana khali para rehta tha aur buyer nazar se gir jata tha.
     */
    buyer.nextStepDate = nextStepFor(buyer.stage);

    await buyer.save();

    return res.status(200).json({
      success: true,
      message: already
        ? (ACTIVITY_LABELS[type] || type) + ' — aaj pehle hi likha ja chuka tha'
        : (ACTIVITY_LABELS[type] || type) + ' logged',
      alreadyLogged: already,
      data: buyer,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Ek se ziyada buyers delete karna.
 *
 * Do tareeqe:
 *   { ids: [...] }                  -- chune hue
 *   { all: true, ...filters }       -- jo bhi maujooda filter par aate hain
 *
 * `all` jaan boojh kar alag rakha hai: ye sainkron rows ek saath mita sakta
 * hai, is liye frontend pehle ginti dikha kar tasdeeq leta hai.
 */
/**
 * Kai buyers par ek hi kaam likhna -- "in 25 logon ne accept kar liya".
 *
 * Hafte me ~80 requests jati hain aur ~25 accept hoti hain. Har ek ka modal
 * khol kar stage badalna bohat waqt leta tha, is liye ye raasta rakha hai.
 *
 * Yahan `all: true` jaan boojh kar NAHI rakha: filter ke saare rows ko ek
 * saath accepted kar dena hafte ki ginti kharab kar deta hai, aur usay wapas
 * karna aasan nahi. Ids saaf saaf chunni hongi.
 */
const bulkLogActivity = async (req, res) => {
  try {
    const { ids, type, stage, note } = req.body || {};

    if (!ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${ACTIVITY_TYPES.join(', ')}`,
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'An "ids" array is required' });
    }

    const buyers = await linkedinBuyerModel.find({ _id: { $in: ids } });
    const now = new Date();

    let logged = 0;
    let skipped = 0;

    for (const buyer of buyers) {
      // Wohi guard jo ek-ek par lagta hai -- aaj dobara na ginein
      if (loggedToday(buyer, type)) {
        skipped += 1;
      } else {
        buyer.activity.push({ type, at: now, note: note || '' });
        logged += 1;
      }

      buyer.lastContactDate = now;

      if (stage && STAGES.includes(stage) && stage !== buyer.stage) {
        buyer.stage = stage;
        buyer.color = colorForStage(stage);
      }

      // Wahi usool jo ek-ek par lagta hai
      buyer.nextStepDate = nextStepFor(buyer.stage, now);

      await buyer.save();
    }

    const label = ACTIVITY_LABELS[type] || type;

    return res.status(200).json({
      success: true,
      message:
        logged + ' par "' + label + '" likha gaya' +
        (skipped ? ', ' + skipped + ' aaj pehle hi likhe ja chuke the' : ''),
      logged,
      skipped,
    });
  } catch (error) {
    return fail(res, error);
  }
};

const bulkDeleteBuyers = async (req, res) => {
  try {
    const { ids, all } = req.body || {};

    let query;

    if (all === true) {
      query = buildBuyerQuery(req.body);
    } else if (Array.isArray(ids) && ids.length > 0) {
      query = { _id: { $in: ids } };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either an "ids" array or "all: true" is required',
      });
    }

    const result = await linkedinBuyerModel.deleteMany(query);

    return res.status(200).json({
      success: true,
      message: result.deletedCount + (result.deletedCount === 1 ? ' buyer deleted' : ' buyers deleted'),
      deleted: result.deletedCount,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  3. DASHBOARD                                                       */
/* ================================================================== */

/** Kisi range me har qism ki activity ki ginti */
const activityCounts = async (start, end) => {
  const rows = await linkedinBuyerModel.aggregate([
    { $unwind: '$activity' },
    { $match: { 'activity.at': { $gte: start, $lte: end } } },
    { $group: { _id: '$activity.type', n: { $sum: 1 } } },
  ]);

  const counts = {};
  ACTIVITY_TYPES.forEach((t) => { counts[t] = 0; });
  rows.forEach((r) => { counts[r._id] = r.n; });

  return counts;
};

const getStats = async (req, res) => {
  try {
    const { start, end } = weekRange(req.query.week);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [weekCounts, monthCounts, byStage, total] = await Promise.all([
      activityCounts(start, end),
      activityCounts(monthStart, new Date()),
      linkedinBuyerModel.aggregate([{ $group: { _id: '$stage', n: { $sum: 1 } } }]),
      linkedinBuyerModel.countDocuments(),
    ]);

    const stageCounts = {};
    STAGES.forEach((s) => { stageCounts[s] = 0; });
    byStage.forEach((r) => { stageCounts[r._id] = r.n; });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    /* Follow-ups tab ke liye: do din ke andar ka sab kuch */
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    inTwoDays.setHours(23, 59, 59, 999);

    const [dueToday, overdue, dueSoon, pendingZain] = await Promise.all([
      linkedinBuyerModel.countDocuments({ nextStepDate: { $gte: startOfToday, $lte: endOfToday } }),
      linkedinBuyerModel.countDocuments({ nextStepDate: { $ne: null, $lt: startOfToday } }),
      linkedinBuyerModel.countDocuments({ nextStepDate: { $ne: null, $lte: inTwoDays } }),
      askZainModel.countDocuments({ status: 'Pending' }),
    ]);

    const sent = weekCounts.requestSent || 0;

    return res.status(200).json({
      success: true,
      data: {
        week: { start, end },
        weekCounts,
        targets: WEEKLY_TARGETS,

        /**
         * LinkedIn ki hafte wali hadd. Ye sirf ginti nahi -- 100 par pohanch
         * kar aage bhejna account ke liye khatra hai.
         */
        requests: {
          sent,
          warn: WEEKLY_REQUEST_WARN,
          limit: WEEKLY_REQUEST_LIMIT,
          left: Math.max(0, WEEKLY_REQUEST_LIMIT - sent),
          state: sent >= WEEKLY_REQUEST_LIMIT ? 'blocked' : sent >= WEEKLY_REQUEST_WARN ? 'warn' : 'ok',
        },

        month: {
          goal: MONTHLY_GOAL,
          sampleOrders: monthCounts.sampleOrdered || 0,
          bulkQuotes: monthCounts.bulkQuoteSent || 0,
        },

        pipeline: {
          total,
          byStage: stageCounts,
          won: stageCounts.Won,
          lost: stageCounts.Lost,
          notNow: stageCounts['Not now'],
          active: total - stageCounts.Won - stageCounts.Lost - stageCounts['Not now'],
        },

        dueToday,
        overdue,
        dueSoon,
        pendingZain,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  4. ROZANA KA MAMOOL                                                */
/* ================================================================== */

const getDay = async (req, res) => {
  try {
    const date = req.query.date || dayKey();

    let day = await linkedinDayModel.findOne({ date });
    if (!day) day = await linkedinDayModel.create({ date, tasks: {}, allDone: false });

    /**
     * Streak: aaj se peechhe ki taraf kitne din lagatar poore hue.
     * Aaj adhoora ho to bhi streak nahi tootta -- din abhi baqi hai.
     */
    const recent = await linkedinDayModel.find({ date: { $lte: date } }).sort({ date: -1 }).limit(400).lean();

    let streak = 0;
    const expect = new Date(date);

    for (let i = 0; i < recent.length; i += 1) {
      const row = recent[i];

      if (i === 0 && !row.allDone) { expect.setDate(expect.getDate() - 1); continue; }
      if (row.date !== dayKey(expect)) break;
      if (!row.allDone) break;

      streak += 1;
      expect.setDate(expect.getDate() - 1);
    }

    return res.status(200).json({
      success: true,
      data: {
        date: day.date,
        tasks: Object.fromEntries(day.tasks || []),
        allDone: day.allDone,
        market: day.market,
        streak,
        dailyTasks: DAILY_TASKS,
        weeklyTasks: WEEKLY_TASKS,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

const updateDay = async (req, res) => {
  try {
    const date = req.body.date || dayKey();
    const { taskKey, done, market } = req.body || {};

    let day = await linkedinDayModel.findOne({ date });
    if (!day) day = new linkedinDayModel({ date, tasks: {} });

    if (taskKey !== undefined) {
      if (!DAILY_TASKS.some((t) => t.key === taskKey)) {
        return res.status(400).json({ success: false, message: 'Unknown task' });
      }
      day.tasks.set(taskKey, Boolean(done));
    }

    if (market !== undefined) day.market = market;

    day.allDone = DAILY_TASKS.every((t) => day.tasks.get(t.key) === true);

    await day.save();

    return res.status(200).json({
      success: true,
      data: {
        date: day.date,
        tasks: Object.fromEntries(day.tasks),
        allDone: day.allDone,
        market: day.market,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  5. ASK ZAIN                                                        */
/* ================================================================== */

const listQuestions = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && req.query.status !== 'All') query.status = req.query.status;

    const data = await askZainModel.find(query).sort({ status: 1, createdAt: -1 }).limit(300).lean();

    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    return res.status(200).json({
      success: true,
      count: data.length,
      pending: data.filter((q) => q.status === 'Pending').length,
      data: data.map((q) => ({
        ...q,
        // Ek din se ziyada intezar -- yaad dilane ke liye
        isStale: q.status === 'Pending' && now - new Date(q.createdAt).getTime() > dayMs,
      })),
    });
  } catch (error) {
    return fail(res, error);
  }
};

const createQuestion = async (req, res) => {
  try {
    const { question, buyerName, buyerId, topic } = req.body || {};

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const row = await askZainModel.create({
      question,
      buyerName: buyerName || '',
      buyerId: buyerId || null,
      topic: topic || '',
    });

    return res.status(201).json({ success: true, message: 'Question added', data: row });
  } catch (error) {
    return fail(res, error);
  }
};

const answerQuestion = async (req, res) => {
  try {
    const row = await askZainModel.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Question not found' });

    const { answer, status } = req.body || {};

    if (answer !== undefined) row.answer = answer;

    if (status && ['Pending', 'Answered'].includes(status)) {
      row.status = status;
      row.answeredAt = status === 'Answered' ? new Date() : null;
    } else if (answer) {
      row.status = 'Answered';
      row.answeredAt = new Date();
    }

    await row.save();

    return res.status(200).json({ success: true, message: 'Question updated', data: row });
  } catch (error) {
    return fail(res, error);
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const gone = await askZainModel.findByIdAndDelete(req.params.id);
    if (!gone) return res.status(404).json({ success: false, message: 'Question not found' });

    return res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  6. HAFTE KI REPORT                                                 */
/* ================================================================== */

/** Report ka text -- WhatsApp/email par seedha paste ho jata hai */
const buildReportText = (weekStart, counts, extras) => {
  const d = (x) =>
    new Date(x).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const lines = [
    'Week of ' + d(weekStart) + ' — LinkedIn sales report',
    '',
    'Connection requests sent: ' + (counts.requestSent || 0) + '   Accepted: ' + (counts.accepted || 0),
    'Real conversations: ' + (counts.conversation || 0),
    'Mock-ups offered: ' + (counts.mockupOffered || 0) + '   Mock-ups sent: ' + (counts.mockupSent || 0),
    'Sample orders ($200): ' + (counts.sampleOrdered || 0) +
      '   Bulk quotes sent: ' + (counts.bulkQuoteSent || 0),
    '',
    'Best conversation this week: ' + (extras.bestConversation || '—'),
    'Needs Zain: ' + (extras.needsZain && extras.needsZain.length ? extras.needsZain.join('; ') : '—'),
    "Next week's market: " + (extras.nextMarket || '—'),
  ];

  return lines.join('\n');
};

/**
 * Report ki jhalak -- data se khud bhar kar deti hai, save nahi karti.
 * "Needs Zain" un sawalon se khud banta hai jo abhi jawab ke intezar me hain.
 */
const previewReport = async (req, res) => {
  try {
    const { start, end } = weekRange(req.query.week);

    const [counts, pending] = await Promise.all([
      activityCounts(start, end),
      askZainModel.find({ status: 'Pending' }).sort({ createdAt: 1 }).lean(),
    ]);

    const needsZain = pending.map((q) =>
      (q.buyerName ? q.buyerName + ': ' : '') + q.question
    );

    const extras = {
      bestConversation: req.query.bestConversation || '',
      needsZain,
      nextMarket: req.query.nextMarket || '',
    };

    return res.status(200).json({
      success: true,
      data: {
        weekStart: start,
        weekEnd: end,
        counts,
        targets: WEEKLY_TARGETS,
        needsZain,
        text: buildReportText(start, counts, extras),
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

const saveReport = async (req, res) => {
  try {
    const { start, end } = weekRange(req.body.week);
    const counts = await activityCounts(start, end);

    const extras = {
      bestConversation: req.body.bestConversation || '',
      needsZain: Array.isArray(req.body.needsZain) ? req.body.needsZain : [],
      nextMarket: req.body.nextMarket || '',
    };

    const text = req.body.text || buildReportText(start, counts, extras);

    // Ek hafte ki ek hi report -- dobara bhejne par purani update ho jati hai
    const saved = await linkedinReportModel.findOneAndUpdate(
      { weekStart: start },
      { weekStart: start, weekEnd: end, counts, ...extras, text },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: 'Report saved', data: saved });
  } catch (error) {
    return fail(res, error);
  }
};

const listReports = async (req, res) => {
  try {
    const data = await linkedinReportModel.find().sort({ weekStart: -1 }).limit(60).lean();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Save ki hui report mitana.
 *
 * Sirf report ka record jata hai -- activity ko haath nahi lagta. Is liye usi
 * hafte par dobara "Save" dabane se report waisi ki waisi ban jati hai, ginti
 * activity se phir se bun kar. Ghalti se delete hona bara nuqsan nahi.
 */
const deleteReport = async (req, res) => {
  try {
    const gone = await linkedinReportModel.findByIdAndDelete(req.params.id);

    if (!gone) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json({ success: true, message: 'Report deleted' });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  7. CSV EXPORT / IMPORT                                             */
/* ================================================================== */

const CSV_COLUMNS = [
  ['name', 'Name'],
  ['company', 'Organization'],
  ['country', 'Country'],
  ['buyerType', 'Buyer Type'],
  ['jobTitle', 'Job Title'],
  ['linkedinUrl', 'LinkedIn URL'],
  ['email', 'Email'],
  ['stage', 'Stage'],
  ['lastContactDate', 'Last Contact'],
  ['nextStep', 'Next Step'],
  ['nextStepDate', 'Next Step Date'],
  ['notes', 'Notes'],
];

const exportBuyers = async (req, res) => {
  try {
    const rows = await linkedinBuyerModel.find(buildBuyerQuery(req.query)).sort({ name: 1 }).lean();

    const cell = (v) => {
      if (v === null || v === undefined) return '';
      const s = v instanceof Date ? new Date(v).toISOString().slice(0, 10) : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };

    const lines = [CSV_COLUMNS.map((c) => c[1]).join(',')];
    rows.forEach((r) => lines.push(CSV_COLUMNS.map((c) => cell(r[c[0]])).join(',')));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="linkedin-pipeline.csv"');

    // BOM lagana zaroori hai, warna Excel me special characters kharab dikhte hain
    return res.send('﻿' + lines.join('\r\n'));
  } catch (error) {
    return fail(res, error);
  }
};

/** Column ka naam normalize -- sheet me kuch bhi likha ho, match ho jaye */
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const IMPORT_ALIASES = {
  name: ['name', 'fullname', 'person', 'contact'],
  company: ['company', 'club', 'school', 'shop', 'clubschool', 'clubschoolshop', 'organization'],
  country: ['country', 'market'],
  buyerType: ['buyertype', 'type'],
  jobTitle: ['jobtitle', 'title', 'role'],
  linkedinUrl: ['linkedinurl', 'linkedin', 'profile', 'profileurl'],
  email: ['email', 'emailaddress'],
  stage: ['stage', 'status'],
  lastContactDate: ['lastcontact', 'lastcontactdate'],
  nextStep: ['nextstep'],
  nextStepDate: ['nextstepdate', 'nextstepdue'],
  notes: ['notes', 'note', 'remarks'],
};

const importBuyers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Field name must be "file".' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });

    /**
     * Poora backup ghalti se Import me na chala jaye.
     *
     * Jaal ye tha: backup ki PEHLI sheet ka naam bhi "Buyers" hai, aur Import
     * pehli hi sheet parhta hai. To file khushi se chal jati -- buyers ban
     * jate, magar Activity, Ask Zain, Reports aur Daily chup chaap chhoot
     * jate. Upar se har naye buyer par ek nayi (ghalat) activity lag jati,
     * jis se hafte ki ginti kharab ho jati.
     *
     * Khamoshi se adhoora kaam karne se behtar hai saaf mana kar dena.
     */
    if (wb.SheetNames.includes('Activity') || wb.SheetNames.includes('Reports')) {
      return res.status(400).json({
        success: false,
        message:
          'Ye poora backup lagta hai (Activity/Reports sheets mojood hain). ' +
          'Is ke liye Import nahi — RESTORE istemal karein, warna activity aur ' +
          'reports chhoot jayengi.',
      });
    }

    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });

    if (rows.length < 2) {
      return res.status(400).json({ success: false, message: 'File looks empty' });
    }

    const header = rows[0].map(norm);

    const pick = (row, field) => {
      const aliases = IMPORT_ALIASES[field] || [];
      for (let i = 0; i < header.length; i += 1) {
        if (aliases.includes(header[i])) return row[i];
      }
      return undefined;
    };

    /**
     * "2026-09-28" ko LOCAL din maan kar parhta hai.
     *
     * new Date("2026-09-28") UTC ki aadhi raat deti hai, jo UTC+5 me ek din
     * peechhe (27 tareekh, 5 baje) ban jati hai -- sheet se aayi har tareekh
     * ek din pehle ki ho jati thi.
     */
    const toDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;

      const d = localDate(String(v).trim());
      return Number.isNaN(d.getTime()) ? null : d;
    };

    // Dobara import par duplicate na banein -- naam + club se milan
    const existing = await linkedinBuyerModel.find({}, 'name company').lean();
    const seen = new Set(existing.map((b) => norm(b.name) + '|' + norm(b.company)));

    let inserted = 0;
    let skipped = 0;
    const toAdd = [];

    for (let i = 1; i < rows.length; i += 1) {
      const name = String(pick(rows[i], 'name') || '').trim();
      if (!name) { skipped += 1; continue; }

      const company = String(pick(rows[i], 'company') || '').trim();
      const key = norm(name) + '|' + norm(company);

      if (seen.has(key)) { skipped += 1; continue; }
      seen.add(key);

      const stage = String(pick(rows[i], 'stage') || '').trim();
      const buyerType = String(pick(rows[i], 'buyerType') || '').trim();

      toAdd.push({
        name,
        company,
        country: String(pick(rows[i], 'country') || '').trim(),
        buyerType: BUYER_TYPES.includes(buyerType) ? buyerType : 'Grassroots Club',
        jobTitle: String(pick(rows[i], 'jobTitle') || '').trim(),
        linkedinUrl: String(pick(rows[i], 'linkedinUrl') || '').trim(),
        email: String(pick(rows[i], 'email') || '').trim().toLowerCase(),
        stage: STAGES.includes(stage) ? stage : 'Request Sent',
        lastContactDate: toDate(pick(rows[i], 'lastContactDate')),
        nextStep: String(pick(rows[i], 'nextStep') || '').trim(),
        nextStepDate: toDate(pick(rows[i], 'nextStepDate')),
        notes: String(pick(rows[i], 'notes') || '').trim(),
      });
    }

    // create() istemal kar rahe hain (insertMany nahi) taake pre-save chale
    // aur har buyer ka rang + pehli activity theek se lag jaye
    for (const row of toAdd) {
      await linkedinBuyerModel.create(row);
      inserted += 1;
    }

    return res.status(201).json({
      success: true,
      message: inserted + ' buyers imported, ' + skipped + ' skipped',
      summary: { inserted, skipped, totalRows: rows.length - 1 },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  8. POORA BACKUP / RESTORE                                          */
/* ================================================================== */

/**
 * Poora backup -- ek Excel file jis me har cheez alag sheet me hai.
 *
 * CSV export sirf list deta hai. Ye alag hai: is me ACTIVITY bhi aati hai, aur
 * hafte wali report ki ginti wahin se banti hai. Sirf stages le jane se dusri
 * machine par report ghalat nikalti hai -- is liye poora backup chahiye.
 *
 * Sheets: Buyers, Activity, Ask Zain, Reports, Daily
 */
const backupAll = async (req, res) => {
  try {
    const [buyers, questions, reports, days] = await Promise.all([
      linkedinBuyerModel.find().sort({ name: 1 }).lean(),
      askZainModel.find().sort({ createdAt: 1 }).lean(),
      linkedinReportModel.find().sort({ weekStart: 1 }).lean(),
      linkedinDayModel.find().sort({ date: 1 }).lean(),
    ]);

    /**
     * Tareekhein LOCAL din ke hisaab se likhi jati hain.
     *
     * Pehle toISOString() se likhti thi. UTC+5 me local Monday 00:00 asal me
     * UTC ka Sunday 19:00 hai, is liye sheet me ek din PEECHHE ka din jata
     * tha -- aur restore par report ka hafta Sunday par beth jata tha, jis se
     * upsert ka milan toot kar duplicate report ban jati thi.
     *
     * Activity ka waqt (stamp) poora ISO hi rehta hai: usme timezone shamil
     * hai, is liye wo bilkul theek wapas aata hai -- aur report ki ginti isi
     * se banti hai.
     */
    const day = (v) => (v ? dayKey(v) : '');
    const stamp = (v) => (v ? new Date(v).toISOString() : '');
    const plain = (m) => (m instanceof Map ? Object.fromEntries(m) : m || {});

    const wb = XLSX.utils.book_new();
    const add = (name, rows) =>
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);

    add(
      'Buyers',
      buyers.map((b) => ({
        Name: b.name,
        Organization: b.company || '',
        Country: b.country || '',
        'Buyer Type': b.buyerType,
        'Job Title': b.jobTitle || '',
        'LinkedIn URL': b.linkedinUrl || '',
        Email: b.email || '',
        Stage: b.stage,
        'Last Contact': day(b.lastContactDate),
        'Next Step': b.nextStep || '',
        'Next Step Date': day(b.nextStepDate),
        Notes: b.notes || '',
      }))
    );

    /**
     * Activity alag sheet me. Buyer se jorne ke liye Name + Club use hote hain
     * -- database ka _id dusri machine par koi mayne nahi rakhta.
     */
    const activityRows = [];
    buyers.forEach((b) => {
      (b.activity || []).forEach((a) => {
        activityRows.push({
          Buyer: b.name,
          Organization: b.company || '',
          Type: a.type,
          At: stamp(a.at),
          Note: a.note || '',
        });
      });
    });
    add('Activity', activityRows);

    add(
      'Ask Zain',
      questions.map((q) => ({
        Question: q.question,
        Buyer: q.buyerName || '',
        Topic: q.topic || '',
        Status: q.status,
        Answer: q.answer || '',
        Asked: stamp(q.createdAt),
      }))
    );

    add(
      'Reports',
      reports.map((r) => ({
        'Week Start': day(r.weekStart),
        'Week End': day(r.weekEnd),
        Counts: JSON.stringify(plain(r.counts)),
        'Best Conversation': r.bestConversation || '',
        'Needs Zain': (r.needsZain || []).join(' | '),
        'Next Market': r.nextMarket || '',
        Text: r.text || '',
      }))
    );

    add(
      'Daily',
      days.map((d) => ({
        Date: d.date,
        Tasks: JSON.stringify(plain(d.tasks)),
        'All Done': d.allDone ? 'yes' : 'no',
        Market: d.market || '',
      }))
    );

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fileName = 'xportyn-linkedin-backup-' + day(new Date()) + '.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');

    return res.send(buf);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Backup wapas laana.
 *
 * Usool: kuch mitaya NAHI jata. Jo buyer pehle se maujood hai (Name + Club se
 * milan) usay update kiya jata hai aur uski activity mila di jati hai -- dono
 * machinon ka kaam bach jata hai. Ek hi activity do dafa na lage, is liye
 * type + waqt se milan hota hai.
 */
const restoreAll = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. The field name must be "file".',
      });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheet = (n) =>
      wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' }) : [];

    const buyerRows = sheet('Buyers');
    if (buyerRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No "Buyers" sheet found — is this a LinkedIn backup file?',
      });
    }

    /**
     * "2026-09-28" ko LOCAL din maan kar parhta hai.
     *
     * new Date("2026-09-28") UTC ki aadhi raat deti hai, jo UTC+5 me ek din
     * peechhe (27 tareekh, 5 baje) ban jati hai -- sheet se aayi har tareekh
     * ek din pehle ki ho jati thi.
     */
    const toDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;

      const d = localDate(String(v).trim());
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const key = (name, club) => norm(name) + '|' + norm(club);

    /**
     * Purani backup files me is column ka naam "Club" tha, nayi me
     * "Organization". Dono parhte hain -- warna purani file se restore karne
     * par activity kisi buyer se jurti hi nahi aur gum ho jati.
     */
    const orgOf = (row) => row.Organization || row.Club || '';

    /* Activity ko buyer ke hisaab se jama kar lo */
    const byBuyer = new Map();
    sheet('Activity').forEach((a) => {
      const k = key(a.Buyer, orgOf(a));
      if (!byBuyer.has(k)) byBuyer.set(k, []);

      byBuyer.get(k).push({
        type: String(a.Type || '').trim(),
        at: toDate(a.At) || new Date(),
        note: String(a.Note || '').trim(),
      });
    });

    const existing = await linkedinBuyerModel.find({});
    const have = new Map(existing.map((b) => [key(b.name, b.company), b]));

    let added = 0;
    let updated = 0;
    let activityAdded = 0;

    for (const row of buyerRows) {
      const name = String(row.Name || '').trim();
      if (!name) continue;

      const club = String(orgOf(row)).trim();
      const k = key(name, club);

      const stage = String(row.Stage || '').trim();
      const buyerType = String(row['Buyer Type'] || '').trim();

      const fields = {
        name,
        company: club,
        country: String(row.Country || '').trim(),
        buyerType: BUYER_TYPES.includes(buyerType) ? buyerType : 'Grassroots Club',
        jobTitle: String(row['Job Title'] || '').trim(),
        linkedinUrl: String(row['LinkedIn URL'] || '').trim(),
        email: String(row.Email || '').trim().toLowerCase(),
        stage: STAGES.includes(stage) ? stage : 'Request Sent',
        lastContactDate: toDate(row['Last Contact']),
        nextStep: String(row['Next Step'] || '').trim(),
        nextStepDate: toDate(row['Next Step Date']),
        notes: String(row.Notes || '').trim(),
      };

      const incoming = (byBuyer.get(k) || []).filter((a) => ACTIVITY_TYPES.includes(a.type));

      let doc = have.get(k);

      if (doc) {
        Object.assign(doc, fields);
        updated += 1;
      } else {
        doc = new linkedinBuyerModel(fields);
        // pre-save khud ek activity na daale -- asli activity neeche aa rahi hai
        if (incoming.length) doc.activity = [];
        have.set(k, doc);
        added += 1;
      }

      const seen = new Set(
        (doc.activity || []).map((a) => a.type + '@' + new Date(a.at).toISOString())
      );

      incoming.forEach((a) => {
        const id = a.type + '@' + new Date(a.at).toISOString();
        if (seen.has(id)) return;

        seen.add(id);
        doc.activity.push(a);
        activityAdded += 1;
      });

      await doc.save();
    }

    /* ---- Ask Zain ---- */
    let questionsAdded = 0;
    const qRows = sheet('Ask Zain');

    if (qRows.length) {
      const haveQ = new Set(
        (await askZainModel.find({}, 'question').lean()).map((q) => norm(q.question))
      );

      for (const q of qRows) {
        const question = String(q.Question || '').trim();
        if (!question || haveQ.has(norm(question))) continue;

        haveQ.add(norm(question));

        await askZainModel.create({
          question,
          buyerName: String(q.Buyer || '').trim(),
          topic: String(q.Topic || '').trim(),
          status: String(q.Status || '').trim() === 'Answered' ? 'Answered' : 'Pending',
          answer: String(q.Answer || '').trim(),
        });
        questionsAdded += 1;
      }
    }

    /* ---- Reports ---- */
    let reportsAdded = 0;
    for (const r of sheet('Reports')) {
      const weekStart = toDate(r['Week Start']);
      if (!weekStart) continue;

      let counts = {};
      try {
        counts = JSON.parse(r.Counts || '{}');
      } catch {
        counts = {};
      }

      await linkedinReportModel.findOneAndUpdate(
        { weekStart },
        {
          weekStart,
          weekEnd: toDate(r['Week End']) || weekStart,
          counts,
          bestConversation: String(r['Best Conversation'] || ''),
          needsZain: String(r['Needs Zain'] || '').split(' | ').filter(Boolean),
          nextMarket: String(r['Next Market'] || ''),
          text: String(r.Text || ''),
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      reportsAdded += 1;
    }

    /* ---- Daily ---- */
    let daysAdded = 0;
    for (const d of sheet('Daily')) {
      const date = String(d.Date || '').trim();
      if (!date) continue;

      let tasks = {};
      try {
        tasks = JSON.parse(d.Tasks || '{}');
      } catch {
        tasks = {};
      }

      await linkedinDayModel.findOneAndUpdate(
        { date },
        {
          date,
          tasks,
          allDone: String(d['All Done'] || '') === 'yes',
          market: String(d.Market || ''),
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      daysAdded += 1;
    }

    return res.status(200).json({
      success: true,
      message:
        added + ' buyers added, ' + updated + ' updated, ' +
        activityAdded + ' activity records restored',
      summary: { added, updated, activityAdded, questionsAdded, reportsAdded, daysAdded },
    });
  } catch (error) {
    return fail(res, error);
  }
};

module.exports = {
  getPlaybook,
  listBuyers,
  getBuyer,
  createBuyer,
  parseProfilePdf,
  updateBuyer,
  deleteBuyer,
  bulkDeleteBuyers,
  logActivity,
  bulkLogActivity,
  getStats,
  getDay,
  updateDay,
  listQuestions,
  createQuestion,
  answerQuestion,
  deleteQuestion,
  previewReport,
  saveReport,
  listReports,
  deleteReport,
  exportBuyers,
  importBuyers,
  backupAll,
  restoreAll,
};
