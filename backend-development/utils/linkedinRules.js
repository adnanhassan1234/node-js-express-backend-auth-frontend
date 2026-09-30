/**
 * XPORTYN LinkedIn Playbook — saare qawaid aur content ek jagah
 * ------------------------------------------------------------
 * Manager ki playbook (30 Sep 2026) ka har hissa yahan hai: stages, hafte ke
 * targets, message templates, jawab dene ki guide, search ke tareeqe, aur
 * qawaid. Backend aur frontend dono yahin se lete hain, taake kisi cheez ko
 * badalna ho to sirf ek jagah badle.
 */

/* ================================================================== */
/*  PIPELINE                                                           */
/* ================================================================== */

/**
 * Buyer ka safar. Tarteeb ahem hai -- dashboard aur report isi par chalte hain.
 * Aakhri teen "band" haalat hain (Won / Not now / Lost).
 */
const STAGES = [
  'Request Sent',
  'Connected',
  'In Conversation',
  'Mock-up Sent',
  'Sample Ordered',
  'Bulk Quote Sent',
  'Won',
  'Not now',
  'Lost',
];

/** Jin stages par baat khatam ho chuki hai */
const CLOSED_STAGES = ['Won', 'Not now', 'Lost'];

/** Stage -> rang (frontend wahi naam istemal karta hai jo contacts me hain) */
const STAGE_COLORS = {
  'Request Sent': 'slate',
  Connected: 'blue',
  'In Conversation': 'blue',
  'Mock-up Sent': 'yellow',
  'Sample Ordered': 'green',
  'Bulk Quote Sent': 'green',
  Won: 'green',
  'Not now': 'yellow',
  Lost: 'red',
};

const BUYER_TYPES = [
  'Grassroots Club',
  'US/Canada Youth Soccer',
  'School',
  'College/University',
  'Teamwear Reseller',
];

/* ================================================================== */
/*  ACTIVITY — hafte wali report inhi se banti hai                     */
/* ================================================================== */

/**
 * Har ahem kaam ka record. Report ginti in par karti hai, stage par nahi --
 * kyunke stage aage barh jata hai magar "is hafte kitni requests gayin" ka
 * jawab sirf activity se milta hai.
 */
const ACTIVITY_TYPES = [
  'requestSent',
  'accepted',
  'conversation',
  'mockupOffered',
  'mockupSent',
  'sampleOrdered',
  'bulkQuoteSent',
];

/** Stage badalne par khud ba khud kaunsi activity likhi jaye */
const STAGE_ACTIVITY = {
  'Request Sent': 'requestSent',
  Connected: 'accepted',
  'In Conversation': 'conversation',
  'Mock-up Sent': 'mockupSent',
  'Sample Ordered': 'sampleOrdered',
  'Bulk Quote Sent': 'bulkQuoteSent',
};

/** Report me kaunsi line kis naam se aaye */
const ACTIVITY_LABELS = {
  requestSent: 'Connection requests sent',
  accepted: 'Accepted',
  conversation: 'Real conversations',
  mockupOffered: 'Mock-ups offered',
  mockupSent: 'Mock-ups sent',
  sampleOrdered: 'Sample orders ($200)',
  bulkQuoteSent: 'Bulk quotes sent',
};

/**
 * Hafte ke targets (playbook se).
 *
 * `max` sirf dikhane ke liye hai; progress `min` par naapi jati hai -- warna
 * 80 requests bhej kar bhi bar adhoora nazar aata, jo hosla torta hai.
 */
const WEEKLY_TARGETS = {
  requestSent: { min: 80, max: 100 },
  accepted: { min: 25, max: 30 },
  conversation: { min: 8, max: 10 },
  mockupOffered: { min: 4, max: 4 },
  sampleOrdered: { min: 1, max: 2 },
  bulkQuoteSent: { min: 1, max: 1 },
};

/** LinkedIn ki hadd -- is se upar account par pabandi ka khatra hai */
const WEEKLY_REQUEST_LIMIT = 100;
const WEEKLY_REQUEST_WARN = 80;

/** Teesre mahine ka target */
const MONTHLY_GOAL = { sampleOrders: 5, bulkOrders: 1 };

