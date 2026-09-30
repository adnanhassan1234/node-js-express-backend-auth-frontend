/**
 * Follow-up 2 ke baad silsila khud band karna
 * ------------------------------------------
 * Follow-up 2 aakhri email hoti hai. Uske baad contact ki nextFollowUpDate null
 * ho jati hai, wo Upcoming Follow-ups se nikal jata hai, aur hamesha
 * "Follow-up 2" par pada rehta hai -- na zinda, na band.
 *
 * Ye module chand din intezar ke baad usay "No Reply" kar deta hai. Farq ye hai:
 *
 *   Follow-up 2  = maine aakhri email bhej di   (mera kiya hua kaam)
 *   No Reply     = jawab nahi aaya, baat khatam (nateeja)
 *
 * Intezar is liye ke bhejte hi nateeja likh dena jaldbazi hogi -- log aksar
 * teen chaar din baad jawab dete hain.
 *
 * .env se:
 *   NO_REPLY_AFTER_DAYS=7    -> Follow-up 2 ke kitne din baad band karna (0 = band)
 *   NO_REPLY_CHECK_HOURS=6   -> kitni der baad dobara dekhna
 */
const contactModel = require('../model/contactModel');
const { colorForStatus } = require('../utils/trackerRules');

const DEFAULT_DAYS = 7;
const DEFAULT_CHECK_HOURS = 6;

/**
 * Wo contacts band karta hai jinka Follow-up 2 ko kaafi din ho gaye.
 *
 * Jin ke paas kisi INSAAN ka jawab mojood hai unhe chhor deta hai -- chahe user
 * ne abhi status "Replied" na kiya ho. Auto-reply (out of office wagera) jawab
 * nahi ginti, warna har out-of-office wala contact hamesha khula reh jata.
 *
 * Wapas: { ok, closed, checked, days, items }
 */
const closeStaleFollowUps = async (options = {}) => {
  const days = Number(options.days ?? process.env.NO_REPLY_AFTER_DAYS ?? DEFAULT_DAYS);

  if (!days || days <= 0) {
    return { ok: false, message: 'Auto close-out band hai (NO_REPLY_AFTER_DAYS=0)' };
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const candidates = await contactModel.find({
    status: 'Follow-up 2',
    lastContactDate: { $ne: null, $lte: cutoff },
  });

  const items = [];

  for (const contact of candidates) {
    // Kisi insaan ka jawab aa chuka ho to haath na lagayein
    const humanReply = (contact.replies || []).some((r) => !r.isAutoReply);
    if (humanReply) continue;

    contact.status = 'No Reply';
    contact.color = colorForStatus('No Reply');
    contact.nextFollowUpDate = null;

    await contact.save();

    items.push({
      contactId: String(contact._id),
      name: contact.name,
      lastContactDate: contact.lastContactDate,
    });
  }

  return {
    ok: true,
    days,
    checked: candidates.length,
    closed: items.length,
    items,
    message:
      items.length > 0
        ? items.length + (items.length === 1 ? ' contact' : ' contacts') + ' marked "No Reply"'
        : 'Nothing to close out',
  };
};

/* ================================================================== */
/*  KHUD-KAR CHECK                                                     */
/* ================================================================== */

let timer = null;
let running = false;

/**
 * Har chand ghante baad khud chalta hai.
 *
 * Ye rozana ka hisaab-kitab hai, jaldi ka kaam nahi -- is liye wakfa bara
 * rakha hai. `running` flag do checks ko aapas me takrane se rokta hai.
 */
const startFollowUpCloser = () => {
  const days = Number(process.env.NO_REPLY_AFTER_DAYS ?? DEFAULT_DAYS);

  if (!days || days <= 0) {
    console.log(' Follow-up close-out is off (NO_REPLY_AFTER_DAYS=0)');
    return;
  }

  if (timer) return;

  const hours = Number(process.env.NO_REPLY_CHECK_HOURS ?? DEFAULT_CHECK_HOURS) || DEFAULT_CHECK_HOURS;

  const tick = async () => {
    if (running) return;
    running = true;

    try {
      const result = await closeStaleFollowUps();

      if (result.ok && result.closed > 0) {
        console.log(' ' + result.closed + ' contacts marked "No Reply" (Follow-up 2 + ' + result.days + ' days)');
      }
    } catch (error) {
      // DB band ho ya kuch aur -- server chalta rahe
      console.warn(' Follow-up close-out: ' + String(error.message).slice(0, 100));
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, hours * 60 * 60 * 1000);
  timer.unref();

  console.log(
    ' Follow-up close-out is running -- "No Reply" after ' + days + ' days, checked every ' + hours + 'h'
  );

  // Server start hone ke 40 second baad pehla check (DB jurne ka waqt mil jaye)
  setTimeout(tick, 40000).unref();
};

const stopFollowUpCloser = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  closeStaleFollowUps,
  startFollowUpCloser,
  stopFollowUpCloser,
};
