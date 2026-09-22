const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const contactModel = require('../model/contactModel');
const {
  STATUSES,
  CATEGORIES,
  STATUS_COLORS,
  STATUS_PDF_COLORS,
  colorForStatus,
  nextFollowUpFor,
  mapCategory,
  normalizeStatus,
  addDays,
} = require('../utils/trackerRules');
const { TEMPLATES, FOLLOW_UPS, renderTemplate } = require('../utils/emailTemplates');
const {
  getTransporter,
  isMailerReady,
  mailerSetupMessage,
  getFromAddress,
  getFromEmail,
  getBccAddress,
  buildRawMessage,
  verifyConnection,
  textToHtml,
} = require('../config/mailer');
const { saveToSentFolder, isSentSaveEnabled } = require('../config/imapSent');
const { scanForReplies } = require('../config/replyWatcher');

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

/**
 * Excel header ko normalize karta hai:
 *   "Contact Name" -> "contactname",  "E-mail" -> "email"
 * Taake sheet me capital/small/space/dash kuch bhi ho, hum match kar sakein.
 */
const normalizeKey = (key) => String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Sheet column -> hamare field ka mapping (multiple names support karte hain)
const COLUMN_ALIASES = {
  name: ['name', 'organizationname', 'organization', 'club', 'school', 'institution', 'title'],
  contactPerson: ['contactperson', 'contactname', 'person', 'contact'],
  city: ['city', 'town', 'location'],
  country: ['country', 'nation'],
  category: ['category', 'type', 'sheet'],
  address: ['address', 'streetaddress', 'fulladdress'],
  phone: ['phone', 'phonenumber', 'telephone', 'mobile', 'contactnumber'],
  website: ['website', 'url', 'site', 'web'],
  email: ['email', 'emailaddress', 'mail', 'e mail'],
  notes: ['notes', 'note', 'remarks', 'comment', 'comments'],

  // Ye teen sheet se aa sakte hain -- agar sheet me hon to wohi use hote hain
  status: ['status', 'contactstatus', 'emailstatus', 'stage', 'state', 'progress'],
  lastContactDate: [
    'lastcontactdate', 'lastcontact', 'lastcontacted', 'lastcontacteddate',
    'contactdate', 'datecontacted', 'emailsentdate', 'datesent', 'sentdate',
  ],
  nextFollowUpDate: [
    'nextfollowupdate', 'nextfollowup', 'followupdate', 'followup',
    'nextfollow', 'followupon', 'duedate',
  ],
};

// In fields ki asal value chahiye (Date object), String me badalna nuqsan deta hai
const RAW_VALUE_FIELDS = new Set(['lastContactDate', 'nextFollowUpDate']);

/** Ek parsed row (array of cells) ko header row ke sath mila kar object banata hai */
const rowToObject = (headerKeys, row) => {
  const obj = {};

  headerKeys.forEach((headerKey, index) => {
    if (!headerKey) return;
    const value = row[index];
    if (value === undefined || value === null) return;

    // Har field ke aliases check karo
    Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
      if (aliases.includes(headerKey) && obj[field] === undefined) {
        // Date cells ko String me badal dena unhe kharab kar deta hai
        obj[field] = RAW_VALUE_FIELDS.has(field) ? value : String(value).trim();
      }
    });
  });

  return obj;
};

/**
 * Sheet ki date cell ko JS Date me badalta hai.
 *
 * Teen soortein aati hain:
 *   - Date object   (XLSX 'cellDates' se, aam taur par yehi)
 *   - Excel serial  (number, jaise 45920 -- agar cell text formatted ho)
 *   - String        ('2026-09-19', '9/19/2026')
 *
 * Samajh na aaye to null -- taake kachra date DB me na jaye.
 */

/** Sirf calendar din mayne rakhta hai, waqt nahi -- is liye UTC aadhi raat */
const utcMidnight = (year, month, day) => new Date(Date.UTC(year, month, day));