/* ================================================================== */
/*  OUTREACH — paanch qadam                                            */
/* ================================================================== */

const OUTREACH_STEPS = [
  {
    key: 'step1a',
    label: 'Step 1a — Connection note (cold)',
    when: 'Day 0',
    activity: 'requestSent',
    stage: 'Request Sent',
    body:
      'Hi [Name], I help grassroots clubs like [Club] get custom kits made ' +
      'direct from our factory in Sialkot. Would be good to connect.',
    urdu:
      'Hi [Name], main [Club] jaise chhote clubs ko Sialkot ki factory se seedha ' +
      'custom kits banwane mein madad karta hun. Connect karke achha lagega.',
  },
  {
    key: 'step1b',
    label: 'Step 1b — Connection note (club ko email ja chuki hai)',
    when: 'Day 0',
    activity: 'requestSent',
    stage: 'Request Sent',
    body:
      'Hi [Name], I sent a note to [Club] about kits this week. ' +
      'Happy to connect here too.',
    urdu:
      'Hi [Name], maine is hafte [Club] ko kits ke baare mein email bheji thi. ' +
      'Yahan bhi connect karke khushi hogi.',
  },
  {
    key: 'step2',
    label: 'Step 2 — Shukriya + ek sawal',
    when: 'Accept hone ke 1–2 din baad',
    activity: 'conversation',
    stage: 'In Conversation',
    body:
      'Thanks for connecting, [Name]. Quick question: when does [Club] usually ' +
      "sort out kits for the new season? I'm always curious how clubs plan it.",
    urdu:
      'Connect karne ka shukriya. Ek sawal: [Club] naye season ki kits aam tor par ' +
      'kab tay karta hai? Mujhe jaanne ka shauq hai ke clubs kaise plan karte hain.',
  },
  {
    key: 'step3',
    label: 'Step 3 — Free mock-up ki peshkash',
    when: 'Jab wo jawab dein',
    activity: 'mockupOffered',
    stage: null, // peshkash se stage nahi badalta -- mock-up bhejne par badlega
    body:
      'That makes sense. If it helps, our designers can put together a free ' +
      'mock-up of a [Club] kit in your colours, no obligation. Just send your ' +
      'crest and colours, or I can take them from your website.',
    urdu:
      'Theek baat hai. Agar faida ho to hamare designers [Club] ki kit ka aapke ' +
      'rangon mein free mock-up bana sakte hain, koi pabandi nahi. Apna crest aur ' +
      'rang bhej dein, ya main website se le leta hun.',
  },
  {
    key: 'step4',
    label: 'Step 4 — Ek kaam ki follow-up (7 din khamoshi ke baad)',
    when: '7 din jawab na aaye',
    activity: null,
    stage: null,
    body:
      'Hi [Name], I made a short guide on ordering youth kit sizes for U8–U16 ' +
      'squads. Thought it might save you time this season: [link to post]. ' +
      'No reply needed.',
    urdu:
      'Maine U8–U16 teams ke sizes order karne par chhota sa guide banaya hai, ' +
      'shayad is season aapka waqt bache: [post ka link]. Jawab ki zaroorat nahi.',
    note: 'Is ke baad ruk jayein — do messages se ziyada nahi.',
  },
  {
    key: 'step5',
    label: 'Step 5 — $200 sample ki peshkash',
    when: 'Mock-up pasand aane ke baad',
    activity: 'sampleOrdered',
    stage: 'Sample Ordered',
    body:
      "Glad you like it! If you'd like to check the quality before ordering for " +
      'the squad, we can make a sample for $200: one full match kit (jersey, ' +
      'shorts and socks) plus a training kit, in this design. Shall I send the ' +
      'details by email?',
    urdu:
      'Khushi hui ke pasand aaya! Poori team ka order dene se pehle quality check ' +
      'karni ho to hum $200 mein sample bana sakte hain: is design mein poori ' +
      'match kit (jersey, shorts, socks) aur ek training kit. Kya main details ' +
      'email par bhej dun?',
  },
];

/* ================================================================== */
/*  JAWAB DENE KI GUIDE                                                */
/* ================================================================== */

