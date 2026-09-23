const mongoose = require('mongoose');
const { STATUSES, CATEGORIES, colorForStatus, nextFollowUpFor } = require('../utils/trackerRules');

/**
 * Contact schema — XPORTYN Sales Tracker
 *
 * NOTE (important): `email` ko required NAHI rakha gaya.
 * Wajah: aapki Google Sheet me 321 me se sirf ~80 contacts ke paas email hai.
 * Agar email required hoti to 240+ contacts import hi na ho paate.
 * Is liye email optional hai, aur `hasEmail` flag se aap filter kar sakte hain
 * ke kis contact ko email bheji ja sakti hai.
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Organization me jis banday ko likhna hai (optional).
    // Template me [Contact Name] isi se fill hota hai, warna "Team" use hota hai.
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },

    city: {
      type: String,
      trim: true,
      default: '',
    },

    // Mulk. Abhi saara data USA (Louisiana) ka hai is liye default 'USA'.
    // Sheet me "Country" column ho to import usi se bhar deta hai.
    country: {
      type: String,
      trim: true,
      default: 'USA',
    },

    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },

    // Sheet ki original category value (e.g. "Nursing school") — reference ke liye
    rawCategory: {
      type: String,
      trim: true,
      default: '',
    },

    address: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    // Quick filter: kis contact ke paas email address maujood hai
    hasEmail: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: STATUSES,
      // Naya contact hamesha "Not Contacted" se shuru hota hai —
      // import karne ka matlab ye nahi ke email bhej di gayi
      default: 'Not Contacted',
    },

    // Status se derive hota hai — manually set karne ki zaroorat nahi
    color: {
      type: String,
      default: 'white',
    },

    // Jab tak email nahi bheji, ye null rehti hai
    lastContactDate: {
      type: Date,
      default: null,
    },

    // Status ke hisaab se calculate hoti hai, magar user manually override kar sakta hai
    nextFollowUpDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: '',
    },

    /**
     * Har bheji hui email ka record — kab, kaunsa template, kis address par.
     * Sirf app se bheji gayi emails yahan aati hain (mail client wali nahi).
     */
    emailHistory: [
      {
        _id: false,
        type: { type: String },
        subject: { type: String },
        to: { type: String },
        from: { type: String },
        // Reply ko isi se pehchanta hai (reply me In-Reply-To me yehi aata hai)
        messageId: { type: String },
        sentAt: { type: Date, default: Date.now },
      },
    ],

    /**
     * Client ke jawab (inbox se parh kar save hote hain).
     * isAutoReply = out-of-office / automatic reply, asli jawab nahi.
     */
    replies: [
      {
        _id: false,
        messageId: { type: String },
        inReplyTo: { type: String },
        from: { type: String },
        fromName: { type: String },
        subject: { type: String },
        text: { type: String },
        receivedAt: { type: Date, default: Date.now },
        // Kis folder se mili (INBOX ya Spam) -- spam wali par nishan lagta hai
        folder: { type: String },
        fromSpam: { type: Boolean, default: false },
        isAutoReply: { type: Boolean, default: false },
        isRead: { type: Boolean, default: false },
      },
    ],

    /**
     * Jo replies user ne delete ki hain un ke Message-ID.
     *
     * Ye is liye zaroori hai: email to mailbox me mojood rehti hai, to agli
     * dafa check karne par wohi reply dobara aa jati. Yahan yaad rakh kar
     * usay dobara nahi daalte -- yani "delete" ka matlab "dobara mat dikhao".
     */
    dismissedReplyIds: [{ type: String }],
  },
  { timestamps: true } // createdAt / updatedAt automatic
);

/**
 * Save se pehle derived fields khud set kar dete hain:
 *  - hasEmail  (email maujood hai ya nahi)
 *  - color     (status se)
 *  - nextFollowUpDate (sirf tab jab user ne khud manually set na ki ho)
 *
 * NOTE: Is project me Mongoose v9 hai. v9 me pre('save') hook ko `next`
 * callback nahi milta (wo v7/v8 ka tareeqa tha) — sync function bas return
 * kar de to Mongoose aage barh jata hai. `next()` call karne se
 * "TypeError: next is not a function" aata hai.
 */
contactSchema.pre('save', function () {
  this.hasEmail = Boolean(this.email && this.email.trim());
  this.color = colorForStatus(this.status);

  // Agar status badla hai aur user ne khud nextFollowUpDate edit nahi ki,
  // to cadence ke hisaab se nayi date laga do.
  if (this.isModified('status') && !this.isModified('nextFollowUpDate')) {
    this.nextFollowUpDate = nextFollowUpFor(this.status, this.lastContactDate);
  }
});

// Search / filter performance ke liye indexes
contactSchema.index({ name: 'text', email: 'text' });
contactSchema.index({ category: 1, status: 1, city: 1 });
contactSchema.index({ nextFollowUpDate: 1 });

module.exports = contactSchema;
