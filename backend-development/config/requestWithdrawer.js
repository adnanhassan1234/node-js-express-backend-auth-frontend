/**
 * Purani connection requests khud "Withdrawn" karna
 * -------------------------------------------------
 * Jo request 3 hafte me accept na ho, wo aam tor par kabhi accept nahi hoti.
 * Magar wo "Request Sent" par pari rehti hai -- na zinda, na band. Do nuqsan
 * hote hain:
 *
 *   1. Pipeline me wo har roz nazar aati hai aur aisa lagta hai ke kaam baqi
 *      hai, halanke kuch karne ko nahi.
 *   2. LinkedIn par pending invitations ki ek hadd hoti hai. Purani requests
 *      wahin atki rehti hain aur nayi bhejne ki gunjaish khatam kar deti hain.
 *
 * Is liye 3 hafte baad stage "Withdrawn" ho jata hai.
 *
 * YAAD RAHE: ye app ka nishan hai, LinkedIn par khud kuch nahi hota. Request
 * wahan se aap ko KHUD withdraw karni hogi (My Network -> Sent). App sirf
 * batati hai ke kaun si karni hain.
 *
 * Koi activity nahi likhi jati -- withdraw karna koi kaam nahi, nateeja hai,
 * aur hafte ki ginti me is ka koi hissa nahi hona chahiye.
 *
 * .env se:
 *   WITHDRAW_AFTER_DAYS=21    -> kitne din baad (0 = band)
 *   WITHDRAW_CHECK_HOURS=6    -> kitni der baad dobara dekhna
 */
const { linkedinBuyerModel } = require('../model/linkedinModels');
const { colorForStage } = require('../utils/linkedinRules');

const DEFAULT_DAYS = 21;
const DEFAULT_CHECK_HOURS = 6;

/**
 * Request kab bheji gayi thi.
 *
 * Sab se bharosay laiq `requestSent` wali activity ka waqt hai -- wohi asal
 * din hai. Na ho (purana record, ya import ki hui row) to lastContactDate,
 * aur aakhir me record banne ka din.
 */
const sentAt = (buyer) => {
  const req = (buyer.activity || []).find((a) => a.type === 'requestSent');
  if (req && req.at) return new Date(req.at);

  if (buyer.lastContactDate) return new Date(buyer.lastContactDate);

  return buyer.createdAt ? new Date(buyer.createdAt) : null;
};

/**
 * Wo requests band karta hai jo kaafi purani ho chuki hain aur abhi tak
 * "Request Sent" par hain.
 *
 * Wapas: { ok, withdrawn, checked, days, items }
 */
const withdrawStaleRequests = async (options = {}) => {
  const days = Number(options.days ?? process.env.WITHDRAW_AFTER_DAYS ?? DEFAULT_DAYS);

  if (!days || days <= 0) {
    return { ok: false, message: 'Auto withdraw band hai (WITHDRAW_AFTER_DAYS=0)' };
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const candidates = await linkedinBuyerModel.find({ stage: 'Request Sent' });
  const items = [];

  for (const buyer of candidates) {
    const when = sentAt(buyer);

    // Tareekh hi na ho to haath na lagayein -- andaze par stage nahi badalte
    if (!when || when > cutoff) continue;

    buyer.stage = 'Withdrawn';
    buyer.color = colorForStage('Withdrawn');

    /*
     * Agla qadam khatam -- warna ye "due" ki list me pada rehta hai aur
     * rozana ke kaam me ginta rehta hai, jabke karne ko kuch nahi.
     */
    buyer.nextStepDate = null;

    await buyer.save();

    items.push({
      buyerId: String(buyer._id),
      name: buyer.name,
      company: buyer.company,
      sentAt: when,
    });
  }

  return {
    ok: true,
    days,
    checked: candidates.length,
    withdrawn: items.length,
    items,
    message:
      items.length > 0
        ? items.length + (items.length === 1 ? ' request' : ' requests') + ' marked "Withdrawn"'
        : 'Nothing to withdraw',
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
 * Rozana ka hisaab hai, jaldi ka kaam nahi -- is liye wakfa bara rakha hai.
 * `running` flag do checks ko aapas me takrane se rokta hai.
 */
const startRequestWithdrawer = () => {
  const days = Number(process.env.WITHDRAW_AFTER_DAYS ?? DEFAULT_DAYS);

  if (!days || days <= 0) {
    console.log(' LinkedIn auto-withdraw is off (WITHDRAW_AFTER_DAYS=0)');
    return;
  }

  if (timer) return;

  const hours =
    Number(process.env.WITHDRAW_CHECK_HOURS ?? DEFAULT_CHECK_HOURS) || DEFAULT_CHECK_HOURS;

  const tick = async () => {
    if (running) return;
    running = true;

    try {
      const result = await withdrawStaleRequests();

      if (result.ok && result.withdrawn > 0) {
        console.log(
          ' ' + result.withdrawn + ' LinkedIn requests marked "Withdrawn" (sent ' + result.days + '+ days ago)'
        );
      }
    } catch (error) {
      // DB band ho ya kuch aur -- server chalta rahe
      console.warn(' LinkedIn auto-withdraw: ' + String(error.message).slice(0, 100));
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, hours * 60 * 60 * 1000);
  timer.unref();

  console.log(
    ' LinkedIn auto-withdraw is running -- after ' + days + ' days, checked every ' + hours + 'h'
  );

  // Server start hone ke 50 second baad pehla check (DB jurne ka waqt mil jaye)
  setTimeout(tick, 50000).unref();
};

const stopRequestWithdrawer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  withdrawStaleRequests,
  startRequestWithdrawer,
  stopRequestWithdrawer,
};