const REPLY_GUIDE = [
  {
    theySay: '"Interested, send details"',
    reply:
      'Free mock-up offer (Step 3), then the $200 sample (Step 5) and the quote ' +
      'link xportyn.com/quote',
    askZain: false,
  },
  {
    theySay: '"How much for 15 kits?"',
    reply:
      "Depends on design and fabric; I'll get you an exact quote within 1 " +
      'business day. — phir tadaad, sizes aur deadline poochhein.',
    askZain: true,
    askZainFor: 'qeemat',
  },
  {
    theySay: '"Is shipping included in the $200?"',
    reply:
      "Shipping is separate and depends on your country; I'll confirm the exact cost.",
    askZain: true,
    askZainFor: 'shipping ka kharcha',
  },
  {
    theySay: '"We\'re sorted this season"',
    reply:
      'Shukriya kahein, poochhein ke agle season ki kits kab lenge, aur 2 mahine ' +
      'pehle ka reminder laga dein.',
    askZain: false,
  },
  {
    theySay: '"Is ordering from Pakistan risky?"',
    reply:
      'Pehle free mock-up, bare order se pehle sample, tracked DHL/FedEx, bank ' +
      'transfer ya card, aur export paperwork shamil.',
    askZain: false,
  },
  {
    theySay: '"Not interested" / "Stop"',
    reply:
      'No problem, thanks for letting me know. — Lost mark karein, dobara kabhi ' +
      'message na karein.',
    askZain: false,
  },
  {
    theySay: 'Discount, guarantee ya free sample ki farmaish',
    reply: "Let me check with our founder.",
    askZain: true,
    askZainFor: 'discount / guarantee',
  },
];

/* ================================================================== */
/*  KHAREEDAR DHOONDNE KA TAREEQA                                      */
/* ================================================================== */

const SEARCH_HELPER = [
  {
    buyerType: 'Grassroots Club',
    jobTitles: ['Club Secretary', 'Chairman', 'Kit Manager', 'Welfare Officer', 'Director of Coaching'],
    searchWords: ['youth football club', 'junior FC', 'soccer club'],
    markets: ['UK', 'Ireland', 'Australia'],
  },
  {
    buyerType: 'US/Canada Youth Soccer',
    jobTitles: ['Club Director', 'Executive Director', 'Operations Manager', 'Registrar'],
    searchWords: ['youth soccer', 'soccer association', 'SC'],
    markets: ['USA (Louisiana first)', 'Canada'],
  },
  {
    buyerType: 'School',
    jobTitles: ['Athletic Director', 'Head of PE', 'Director of Sport'],
    searchWords: ['high school', 'academy', 'secondary school'],
    markets: ['USA', 'UK', 'UAE', 'Qatar'],
  },
  {
    buyerType: 'College/University',
    jobTitles: ['Assistant AD', 'Equipment Manager', 'Head Soccer Coach'],
    searchWords: ['university athletics', 'college soccer'],
    markets: ['USA', 'UK'],
  },
  {
    buyerType: 'Teamwear Reseller',
    jobTitles: ['Owner', 'Founder', 'Buyer'],
    searchWords: ['teamwear', 'sports kit supplier', 'sportswear shop'],
    markets: ['UK', 'USA', 'Gulf'],
  },
];

/**
 * Extra search — upar wali table ke ALAG.
 *
 * Upar wali table playbook ki hai: har qism ke liye tay-shuda titles aur
 * alfaaz. Ye wali khuli hai — koi bhi title kisi bhi lafz ke saath mila kar
 * search ban jati hai. Yahan senior log (CEO, President, Academy Director)
 * aur academy wale alfaaz hain, jo playbook me nahi the.
 */
const EXTRA_SEARCH = {
  jobTitles: [
    'CEO',
    'Director',
    'Owner',
    'President',
    'Head Coach',
    'Academy Director',
  ],
  searchWords: [
    'sports academy',
    'soccer club',
    'football club',
    'youth soccer',
    'soccer academy',
    'soccer academy USA',
    'football club USA',
    'football academy',
    'sports academy UK',
    'college soccer',
    'local soccer club',
    'high school soccer',
  ],
};