const parseSheetDate = (value) => {
  if (value === undefined || value === null || value === '') return null;

  // Excel serial number: 1899-12-30 se din (pehle se UTC me)
  if (typeof value === 'number' && value > 0 && value < 100000) {
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    // Pehle se UTC aadhi raat hai to chhero mat
    if (value.getUTCHours() === 0 && value.getUTCMinutes() === 0) return value;

    return utcMidnight(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  if (!text) return null;

  // "2026-09-16" -- seedha adad se, taake timezone dakhal na de
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return utcMidnight(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;

  /**
   * "9/16/2026" jaisi string LOCAL aadhi raat banti hai. Usay seedha rakh dein
   * to UTC me badalte waqt din peechhe chala jata hai (16 -> 15). Is liye local
   * din/mahina/saal le kar dobara UTC aadhi raat banate hain.
   */
  return utcMidnight(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Sheet me header row dhoondta hai.
 * Aapki sheet me kuch tabs ke upar title/notes hote hain (jaise "Overview" tab),
 * is liye hum pehli 15 rows me aisi row dhoondte hain jis me "name" ho
 * aur sath me email/city/category me se koi ek ho.
 */
const findHeaderRow = (rows) => {
  const limit = Math.min(rows.length, 15);

  for (let i = 0; i < limit; i += 1) {
    const keys = (rows[i] || []).map(normalizeKey);

    const hasName = keys.some((k) => COLUMN_ALIASES.name.includes(k));
    const hasOther = keys.some(
      (k) =>
        COLUMN_ALIASES.email.includes(k) ||
        COLUMN_ALIASES.city.includes(k) ||
        COLUMN_ALIASES.category.includes(k)
    );

    if (hasName && hasOther) {
      return { index: i, keys };
    }
  }

  return null;
};

/** Standard error response */
const fail = (res, error, status = 500) => {
  console.error('[ContactController]', error);
  return res.status(status).json({
    success: false,
    message: error.message || 'Internal server error',
  });
};

/**
 * Filters ek hi jagah banti hain — list endpoint aur export dono isay use karte hain,
 * taake "jo table me dikh raha hai wohi download ho" ka waada hamesha sacha rahe.
 */
const buildContactQuery = (q = {}) => {
  const { category, status, city, search, hasEmail, lastContactFrom, lastContactTo } = q;
  const query = {};

  if (category && category !== 'All') query.category = category;

  /**
   * Status comma se alag ho kar ek se ziyada bhi aa sakta hai:
   *   ?status=Follow-up 1,Follow-up 2
   * (dashboard ka "Follow-ups Pending" card dono statuses ginta hai)
   */
  if (status && status !== 'All') {
    const statusList = String(status)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (statusList.length > 1) query.status = { $in: statusList };
    else if (statusList.length === 1) query.status = statusList[0];
  }

  if (city && city !== 'All') query.city = city;
  if (hasEmail === 'true') query.hasEmail = true;
  if (hasEmail === 'false') query.hasEmail = false;

  /**
   * Last contact date ki range.
   *  - From wale din ki subah 00:00 se
   *  - To wale din ki raat 23:59 tak (taake us din wale contacts bhi aa jayen)
   *
   * NOTE: "Not Contacted" contacts ki lastContactDate null hoti hai, is liye
   * date filter lagate hi wo apne aap bahar ho jate hain — aur yehi durust hai,
   * kyunke unse abhi raabta hua hi nahi.
   */
  const dateRange = {};

  if (lastContactFrom) {
    const from = new Date(lastContactFrom);
    if (!Number.isNaN(from.getTime())) {
      from.setHours(0, 0, 0, 0);
      dateRange.$gte = from;
    }
  }

  if (lastContactTo) {
    const to = new Date(lastContactTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      dateRange.$lte = to;
    }
  }

  if (Object.keys(dateRange).length > 0) query.lastContactDate = dateRange;

  if (search && String(search).trim()) {
    const regex = { $regex: String(search).trim(), $options: 'i' };
    query.$or = [{ name: regex }, { email: regex }, { city: regex }];
  }

  return query;
};

/* ================================================================== */
/*  1. LIST CONTACTS (filters + search + pagination + sorting)         */
/* ================================================================== */

const getContacts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 25,
      category,
      status,
      city,
      search,
      hasEmail,
      sortField = 'createdAt',
      order = 'desc',
    } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 500);
    const skip = (page - 1) * limit;

    // Filters ek hi helper se bante hain (export bhi wohi use karta hai)
    const query = buildContactQuery(req.query);

    const sort = { [sortField]: order === 'asc' ? 1 : -1 };

    const [data, totalRecords] = await Promise.all([
      contactModel.find(query).sort(sort).skip(skip).limit(limit),
      contactModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      totalRecords,
      perPage: limit,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit) || 1,
      data,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  2. SINGLE CONTACT                                                  */
/* ================================================================== */

const getContactById = async (req, res) => {
  try {
    const contact = await contactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  3. CREATE                                                          */
/* ================================================================== */

const createContact = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.name || !payload.category) {
      return res.status(400).json({
        success: false,
        message: 'Both name and category are required',
      });
    }

    if (!CATEGORIES.includes(payload.category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      });
    }

    const status = payload.status || 'Not Contacted';

    const contact = new contactModel({
      ...payload,
      status,
      // "Not Contacted" par koi date nahi lagti
      lastContactDate:
        payload.lastContactDate || (status === 'Not Contacted' ? null : new Date()),
    });

    // Agar user ne khud nextFollowUpDate nahi di to cadence se calculate karo
    if (!payload.nextFollowUpDate) {
      contact.nextFollowUpDate = nextFollowUpFor(contact.status, contact.lastContactDate);
    }

    await contact.save();

    return res.status(201).json({
      success: true,
      message: 'Contact added',
      data: contact,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  4. UPDATE (status / dates / notes / details)                       */
/* ================================================================== */

const updateContact = async (req, res) => {
  try {
    const contact = await contactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const payload = req.body;
    const statusChanged = payload.status && payload.status !== contact.status;

    // Sirf allowed fields update karo
    const editable = [
      'name',
      'contactPerson',
      'city',
      'category',
      'address',
      'phone',
      'website',
      'email',
      'status',
      'notes',
    ];

    editable.forEach((field) => {
      if (payload[field] !== undefined) contact[field] = payload[field];
    });

    if (payload.lastContactDate !== undefined) {
      contact.lastContactDate = payload.lastContactDate ? new Date(payload.lastContactDate) : null;
    }

    /**
     * "Not Contacted" se nikal kar kisi bhi active status par jate waqt,
     * agar lastContactDate khali hai to aaj ki date laga do — warna
     * follow-up kis din se ginein?
     */
    if (statusChanged && contact.status !== 'Not Contacted' && !contact.lastContactDate) {
      contact.lastContactDate = new Date();
    }

    // Wapas "Not Contacted" par jayen to dates saaf ho jati hain
    if (statusChanged && contact.status === 'Not Contacted') {
      contact.lastContactDate = null;
      contact.nextFollowUpDate = null;
    }

    /**
     * nextFollowUpDate ki logic:
     *  - Agar user ne explicitly bheji hai -> wohi use karo (manual override)
     *  - Warna agar status badla hai -> cadence se dobara calculate karo
     */
    if (payload.nextFollowUpDate !== undefined) {
      contact.nextFollowUpDate = payload.nextFollowUpDate
        ? new Date(payload.nextFollowUpDate)
        : null;
    } else if (statusChanged) {
      contact.nextFollowUpDate = nextFollowUpFor(contact.status, contact.lastContactDate);
    }

    // color hamesha status se derive hota hai (pre-save hook bhi lagata hai)
    contact.color = colorForStatus(contact.status);

    await contact.save();

    return res.status(200).json({
      success: true,
      message: 'Contact updated',
      data: contact,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  5. QUICK STATUS UPDATE (table se direct)                           */
/* ================================================================== */

const updateContactStatus = async (req, res) => {
  try {
    const { status, lastContactDate } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUSES.join(', ')}`,
      });
    }

    const contact = await contactModel.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    contact.status = status;

    if (status === 'Not Contacted') {
      // Wapas shuru wali position par — dates saaf
      contact.lastContactDate = null;
      contact.nextFollowUpDate = null;
    } else {
      // Status badalne par last contact date aaj ki ho jati hai (ya jo user de)
      contact.lastContactDate = lastContactDate ? new Date(lastContactDate) : new Date();
      contact.nextFollowUpDate = nextFollowUpFor(status, contact.lastContactDate);
    }

    contact.color = colorForStatus(status);

    await contact.save();

    return res.status(200).json({
      success: true,
      message: `Status set to "${status}"`,
      data: contact,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  6. DELETE (single + bulk)                                          */
/* ================================================================== */

const deleteContact = async (req, res) => {
  try {
    const result = await contactModel.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    return res.status(200).json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    return fail(res, error);
  }
};

const bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'An "ids" array is required' });
    }

    const result = await contactModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} contacts delete ho gaye`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  7. IMPORT EXCEL / CSV                                              */
/* ================================================================== */

const importContacts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded. The field name must be "file".',
      });
    }

    // Agar user ne UI se category force ki hai (e.g. "Colleges" sheet upload kar rahe hain)
    const categoryOverride = CATEGORIES.includes(req.body.categoryOverride)
      ? req.body.categoryOverride
      : null;

    // Buffer se workbook parse karo (.xlsx aur .csv dono chalti hain)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });

    const summary = {
      fileName: req.file.originalname,
      sheetsProcessed: [],
      sheetsSkipped: [],
      totalRows: 0,
      inserted: 0,
      updated: 0,
      duplicates: 0,
      skippedNoName: 0,
      skippedNoCategory: 0,
      withSheetStatus: 0,
    };

    const toInsert = [];

    // Har sheet par loop (aapki file me Overview / Soccer / Colleges / Schools tabs hain)
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });

      const header = findHeaderRow(rows);

      // Jis sheet me proper headers nahi (jaise "Overview") usay skip kar do
      if (!header) {
        summary.sheetsSkipped.push({ sheet: sheetName, reason: 'No valid header row found' });
        continue;
      }

      // Sheet ke naam se bhi category ka andaza lagta hai ("Colleges & Universities" -> Colleges)
      const sheetCategory = mapCategory(sheetName);
      let sheetInserted = 0;

      for (let i = header.index + 1; i < rows.length; i += 1) {
        const raw = rowToObject(header.keys, rows[i]);
        summary.totalRows += 1;

        if (!raw.name) {
          summary.skippedNoName += 1;
          continue;
        }

        /**
         * Category priority:
         *   1) User ka manual override
         *   2) Sheet ka naam       (aapki file me yeh sab se reliable hai)
         *   3) Row ka Category column
         */
        const category = categoryOverride || sheetCategory || mapCategory(raw.category);

        if (!category) {
          summary.skippedNoCategory += 1;
          continue;
        }

        const email = (raw.email || '').trim().toLowerCase();

        /**
         * Status aur dates: agar sheet me hain to WOHI chalti hain.
         *
         * Sheet khali ho ya samajh na aaye to hi "Not Contacted" lagta hai --
         * kyunke import ka matlab sirf "list me aa gaya" hai.
         */
        const status = normalizeStatus(raw.status) || 'Not Contacted';
        const isFresh = status === 'Not Contacted';

        // "Not Contacted" par koi date nahi hoti -- baqi app me bhi yehi usool hai
        const lastContactDate = isFresh ? null : parseSheetDate(raw.lastContactDate);

        /**
         * Follow-up date: sheet wali pehle. Na ho magar status active ho aur
         * last contact maloom ho, to cadence se khud nikal lo.
         */
        let nextFollowUpDate = isFresh ? null : parseSheetDate(raw.nextFollowUpDate);
        if (!nextFollowUpDate && !isFresh && lastContactDate) {
          nextFollowUpDate = nextFollowUpFor(status, lastContactDate);
        }

        if (!isFresh) summary.withSheetStatus += 1;

        toInsert.push({
          name: raw.name,
          contactPerson: raw.contactPerson || '',
          city: raw.city || '',
          country: raw.country || 'USA',
          category,
          rawCategory: raw.category || sheetName,
          address: raw.address || '',
          phone: raw.phone || '',
          website: raw.website || '',
          email,
          hasEmail: Boolean(email),
          notes: raw.notes || '',

          status,
          color: colorForStatus(status),
          lastContactDate,
          nextFollowUpDate,
        });

        sheetInserted += 1;
      }

      summary.sheetsProcessed.push({ sheet: sheetName, rows: sheetInserted, category: sheetCategory || categoryOverride || 'row-based' });
    }

    if (toInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found in the file. Check these columns: Name, City, Category, Address, Phone, Website, Email',
        summary,
      });
    }

    /* ---- Duplicate prevention + SMART MERGE ----
     *
     * Ek contact do tarah se match hota hai:
     *   1) email se (agar dono ke paas email ho)
     *   2) name + city se
     *
     * Dono me se koi bhi match ho jaye to naya row NAHI banta. Ye zaroori hai:
     * agar kisi contact ka email pehle khali tha aur manager naye sheet me email
     * bhej de, to sirf email match karne se wo "naya" lagta aur duplicate ban jata.
     *
     * Match hone par hum sirf KHALI fields bharte hain (smart merge).
     * Jo field pehle se bhari hai usay haath nahi lagta. Status bhi tabhi lagta
     * hai jab purana contact abhi "Not Contacted" ho — yani aap ki app ke andar
     * ki gayi progress purani sheet se kabhi peechhe nahi jati.
     */
    const MERGEABLE_FIELDS = ['email', 'phone', 'website', 'address', 'contactPerson'];

    const existing = await contactModel
      .find({}, 'email name city phone website address contactPerson status lastContactDate nextFollowUpDate')
      .lean();

    const nameCityKeyOf = (name, city) =>
      `${(name || '').trim().toLowerCase()}|${(city || '').trim().toLowerCase()}`;

    // Dono lookups ek hi record ki taraf ishara karte hain
    const byEmail = new Map();
    const byNameCity = new Map();

    existing.forEach((c) => {
      if (c.email) byEmail.set(c.email, c);
      byNameCity.set(nameCityKeyOf(c.name, c.city), c);
    });

    const unique = []; // naye contacts (insertMany ke liye)
    const updateOps = []; // purane contacts ke khali fields bharne ke liye

    for (const item of toInsert) {
      const key = nameCityKeyOf(item.name, item.city);
      const match = (item.email && byEmail.get(item.email)) || byNameCity.get(key);

      if (match) {
        // Sirf wo fields jo purane record me KHALI hain aur naye me maujood hain
        const fill = {};

        MERGEABLE_FIELDS.forEach((field) => {
          const oldValue = String(match[field] || '').trim();
          const newValue = String(item[field] || '').trim();

          if (!oldValue && newValue) fill[field] = newValue;
        });

        if (fill.email) fill.hasEmail = true;

        /**
         * Status sirf tab lagta hai jab purana contact abhi tak "Not Contacted" ho.
         *
         * Yani sheet khali khana bhar sakti hai, magar aap ka kaam kabhi mita
         * nahi sakti -- agar aap pehle hi "Replied" par pohanch chuke hain to
         * purani sheet ka "Email Sent" usay peechhe nahi kheenchega.
         */
        const oldStatus = match.status || 'Not Contacted';

        if (oldStatus === 'Not Contacted' && item.status !== 'Not Contacted') {
          fill.status = item.status;
          fill.color = colorForStatus(item.status);
          if (item.lastContactDate) fill.lastContactDate = item.lastContactDate;
          if (item.nextFollowUpDate) fill.nextFollowUpDate = item.nextFollowUpDate;
        } else {
          // Status wohi rehne do, sirf khali dates bhar do
          if (!match.lastContactDate && item.lastContactDate) fill.lastContactDate = item.lastContactDate;
          if (!match.nextFollowUpDate && item.nextFollowUpDate) fill.nextFollowUpDate = item.nextFollowUpDate;
        }

        if (Object.keys(fill).length === 0) {
          // Bilkul wohi data — kuch karne ki zaroorat nahi
          summary.duplicates += 1;
        } else {
          Object.assign(match, fill); // local copy bhi update karo

          if (match._id) {
            // DB me maujood contact
            updateOps.push({ updateOne: { filter: { _id: match._id }, update: { $set: fill } } });
          }
          // (agar match._id nahi hai to ye isi file ka pending row hai —
          //  upar Object.assign se hi merge ho gaya, alag update ki zaroorat nahi)

          if (fill.email) byEmail.set(fill.email, match);
          summary.updated += 1;
        }

        continue;
      }

      // Bilkul naya contact — isi file ke andar ke duplicates bhi rok do
      if (item.email) byEmail.set(item.email, item);
      byNameCity.set(key, item);

      unique.push(item);
    }

    if (unique.length > 0) {
      await contactModel.insertMany(unique, { ordered: false });
    }

    if (updateOps.length > 0) {
      await contactModel.bulkWrite(updateOps);
    }

    summary.inserted = unique.length;

    return res.status(201).json({
      success: true,
      message:
        `${summary.inserted} contacts added` +
        `, ${summary.updated} existing contacts updated` +
        `, ${summary.duplicates} already present`,
      summary,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  8. FILTER OPTIONS (dropdowns ke liye)                              */
/* ================================================================== */

const getFilterOptions = async (req, res) => {
  try {
    const cities = await contactModel.distinct('city', { city: { $ne: '' } });

    return res.status(200).json({
      success: true,
      data: {
        cities: cities.sort(),
        categories: CATEGORIES,
        statuses: STATUSES,
        statusColors: STATUS_COLORS,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  9. EMAIL TEMPLATE (placeholders filled)                            */
/* ================================================================== */

const getContactTemplate = async (req, res) => {
  try {
    const contact = await contactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const type = req.query.type || 'initial';
    const sender = {
      name: req.query.senderName,
      title: req.query.senderTitle,
    };

    if (!['initial', 'followUp1', 'followUp2'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be one of: initial | followUp1 | followUp2',
      });
    }

    // Teeno versions bhej dete hain taake modal me tabs instantly switch hon
    const all = {
      initial: renderTemplate(contact, 'initial', sender),
      followUp1: renderTemplate(contact, 'followUp1', sender),
      followUp2: renderTemplate(contact, 'followUp2', sender),
    };

    return res.status(200).json({
      success: true,
      data: {
        contact,
        selected: all[type],
        templates: all,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/** Raw templates (bina fill kiye) — reference page ke liye */
const getAllTemplates = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        initial: TEMPLATES,
        followUps: FOLLOW_UPS,
        placeholders: [
          '[Organization Name]',
          '[City]',
          '[Contact Name]',
          '[Your Name]',
          '[Your Title]',
          '[Original Subject]',
        ],
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  10. DASHBOARD STATS                                                */
/* ================================================================== */

const getStats = async (req, res) => {
  try {
    const [totalContacts, byStatusRaw, byCategoryRaw, byCityRaw, withEmail] = await Promise.all([
      contactModel.countDocuments(),
      contactModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      contactModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      // City ke sath mulk bhi. Purane contacts me country field nahi hai,
      // is liye $ifNull unhe 'USA' maan leta hai (DB me kuch likhe baghair).
      contactModel.aggregate([
        {
          $group: {
            _id: { city: '$city', country: { $ifNull: ['$country', 'USA'] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      contactModel.countDocuments({ hasEmail: true }),
    ]);

    // Aggregation result ko aasan object me badlo
    const statusCounts = {};
    STATUSES.forEach((s) => {
      statusCounts[s] = 0;
    });
    byStatusRaw.forEach((row) => {
      if (row._id) statusCounts[row._id] = row.count;
    });

    const categoryCounts = {};
    CATEGORIES.forEach((c) => {
      categoryCounts[c] = 0;
    });
    byCategoryRaw.forEach((row) => {
      if (row._id) categoryCounts[row._id] = row.count;
    });

    // Aaj ki date ka start (taake "overdue" theek se calculate ho)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const overdueCount = await contactModel.countDocuments({
      nextFollowUpDate: { $ne: null, $lt: startOfToday },
    });

    // Bina parhe replies (auto-reply shumar nahi hote)
    const unreadReplyRows = await contactModel.aggregate([
      { $unwind: '$replies' },
      { $match: { 'replies.isRead': false, 'replies.isAutoReply': false } },
      { $count: 'total' },
    ]);

    const newReplies = unreadReplyRows.length ? unreadReplyRows[0].total : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalContacts,
        withEmail,
        withoutEmail: totalContacts - withEmail,

        // Dashboard cards
        cards: {
          totalContacts,
          notContacted: statusCounts['Not Contacted'],
          emailsSent: statusCounts['Email Sent'],
          followUpsPending: statusCounts['Follow-up 1'] + statusCounts['Follow-up 2'],
          replied: statusCounts.Replied,
          dealsClosed: statusCounts['Deal Closed'],
          noReply: statusCounts['No Reply'],
          overdue: overdueCount,
          newReplies,
        },

        // Bar chart ke liye
        byStatus: STATUSES.map((status) => ({
          status,
          count: statusCounts[status],
          color: STATUS_COLORS[status],
        })),

        // Pie chart ke liye
        byCategory: CATEGORIES.map((category) => ({
          category,
          count: categoryCounts[category],
        })),

        byCity: byCityRaw.map((row) => ({
          city: row._id.city || 'Unknown',
          country: row._id.country || 'USA',
          count: row.count,
        })),
      },
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  11. UPCOMING FOLLOW-UPS                                            */
/* ================================================================== */

const getUpcomingFollowUps = async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = { nextFollowUpDate: { $ne: null } };

    /**
     * Do tareeqe se list banti hai:
     *
     *  1. Date range (from / to)  -- jab user dashboard par date chunta hai.
     *     Sirf usi range ki follow-ups aati hain, kuch aur nahi.
     *
     *  2. Warna default: aaj se "days" din aage tak, aur pichhli saari
     *     overdue bhi -- taake koi chhoot na jaye.
     *
     * Waqt ka hisaab wohi hai jo Contacts page ke date filter me hai:
     * "from" wale din ki subah 00:00 se, "to" wale din ki raat 23:59 tak.
     */
    if (from || to) {
      const range = { $ne: null };

      if (from) {
        const f = new Date(from);
        if (!Number.isNaN(f.getTime())) {
          f.setHours(0, 0, 0, 0);
          range.$gte = f;
        }
      }

      if (to) {
        const t = new Date(to);
        if (!Number.isNaN(t.getTime())) {
          t.setHours(23, 59, 59, 999);
          range.$lte = t;
        }
      }

      query.nextFollowUpDate = range;
    } else {
      const days = parseInt(req.query.days, 10) || 2;

      const until = addDays(new Date(), days);
      until.setHours(23, 59, 59, 999);

      query.nextFollowUpDate = { $ne: null, $lte: until };
    }

    const contacts = await contactModel
      .find(query)
      .sort({ nextFollowUpDate: 1 })
      .limit(parseInt(req.query.limit, 10) || 50);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Har row par batate hain ke overdue hai ya nahi
    const data = contacts.map((c) => ({
      ...c.toObject(),
      isOverdue: c.nextFollowUpDate < startOfToday,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      filtered: Boolean(from || to),
      data,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  12. EXPORT — CSV / Excel (Google Sheets) / PDF                     */
/* ================================================================== */

/**
 * Export columns.
 * `pdfWidth: 0` ka matlab: ye column PDF me nahi aata — PDF ka page chhota
 * hota hai, sab kuch daal dein to har cell nichur jata hai.
 */
const EXPORT_COLUMNS = [
  { key: 'name', label: 'Name', pdfWidth: 175 },
  { key: 'city', label: 'City', pdfWidth: 62 },
  { key: 'country', label: 'Country', pdfWidth: 45 },
  { key: 'category', label: 'Category', pdfWidth: 50 },
  { key: 'email', label: 'Email', pdfWidth: 165 },
  { key: 'phone', label: 'Phone', pdfWidth: 74 },
  { key: 'website', label: 'Website', pdfWidth: 0 },
  { key: 'address', label: 'Address', pdfWidth: 0 },
  { key: 'status', label: 'Status', pdfWidth: 68 },
  { key: 'lastContactDate', label: 'Last Contact', pdfWidth: 58, date: true },
  { key: 'nextFollowUpDate', label: 'Next Follow-up', pdfLabel: 'NEXT F/UP', pdfWidth: 62, date: true },
  { key: 'notes', label: 'Notes', pdfWidth: 0 },
];

const exportContacts = async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();

    // Bilkul wohi filters jo Contacts page par lage huay hain
    const query = buildContactQuery(req.query);

    const contacts = await contactModel.find(query).sort({ name: 1 }).limit(5000).lean();

    const fileName = 'xportyn-contacts-' + new Date().toISOString().slice(0, 10);

    const cell = (contact, col) => {
      const value = contact[col.key];
      if (col.date) return value ? new Date(value).toISOString().slice(0, 10) : '';
      return value === undefined || value === null ? '' : String(value);
    };

    /* ----------------------------- CSV ----------------------------- */
    if (format === 'csv') {
      const esc = (text) => '"' + String(text).replace(/"/g, '""') + '"';

      const lines = [EXPORT_COLUMNS.map((col) => esc(col.label)).join(',')];
      contacts.forEach((contact) => {
        lines.push(EXPORT_COLUMNS.map((col) => esc(cell(contact, col))).join(','));
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '.csv"');

      // BOM lagana zaroori hai, warna Excel me special characters kharab dikhte hain
      return res.send('﻿' + lines.join('\r\n'));
    }

    /* -------------------- Excel / Google Sheets --------------------
     *
     * ExcelJS use karte hain kyunke `xlsx` library ka free version cell ke
     * colors LIKH nahi sakta (parh sakta hai, likh nahi). Import ke liye
     * `xlsx` hi theek hai, is liye wo waise ka waisa chal raha hai.
     *
     * Google Sheets me import karne par ye colors barqarar rehte hain.
     */
    if (format === 'xlsx' || format === 'excel' || format === 'sheets') {
      const book = new ExcelJS.Workbook();
      book.creator = 'Xportyn Sales Tracker';
      book.created = new Date();

      const sheet = book.addWorksheet('Contacts', {
        // Header row hamesha upar chipki rahe, scroll karne par bhi
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = EXPORT_COLUMNS.map((col) => ({
        header: col.label,
        key: col.key,
        width: col.key === 'name' ? 34 : col.key === 'email' ? 28 : 18,
      }));

      /* ---- Header row: gehra background, safaid bold text ---- */
      const headerRow = sheet.getRow(1);
      headerRow.height = 20;

      headerRow.eachCell((c) => {
        c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        c.alignment = { vertical: 'middle' };
      });

      // '#rrggbb' ko ExcelJS wale 'FFrrggbb' me badalta hai
      const argb = (hex) => 'FF' + hex.replace('#', '').toUpperCase();

      const statusIndex = EXPORT_COLUMNS.findIndex((col) => col.key === 'status') + 1;

      /* ---- Har contact ki row, status ke rang me ---- */
      contacts.forEach((contact) => {
        const values = {};
        EXPORT_COLUMNS.forEach((col) => {
          values[col.key] = cell(contact, col);
        });

        const row = sheet.addRow(values);
        const palette = STATUS_PDF_COLORS[contact.status] || STATUS_PDF_COLORS['No Reply'];

        row.eachCell({ includeEmpty: true }, (c, colNumber) => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(palette.row) } };
          c.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

          if (colNumber === statusIndex) {
            // Status apne rang me aur bold
            c.font = { size: 9, bold: true, color: { argb: argb(palette.text) } };
          } else if (colNumber === 1) {
            // Naam -- gehra rang, magar bold nahi
            c.font = { size: 9, color: { argb: 'FF0F172A' } };
          } else {
            c.font = { size: 9, color: { argb: 'FF334155' } };
          }
        });
      });

      // Header par filter dropdowns — user khud sort/filter kar sake
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: EXPORT_COLUMNS.length },
      };

      const buffer = await book.xlsx.writeBuffer();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '.xlsx"');
      return res.send(Buffer.from(buffer));
    }

    /* ----------------------------- PDF ----------------------------- */
    if (format === 'pdf') {
      /**
       * Sab se pehle serial number ka column (1, 2, 3 ...).
       * Ye sirf PDF me hota hai — Excel/Sheets me row numbers khud aate hain,
       * aur CSV me kisi kaam ka nahi. Is liye EXPORT_COLUMNS me nahi daala.
       */
      const INDEX_COLUMN = { key: '__index', label: '#', pdfLabel: '#', pdfWidth: 24 };

      const cols = [INDEX_COLUMN].concat(EXPORT_COLUMNS.filter((col) => col.pdfWidth > 0));
      const tableWidth = cols.reduce((sum, col) => sum + col.pdfWidth, 0);

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 28,
        bufferPages: true, // page numbers aakhir me lagane ke liye zaroori
        info: { Title: 'XPORTYN Contacts', Author: 'Xportyn' },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '.pdf"');
      doc.pipe(res);

      const left = doc.page.margins.left;
      const pageWidth = doc.page.width - left * 2;
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 26;

      const ROW_HEIGHT = 18;

      // Summary ke liye har status ki ginti
      const counts = {};
      STATUSES.forEach((s) => {
        counts[s] = 0;
      });
      contacts.forEach((c) => {
        if (counts[c.status] !== undefined) counts[c.status] += 1;
      });

      /* ---------------- Upar ka brand band ---------------- */
      const drawBrandBar = () => {
        doc.rect(left, 24, pageWidth, 32).fillColor('#1f47f5').fill();

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff');
        doc.text('XPORTYN', left + 12, 33, { lineBreak: false });

        doc.font('Helvetica').fontSize(8).fillColor('#dbe4ff');
        doc.text('Sales Contacts', left + 88, 37, { lineBreak: false });

        doc.fontSize(8).fillColor('#ffffff');
        doc.text(
          contacts.length + ' contacts   ·   ' + new Date().toLocaleDateString('en-GB'),
          left,
          37,
          { width: pageWidth - 12, align: 'right', lineBreak: false }
        );
      };

      /* ------- Status ki ginti — rangeen chips (legend ka kaam bhi deti hain) ------- */
      const drawSummary = (y) => {
        const chips = [];

        STATUSES.forEach((status) => {
          if (counts[status] > 0) {
            chips.push({
              label: status + ': ' + counts[status],
              color: (STATUS_PDF_COLORS[status] || STATUS_PDF_COLORS['No Reply']).dot,
            });
          }
        });

        let x = left;
        doc.font('Helvetica').fontSize(6.5);

        chips.forEach((chip) => {
          const w = doc.widthOfString(chip.label) + 20;

          // Agar line bhar gayi to agli line par
          if (x + w > left + pageWidth) return;

          doc.roundedRect(x, y, w, 13, 6.5).fillColor('#f1f5f9').fill();
          doc.circle(x + 8, y + 6.5, 2.6).fillColor(chip.color).fill();
          doc.fillColor('#334155').text(chip.label, x + 14, y + 3.6, { lineBreak: false });

          x += w + 5;
        });

        return y + 13;
      };

      /* ---------------- Table ka header band ---------------- */
      const drawTableHeader = (y) => {
        doc.rect(left, y, tableWidth, 18).fillColor('#0f172a').fill();

        let x = left;
        doc.font('Helvetica-Bold').fontSize(6.2).fillColor('#ffffff');

        cols.forEach((col) => {
          const isIndex = col.key === '__index';

          doc.text(col.pdfLabel || col.label.toUpperCase(), x + (isIndex ? 2 : 5), y + 5.5, {
            width: col.pdfWidth - (isIndex ? 4 : 8),
            align: isIndex ? 'center' : 'left',
            ellipsis: true,
            lineBreak: false,
          });
          x += col.pdfWidth;
        });

        doc.font('Helvetica');
        return y + 18;
      };

      /* ---------------- Ek row (status ke rang me) ---------------- */
      const drawRow = (contact, y, serial) => {
        const palette = STATUS_PDF_COLORS[contact.status] || STATUS_PDF_COLORS['No Reply'];

        // Row ka background
        doc.rect(left, y, tableWidth, ROW_HEIGHT).fillColor(palette.row).fill();

        // Shuru me rangeen patti — dur se hi pata chal jaye kaun se stage par hai
        doc.rect(left, y, 2.5, ROW_HEIGHT).fillColor(palette.dot).fill();

        let x = left;
        doc.fontSize(6.4);

        cols.forEach((col) => {
          const isIndex = col.key === '__index';
          const isStatus = col.key === 'status';
          const isName = col.key === 'name';

          const value = isIndex ? String(serial) : cell(contact, col) || '-';

          if (isIndex) {
            doc.font('Helvetica').fillColor('#94a3b8');
          } else if (isStatus) {
            doc.font('Helvetica-Bold').fillColor(palette.text);
          } else if (isName) {
            doc.font('Helvetica').fillColor('#0f172a');
          } else {
            doc.font('Helvetica').fillColor('#475569');
          }

          doc.text(value, x + (isIndex ? 2 : 6), y + 5.5, {
            width: col.pdfWidth - (isIndex ? 4 : 9),
            align: isIndex ? 'center' : 'left',
            ellipsis: true,
            lineBreak: false,
          });

          x += col.pdfWidth;
        });

        doc.font('Helvetica');

        // Halki si line taake rows alag alag nazar aayen
        doc
          .moveTo(left, y + ROW_HEIGHT)
          .lineTo(left + tableWidth, y + ROW_HEIGHT)
          .lineWidth(0.3)
          .strokeColor('#e2e8f0')
          .stroke();

        return y + ROW_HEIGHT;
      };

      /* ---------------- Page banane ka silsila ---------------- */
      let y = 0;

      const startPage = (isFirst) => {
        if (!isFirst) doc.addPage();

        drawBrandBar();
        y = 66;

        // Summary sirf pehle page par
        if (isFirst) y = drawSummary(y) + 8;

        y = drawTableHeader(y);
      };

      startPage(true);

      contacts.forEach((contact, index) => {
        if (y + ROW_HEIGHT > bottomLimit) startPage(false);
        // Numbering pages ke aar paar chalti rehti hai (1, 2, 3 ... 300)
        y = drawRow(contact, y, index + 1);
      });

      /* ---------------- Har page par footer ----------------
       *
       * AHEM: PDFKit jab bottom margin se NEECHE text likhta hai to khud
       * ba khud naya page bana deta hai — isi wajah se pehle PDF ke aakhir
       * me khali pages aa rahe thay (footer ke do text calls = do extra pages).
       *
       * Hal: footer likhte waqt bottom margin arzi taur par 0 kar dete hain,
       * phir wapas bahal kar dete hain.
       */
      const range = doc.bufferedPageRange();

      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(range.start + i);

        const savedBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        const footerY = doc.page.height - 24;

        doc
          .moveTo(left, footerY - 7)
          .lineTo(left + pageWidth, footerY - 7)
          .lineWidth(0.4)
          .strokeColor('#e2e8f0')
          .stroke();

        doc.font('Helvetica').fontSize(6.5).fillColor('#94a3b8');

        doc.text('www.xportyn.com   ·   info@xportyn.com   ·   +92 329 1475692', left, footerY, {
          width: pageWidth,
          align: 'left',
          lineBreak: false,
        });

        doc.text('Page ' + (i + 1) + ' of ' + range.count, left, footerY, {
          width: pageWidth,
          align: 'right',
          lineBreak: false,
        });

        doc.page.margins.bottom = savedBottomMargin;
      }

      return doc.end();
    }

    return res.status(400).json({
      success: false,
      message: 'format must be one of: csv | xlsx | pdf',
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  13. EMAIL BHEJNA (app khud bhejti hai, mail client se nahi)        */
/* ================================================================== */

/**
 * Kaunsa template bheja to status kya banega.
 * Isi se follow-up date bhi khud lag jati hai (cadence ke mutabiq).
 */
const STATUS_AFTER_SEND = {
  initial: 'Email Sent',
  followUp1: 'Follow-up 1',
  followUp2: 'Follow-up 2',
};

const sendContactEmail = async (req, res) => {
  try {
    const { type = 'initial', senderName, senderTitle, subject, body } = req.body;

    if (!STATUS_AFTER_SEND[type]) {
      return res.status(400).json({
        success: false,
        message: 'type must be one of: initial | followUp1 | followUp2',
      });
    }

    if (!isMailerReady()) {
      return res.status(503).json({ success: false, message: mailerSetupMessage() });
    }

    const contact = await contactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (!contact.email) {
      return res.status(400).json({
        success: false,
        message: 'This contact has no email address - reach out by phone or website instead',
      });
    }

    // Template render karo. Agar user ne modal me subject/body edit kiya ho
    // to uska bheja hua matn use hota hai.
    const rendered = renderTemplate(contact, type, { name: senderName, title: senderTitle });

    const finalSubject = (subject || rendered.subject).trim();
    const finalBody = body || rendered.body;

    const transporter = getTransporter();

    /**
     * Message ek hi dafa banate hain aur do jagah use karte hain:
     *   1) SMTP se bhejne ke liye
     *   2) bilkul wohi copy Sent folder me rakhne ke liye
     *
     * Dobara banate to Message-ID aur Date alag ho jate, aur Sent wali copy
     * asal bheji hui email se mukhtalif hoti.
     */
    /**
     * Deliverability ke liye do faislay:
     *
     * 1) Default me SIRF plain text bhejte hain, HTML nahi.
     *    Wajah: HTML wali cold email "marketing" lagti hai aur spam filters
     *    usay zyada sakhti se dekhte hain. Hamare template me sirf lines aur
     *    bullets hain -- plain text me bilkul waisi hi nazar aati hai, magar
     *    "kisi bande ki likhi hui email" lagti hai. HTML chahiye to .env me
     *    MAIL_HTML=true kar dein.
     *
     * 2) Reply-To sirf tab lagate hain jab wo From se alag ho. Dono ek jaise
     *    hon to ye header faltu hai aur kuch filters isay shak se dekhte hain.
     */
    const useHtml = String(process.env.MAIL_HTML || "false") === "true";
    const replyToAddress = process.env.MAIL_REPLY_TO || "";

    const mailOptions = {
      from: getFromAddress(),
      to: contact.email,
      bcc: getBccAddress() || undefined,
      subject: finalSubject,
      text: finalBody,
    };

    if (useHtml) mailOptions.html = textToHtml(finalBody);

    // Sirf tab jab wo From se waqai alag ho
    if (replyToAddress && replyToAddress !== getFromEmail()) {
      mailOptions.replyTo = replyToAddress;
    }

    const rawMessage = await buildRawMessage(mailOptions);

    const envelopeTo = [contact.email];
    if (getBccAddress()) envelopeTo.push(getBccAddress());

    const info = await transporter.sendMail({
      envelope: { from: getFromEmail(), to: envelopeTo },
      raw: rawMessage,
    });

    /**
     * Ab wohi copy Sent folder me rakh dete hain.
     * Email ja chuki hai, is liye yahan nakaami par poora request fail NAHI karte —
     * sirf log kar dete hain aur jawab me bata dete hain.
     */
    const sentSave = await saveToSentFolder(rawMessage);

    if (isSentSaveEnabled() && !sentSave.ok) {
      console.warn('[sendContactEmail] ' + sentSave.message);
    }

    /* ---- Email chali gayi: ab tracking khud update karo ---- */
    const newStatus = STATUS_AFTER_SEND[type];
    const sentAt = new Date();

    contact.status = newStatus;
    contact.color = colorForStatus(newStatus);
    contact.lastContactDate = sentAt;
    contact.nextFollowUpDate = nextFollowUpFor(newStatus, sentAt);

    contact.emailHistory.push({
      type,
      subject: finalSubject,
      to: contact.email,
      from: getFromEmail(),
      // Reply match karne ke liye zaroori
      messageId: info.messageId,
      sentAt,
    });

    await contact.save();

    return res.status(200).json({
      success: true,
      message: 'Email sent to ' + contact.email + ' - status set to "' + newStatus + '"',
      messageId: info.messageId,
      savedToSent: sentSave.ok,
      sentFolder: sentSave.folder || null,
      sentNote: sentSave.message,
      data: contact,
    });
  } catch (error) {
    console.error('[sendContactEmail]', error);

    // Nodemailer ke aam masail ko aasan zabaan me
    let message = error.message || 'The email could not be sent';

    if (error.code === 'EAUTH') {
      message =
        'SMTP login failed. Gmail/Workspace does not accept a normal password - ' +
        'you need to create an App Password (after enabling 2FA).';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      message = 'Could not reach the SMTP server. Check SMTP_HOST and SMTP_PORT.';
    }

    return res.status(500).json({ success: false, message });
  }
};

/** SMTP settings theek hain ya nahi — email bheje baghair check */
const testEmailConnection = async (req, res) => {
  try {
    const result = await verifyConnection();

    return res.status(result.ok ? 200 : 400).json({
      success: result.ok,
      message: result.message,
      from: getFromEmail(),
    });
  } catch (error) {
    return fail(res, error);
  }
};

/* ================================================================== */
/*  14. CLIENT KE REPLIES (inbox se)                                   */
/* ================================================================== */

/**
 * Inbox parh kar dekhta hai ke kis contact ne jawab diya.
 *
 * Match do tareeqon se hota hai:
 *   1) Threading headers (In-Reply-To / References) -- sab se pakka, kyunke
 *      reply me hamari bheji hui email ka Message-ID hota hai
 *   2) Sender ka email address -- agar contact kisi aur address se jawab de
 *      to ye kaam nahi karega, magar aam taur par theek chalta hai
 *
 * Status KHUD nahi badalta. Wajah: out-of-office aur auto-reply bhi inbox me
 * aate hain. Hum unhe nishan laga kar alag rakhte hain aur faisla aap par
 * chhorte hain -- ek click me "Replied" kar sakte hain.
 */
const checkReplies = async (req, res) => {
  try {
    /**
     * Asal kaam config/replyWatcher.js me hai, taake khud-kar watcher aur
     * ye button dono bilkul ek hi tareeqe se scan karein.
     */
    const result = await scanForReplies({ days: req.query.days, limit: req.query.limit });

    if (!result.ok) {
      const code = String(result.message).includes('not configured') ? 503 : 400;
      return res.status(code).json({ success: false, message: result.message });
    }

    // Button se nayi reply mile to baaki khuli hui screens ko bhi bata do
    const io = req.app.get('io');
    if (io && result.newReplies > 0) {
      io.emit('xportyn:new-replies', {
        count: result.newReplies,
        items: result.items,
        at: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      scanned: result.scanned,
      folders: result.folders,
      matched: result.matched,
      newReplies: result.newReplies,
      autoReplies: result.autoReplies,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/** Jin contacts ne jawab diya un ki list (nayi reply sab se upar) */
const getReplies = async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const includeAuto = req.query.includeAuto === 'true';

    const contacts = await contactModel
      .find({ 'replies.0': { $exists: true } })
      .limit(300)
      .lean();

    const data = [];
    let unreadCount = 0;

    contacts.forEach((contact) => {
      let replies = contact.replies || [];

      if (!includeAuto) replies = replies.filter((r) => !r.isAutoReply);
      if (unreadOnly) replies = replies.filter((r) => !r.isRead);

      if (replies.length === 0) return;

      unreadCount += replies.filter((r) => !r.isRead).length;

      data.push({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        city: contact.city,
        category: contact.category,
        status: contact.status,
        color: contact.color,
        replies: replies
          .slice()
          .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)),
      });
    });

    // Jis ka jawab sab se naya hai wo sab se upar
    data.sort((a, b) => new Date(b.replies[0].receivedAt) - new Date(a.replies[0].receivedAt));

    return res.status(200).json({
      success: true,
      count: data.length,
      unreadCount,
      data,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/** Kisi contact ke saare replies "parh liye" mark kar deta hai */
const markRepliesRead = async (req, res) => {
  try {
    const contact = await contactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    contact.replies.forEach((reply) => {
      reply.isRead = true;
    });

    await contact.save();

    return res.status(200).json({
      success: true,
      message: 'Replies marked as read',
      data: contact,
    });
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Reply(s) delete karta hai.
 *
 * body me messageId ho to sirf wohi, warna us contact ki saari replies.
 * Message-ID yaad rakh liya jata hai taake agli check par dobara na aaye.
 */
const deleteReplies = async (req, res) => {
  try {
    const contact = await contactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const messageId = (req.body && req.body.messageId) || req.query.messageId;

    const before = contact.replies.length;
    const dismissed = new Set(contact.dismissedReplyIds || []);

    if (messageId) {
      contact.replies = contact.replies.filter((r) => r.messageId !== messageId);
      dismissed.add(messageId);
    } else {
      contact.replies.forEach((r) => {
        if (r.messageId) dismissed.add(r.messageId);
      });
      contact.replies = [];
    }

    contact.dismissedReplyIds = Array.from(dismissed);
    await contact.save();

    const removed = before - contact.replies.length;

    return res.status(200).json({
      success: true,
      message: removed + (removed === 1 ? ' reply deleted' : ' replies deleted'),
      removed,
      data: contact,
    });
  } catch (error) {
    return fail(res, error);
  }
};
module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  updateContactStatus,
  deleteContact,
  bulkDeleteContacts,
  importContacts,
  getFilterOptions,
  getContactTemplate,
  getAllTemplates,
  getStats,
  getUpcomingFollowUps,
  exportContacts,
  sendContactEmail,
  testEmailConnection,
  checkReplies,
  getReplies,
  markRepliesRead,
  deleteReplies,
};
