/**
 * Khamosh connections khud "No Reply" karna
 * -----------------------------------------
 * Playbook ka usool: do message se ziyada nahi. Step 2 (shukriya + sawal) aur
 * Step 4 (7 din baad kaam ki follow-up) -- bas. Uske baad ruk jana hai.
 *
 * Magar app me wo buyer "Connected" par para rehta tha, aur har kaam ke baad
 * usay nayi tareekh mil jati thi -- yani wo Follow-ups tab me HAMESHA aata
 * rehta, halanke karne ko kuch nahi bacha tha.
 *
 * Ab dono message jane ke baad chand din intezar karke stage "No Reply" ho
 * jata hai.
 *
 *   Withdrawn = request accept hi nahi hui     (baat shuru hi nahi hui)
 *   No Reply  = connect hua, message gaye, jawab nahi aaya
 *
 * Shartein -- teenon zaroori:
 *   1. stage abhi "Connected" ho (aage barh chuka ho to haath na lagao)
 *   2. kam az kam DO messages ja chuke hon (Step 2 + follow-up). Ek hi gaya ho
 *      to abhi band nahi karna -- follow-up abhi bhejni baqi hai.
 *   3. unka koi jawab na aaya ho (koi `conversation` activity na ho)
 *
 * .env se:
 *   NO_REPLY_AFTER_DAYS_LI=7   -> aakhri message ke kitne din baad (0 = band)
 *   NO_REPLY_CHECK_HOURS_LI=6  -> kitni der baad dobara dekhna
 */
const { linkedinBuyerModel } = require('../model/linkedinModels');
const { colorForStage } = require('../utils/linkedinRules');

const DEFAULT_DAYS = 7;
const DEFAULT_CHECK_HOURS = 6;

/** Follow-up ja chuki ho -- yani Step 2 ke baad ek aur message */
const MIN_MESSAGES = 2;

const lastOf = (buyer, type) => {
  const times = (buyer.activity || [])
    .filter((a) => a.type === type)
    .map((a) => new Date(a.at).getTime());

  return times.length ? new Date(Math.max(...times)) : null;
};

/**
 * Wo connections band karta hai jahan dono message ja chuke aur jawab nahi aaya.
 *
 * Wapas: { ok, closed, checked, days, items }
 */
const closeSilentConnections = async (options = {}) => {
  const days = Number(options.days ?? process.env.NO_REPLY_AFTER_DAYS_LI ?? DEFAULT_DAYS);

  if (!days || days <= 0) {
    return { ok: false, message: 'LinkedIn auto "No Reply" is off (NO_REPLY_AFTER_DAYS_LI=0)' };
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const candidates = await linkedinBuyerModel.find({ stage: 'Connected' });
  const items = [];

  for (const buyer of candidates) {
    const acts = buyer.activity || [];

    // Unhone jawab de diya tha -- ye khamoshi nahi
    if (acts.some((a) => a.type === 'conversation')) continue;

    const sent = acts.filter((a) => a.type === 'messageSent');
    if (sent.length < MIN_MESSAGES) continue;

    const last = lastOf(buyer, 'messageSent');
    if (!last || last > cutoff) continue;

    buyer.stage = 'No Reply';
    buyer.color = colorForStage('No Reply');
    buyer.nextStepDate = null;

    await buyer.save();

    items.push({
      buyerId: String(buyer._id),
      name: buyer.name,
      company: buyer.company,
      messages: sent.length,
      lastMessage: last,
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
        ? items.length + (items.length === 1 ? ' buyer' : ' buyers') + ' marked "No Reply"'
        : 'Nothing to close out',
  };
};

/* ================================================================== */
/*  KHUD-KAR CHECK                                                     */
/* ================================================================== */

let timer = null;
let running = false;

const startNoReplyCloser = () => {
  const days = Number(process.env.NO_REPLY_AFTER_DAYS_LI ?? DEFAULT_DAYS);

  if (!days || days <= 0) {
    console.log(' LinkedIn auto "No Reply" is off (NO_REPLY_AFTER_DAYS_LI=0)');
    return;
  }

  if (timer) return;

  const hours =
    Number(process.env.NO_REPLY_CHECK_HOURS_LI ?? DEFAULT_CHECK_HOURS) || DEFAULT_CHECK_HOURS;

  const tick = async () => {
    if (running) return;
    running = true;

    try {
      const result = await closeSilentConnections();

      if (result.ok && result.closed > 0) {
        console.log(
          ' ' + result.closed + ' LinkedIn buyers marked "No Reply" (silent ' + result.days + '+ days)'
        );
      }
    } catch (error) {
      // DB band ho ya kuch aur -- server chalta rahe
      console.warn(' LinkedIn auto "No Reply": ' + String(error.message).slice(0, 100));
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, hours * 60 * 60 * 1000);
  timer.unref();

  console.log(
    ' LinkedIn auto "No Reply" is running -- after ' + days + ' silent days, checked every ' + hours + 'h'
  );

  // Server start hone ke 60 second baad pehla check
  setTimeout(tick, 60000).unref();
};

const stopNoReplyCloser = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  closeSilentConnections,
  startNoReplyCloser,
  stopNoReplyCloser,
};