/* ================================================================== */
/*  ROZANA KA MAMOOL                                                   */
/* ================================================================== */

const DAILY_TASKS = [
  { key: 'replies', minutes: 15, label: 'Kal ke har message aur connection note ka jawab', amount: 'Sab' },
  { key: 'comments', minutes: 15, label: "Zain ki nayi post par comment, phir 5 buyer posts par", amount: '6 comments' },
  { key: 'find', minutes: 20, label: 'Naye khareedar dhoondein aur note ke saath request bhejein', amount: '15–20' },
  { key: 'sequence', minutes: 15, label: 'Naye connections ko Step 2; 7 din se khamosh logon ko Step 4', amount: '—' },
  { key: 'tracker', minutes: 10, label: 'Pipeline tracker update karein', amount: '—' },
];

const WEEKLY_TASKS = [
  { day: 'Monday', label: "Is hafte ka market chunein (email campaign wala hi mulk)" },
  { day: 'Wednesday', label: '3 hafte se purani, accept na hui requests wapas lein' },
  { day: 'Saturday', label: 'Zain ko hafte ki report bhejein' },
];

/* ================================================================== */
/*  QAWAID                                                             */
/* ================================================================== */

const RULES = [
  'Koi automation tool, bot ya browser extension nahi — sab kuch haath se type karein. LinkedIn in par pabandi lagata hai.',
  'Hafte mein 100 se ziyada connection requests nahi.',
  'Pehle message mein lamba sales pitch ya price list kabhi nahi.',
  'Do messages ka jawab na aaye to ruk jayein.',
  'Koi mana kar de to foran ruk jayein.',
  'Qeemat, discount, delivery date ya guarantee ka wada nahi — jab tak Zain pakka na kare.',
  'Sirf wo kits, clubs aur tasveerein dikhayein jin ki ijazat ho.',
  'Hamesha sach batayein ke aap XPORTYN, Sialkot, Pakistan se hain.',
];

const PROFILE_CHECKLIST = [
  { key: 'photo', label: 'Saaf, muskurati tasveer — saada background, logo nahi' },
  {
    key: 'headline',
    label: 'Headline lagayein',
    value: 'Sales Manager, XPORTYN · Custom football kits for clubs & schools · MOQ 10 · Free mock-up',
  },
  { key: 'banner', label: 'Banner — wahi kit photo banner jo Zain ki profile par hai' },
  { key: 'role', label: 'Current role: XPORTYN (Private) Limited, company page se jura, 3 lines kaam ka bayan' },
  { key: 'featured', label: 'Featured: $200 sample page, quote page, aur kits ki 2 posts' },
  { key: 'contact', label: 'Contact info: kaam wali email aur WhatsApp number' },
];

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

/** Stage ka rang */
const colorForStage = (stage) => STAGE_COLORS[stage] || 'slate';

/**
 * "YYYY-MM-DD" ko LOCAL din maan kar parhta hai.
 *
 * new Date("2026-09-21") UTC ki aadhi raat deta hai. UTC se peechhe waale
 * timezone me wo ek din pehle ban jata hai -- aur phir hafta poora ek hafta
 * peechhe chala jata hai. Is liye khud torr kar banate hain.
 */
const localDate = (value) => {
  if (!value) return new Date();

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Kisi din ka hafta (Monday se Sunday).
 *
 * Playbook Monday–Saturday chalta hai aur report Saturday ko jati hai, is liye
 * hafta Monday se shuru hota hai -- Sunday nahi.
 */
const weekRange = (anyDate) => {
  const d = localDate(anyDate);
  d.setHours(0, 0, 0, 0);

  // getDay(): 0 = Sunday. Monday tak peechhe jao
  const back = (d.getDay() + 6) % 7;

  const start = new Date(d);
  start.setDate(d.getDate() - back);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/** "2026-09-30" -- local din, timezone ke phande se bachne ke liye */
const dayKey = (anyDate) => {
  const d = anyDate ? new Date(anyDate) : new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

module.exports = {
  STAGES,
  CLOSED_STAGES,
  STAGE_COLORS,
  BUYER_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_LABELS,
  STAGE_ACTIVITY,
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
};
