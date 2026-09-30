const mongoose = require('mongoose');
const {
  STAGES,
  BUYER_TYPES,
  ACTIVITY_TYPES,
  colorForStage,
  STAGE_ACTIVITY,
} = require('../utils/linkedinRules');

/**
 * LinkedIn module ke saare schemas
 * --------------------------------
 * Char cheezein sambhalni hain: khareedar (pipeline), Zain se poochhe gaye
 * sawal, rozana ka mamool, aur hafte ki report. Sab ek hi file me hain kyunke
 * ye ek hi module ka hissa hain aur alag alag files me bikhrane ka faida nahi.
 */

/* ================================================================== */
/*  1. BUYER — pipeline ki har row                                     */
/* ================================================================== */

/**
 * Har ahem kaam ka record.
 *
 * Report ginti ISI se karti hai, stage se nahi. Wajah: stage aage barh jata
 * hai (Request Sent -> Connected), magar "is hafte kitni requests gayin" ka
 * jawab sirf tab milta hai jab har qadam ki tareekh likhi ho.
 */
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const linkedinBuyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Club / school / shop
    company: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },

    buyerType: { type: String, enum: BUYER_TYPES, default: 'Grassroots Club' },
    jobTitle: { type: String, trim: true, default: '' },

    linkedinUrl: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },

    stage: { type: String, enum: STAGES, default: 'Request Sent' },

    // Rang stage se khud bharta hai (neeche pre-save me)
    color: { type: String, default: 'slate' },

    lastContactDate: { type: Date, default: null },

    nextStep: { type: String, trim: true, default: '' },
    nextStepDate: { type: Date, default: null },

    notes: { type: String, trim: true, default: '' },

    /**
     * Agar ye khareedar email campaign wali list me bhi hai to uska contact id.
     * Is se pata chalta hai ke us club ko XPORTYN ki email ja chuki hai --
     * yani connection note 1b istemal karna hai, 1a nahi.
     */
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'contacts', default: null },

    activity: { type: [activitySchema], default: [] },
  },
  { timestamps: true }
);

/**
 * Mongoose 9 me `pre('save')` ko `next` nahi milta -- sirf kaam karo aur
 * chhor do. (Ye purani app me ek dafa crash kara chuka hai.)
 */
linkedinBuyerSchema.pre('save', function setColour() {
  this.color = colorForStage(this.stage);

  // Pehli dafa banate waqt stage ke mutabiq activity likh do
  if (this.isNew && this.activity.length === 0) {
    const type = STAGE_ACTIVITY[this.stage];
    if (type) this.activity.push({ type, at: this.lastContactDate || new Date() });
  }
});

linkedinBuyerSchema.index({ name: 'text', company: 'text' });
linkedinBuyerSchema.index({ stage: 1, country: 1, buyerType: 1 });
linkedinBuyerSchema.index({ nextStepDate: 1 });
linkedinBuyerSchema.index({ 'activity.at': 1 });

/* ================================================================== */
/*  2. ASK ZAIN — jo sawal jawab ke intezar me hain                    */
/* ================================================================== */

const askZainSchema = new mongoose.Schema(
  {
    buyerName: { type: String, trim: true, default: '' },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'linkedin_buyers', default: null },

    question: { type: String, required: true, trim: true },

    // qeemat / shipping / discount wagera -- report me isi se grouping hoti hai
    topic: { type: String, trim: true, default: '' },

    status: { type: String, enum: ['Pending', 'Answered'], default: 'Pending' },
    answer: { type: String, trim: true, default: '' },
    answeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

askZainSchema.index({ status: 1, createdAt: -1 });

/* ================================================================== */
/*  3. DAILY — rozana ka mamool aur streak                             */
/* ================================================================== */

/**
 * Har din ki ek row. `date` "2026-09-30" ki shakal me hai (local din), taake
 * timezone ke chakkar me din aage peechhe na ho.
 */
const linkedinDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },

    // { replies: true, comments: false, ... }
    tasks: { type: Map, of: Boolean, default: {} },

    // Saare kaam ho gaye? Streak isi se ginti hai
    allDone: { type: Boolean, default: false },

    // Monday wala kaam: is hafte ka market
    market: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

/* ================================================================== */
/*  4. REPORT — Saturday wali report ka record                         */
/* ================================================================== */

const linkedinReportSchema = new mongoose.Schema(
  {
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },

    // { requestSent: 84, accepted: 26, ... }
    counts: { type: Map, of: Number, default: {} },

    bestConversation: { type: String, trim: true, default: '' },
    needsZain: { type: [String], default: [] },
    nextMarket: { type: String, trim: true, default: '' },

    // Jo text bheja gaya -- baad me dobara dekhne ke liye
    text: { type: String, default: '' },
  },
  { timestamps: true }
);

linkedinReportSchema.index({ weekStart: -1 });

module.exports = {
  linkedinBuyerSchema,
  askZainSchema,
  linkedinDaySchema,
  linkedinReportSchema,
};
