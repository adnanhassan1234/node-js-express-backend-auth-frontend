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
  "Request Sent",
  "Connected",
  "In Conversation",
  "Mock-up Sent",
  "Sample Ordered",
  "Bulk Quote Sent",
  "Won",
  "Not now",
  "Lost",

  /**
   * Request bheji, 3 hafte guzar gaye, accept nahi hui.
   *
   * "Lost" nahi kaha kyunke kuch haara nahi -- baat shuru hi nahi hui. Aur
   * "Not now" bhi nahi, wo unka jawab hota hai. Ye sirf ek khamosh request
   * hai jo ab band ki ja rahi hai.
   */
  "Withdrawn",

  /**
   * Connect ho gaya, do message bhi gaye, magar jawab kabhi nahi aaya.
   *
   * "Withdrawn" se alag hai: wahan request accept hi nahi hui thi. Yahan
   * baat shuru hone ka mauqa mila tha -- unhone connect kiya -- magar age
   * nahi barhi.
   *
   * "Not now" bhi nahi, kyunke wo UNKA jawab hota hai. Ye khamoshi hai.
   */
  "No Reply",
];

/** Jin stages par baat khatam ho chuki hai */
const CLOSED_STAGES = ["Won", "Not now", "Lost", "Withdrawn", "No Reply"];

/** Stage -> rang (frontend wahi naam istemal karta hai jo contacts me hain) */
const STAGE_COLORS = {
  "Request Sent": "slate",
  Connected: "blue",
  "In Conversation": "blue",
  "Mock-up Sent": "yellow",
  "Sample Ordered": "green",
  "Bulk Quote Sent": "green",
  Won: "green",
  "Not now": "yellow",
  Lost: "red",

  // Slate -- ye nuqsan nahi, bas khamoshi hai. Laal rang ghalat paigham deta.
  Withdrawn: "slate",
  "No Reply": "slate",
};

const BUYER_TYPES = [
  "Grassroots Club",
  "US/Canada Youth Soccer",
  "School",
  "College/University",
  "Teamwear Reseller",
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
  "requestSent",
  "accepted",

  /**
   * Hamara bheja hua message -- unka jawab NAHI.
   *
   * Pehle Step 2 seedha 'conversation' likhta tha, yani manager ki report me
   * "Real conversations" barh jati thi mehaz is liye ke humne message bheja.
   * Guftagu do taraf se hoti hai: 'conversation' sirf tab likhi jati hai jab
   * buyer khud jawab de.
   */
  "messageSent",

  "conversation",
  "mockupOffered",
  "mockupSent",
  "sampleOrdered",
  "bulkQuoteSent",
];

/**
 * Table ke Action column ke liye: har stage par agla ek kaam.
 *
 * Maqsad: rozana ka kaam ek click me. Pehle "unhone accept kar li" likhne ke
 * liye buyer ka modal kholna, stage dhoondna aur save karna parta tha -- aur
 * ye cheez din me kai dafa hoti hai.
 *
 * Sirf wo qadam yahan hain jinke saath ek activity juri hai. 'Won' / 'Lost'
 * jaisa faisla jaan boojh kar shamil nahi: wo soch kar lagana chahiye, ek
 * click me nahi, aur uski koi ginti bhi nahi hoti.
 */
const NEXT_ACTION = {
  "Request Sent": {
    label: "Accepted",
    hint: 'They accepted the connection — stage becomes Connected. (After 3 weeks an unaccepted request turns into "Withdrawn" on its own)',
    activity: "accepted",
    stage: "Connected",
  },
  Connected: {
    label: "They replied",
    hint: 'They replied themselves — this is what counts as a "Real conversation"',
    activity: "conversation",
    stage: "In Conversation",
  },
  "In Conversation": {
    label: "Mock-up sent",
    hint: "Mock-up has been sent — stage becomes Mock-up Sent",
    activity: "mockupSent",
    stage: "Mock-up Sent",
  },
  "Mock-up Sent": {
    label: "Sample ordered",
    hint: "They ordered the $200 sample",
    activity: "sampleOrdered",
    stage: "Sample Ordered",
  },
  "Sample Ordered": {
    label: "Bulk quote sent",
    hint: "Quote sent for the full squad order",
    activity: "bulkQuoteSent",
    stage: "Bulk Quote Sent",
  },
};

/**
 * Kaam hone ke baad agla qadam kitne din baad dekhna hai.
 *
 * Matlab hamesha ek hi hai: "is buyer ko dobara kitne din baad dekhna hai".
 * Tareekh har kaam ke baad aaj se nayi lagti hai, is liye jo buyer chal raha
 * ho wo kabhi nazar se nahi girta.
 *
 * null ka matlab KOI tareekh nahi:
 *   Request Sent  -> gend unke paalay me hai, karne ko kuch nahi (aur 3 hafte
 *                    baad wo khud "Withdrawn" ho jati hai)
 *   Won/Lost/...  -> baat khatam, usay "due" ki list me rakhna jhooti ginti hai
 */
const NEXT_STEP_DAYS = {
  "Request Sent": null,

  /*
   * 7, 5 nahi -- aur ye playbook ke Step 4 se jura hua hai.
   *
   * Connected hote hi Step 2 chala jata hai, to agla qadam follow-up hai,
   * aur playbook kehta hai wo 7 din khamoshi ke baad jati hai. Pehle yahan
   * 5 tha aur table ke do column do alag tareekhein dikhate the -- Next Step
   * 18 Oct kehta tha aur Follow-up 20 Oct.
   *
   * Badlein to LiPipeline ka FOLLOW_UP_AFTER bhi wahi karna hoga.
   */
  Connected: 7,
  "In Conversation": 3,
  "Mock-up Sent": 5,
  "Sample Ordered": 7,
  "Bulk Quote Sent": 7,

  Won: null,
  "Not now": null,
  Lost: null,
  Withdrawn: null,
  "No Reply": null,
};

/**
 * Stage ke hisaab se agli tareekh.
 *
 * Aadhi raat par set hoti hai -- ye din ki tareekh hai, waqt ki nahi. Isi se
 * "2 din baqi" wala hisaab theek baithta hai.
 */
const nextStepFor = (stage, from = new Date()) => {
  const days = NEXT_STEP_DAYS[stage];
  if (days === null || days === undefined) return null;

  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);

  return d;
};

/**
 * Stage par pohanchte hi jo kaam HO CHUKA hota hai.
 *
 * "Connected" ka matlab is kaam me sirf "unhone accept kiya" nahi hai. Jab
 * koi accept karta hai to usi waqt Step 2 (shukriya + ek sawal) bhi bhej diya
 * jata hai -- dono ek hi lamhe ka kaam hain.
 *
 * Pehle app ko iska pata nahi chalta tha, aur do nuqsan hote the:
 *   1. modal wohi Step 2 dobara dikhata raha, halanke wo ja chuka tha
 *   2. hafte ki ginti me wo message gina hi nahi gaya -- 8 logon ko message
 *      jane ke bawajood report me 1 likha tha
 *
 * Connection request ke saath note nahi jata (LinkedIn wo option hamesha nahi
 * deta), is liye "Request Sent" par aisa kuch nahi hai.
 */
const STAGE_IMPLIES = {
  Connected: ["messageSent"],
};

/** Stage badalne par khud ba khud kaunsi activity likhi jaye */
const STAGE_ACTIVITY = {
  "Request Sent": "requestSent",
  Connected: "accepted",
  "In Conversation": "conversation",
  "Mock-up Sent": "mockupSent",
  "Sample Ordered": "sampleOrdered",
  "Bulk Quote Sent": "bulkQuoteSent",
};

/** Report me kaunsi line kis naam se aaye */
const ACTIVITY_LABELS = {
  requestSent: "Connection requests sent",
  accepted: "Accepted",
  messageSent: "Messages sent (hamare)",
  conversation: "Real conversations",
  mockupOffered: "Mock-ups offered",
  mockupSent: "Mock-ups sent",
  sampleOrdered: "Sample orders ($200)",
  bulkQuoteSent: "Bulk quotes sent",
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
    key: "step1a",
    label: "Step 1a — Connection note (cold)",
    when: "Day 0",
    activity: "requestSent",
    stage: "Request Sent",
    body:
      "Hi [Name], I help grassroots clubs like [Club] get custom kits made " +
      "direct from our factory in Sialkot. Would be good to connect.",
    urdu:
      "Hi [Name], main [Club] jaise chhote clubs ko Sialkot ki factory se seedha " +
      "custom kits banwane mein madad karta hun. Connect karke achha lagega.",
  },
  {
    key: "step1b",
    label: "Step 1b — Connection note (club already emailed)",
    when: "Day 0",
    activity: "requestSent",
    stage: "Request Sent",
    body:
      "Hi [Name], I sent a note to [Club] about kits this week. " +
      "Happy to connect here too.",
    urdu:
      "Hi [Name], maine is hafte [Club] ko kits ke baare mein email bheji thi. " +
      "Yahan bhi connect karke khushi hogi.",
  },
  {
    key: "step2",
    label: "Step 2 — Thanks + one question",
    when: "1–2 days after they accept",

    /*
     * Ye hamara message hai. Stage 'Connected' hi rehta hai aur ginti
     * 'messageSent' me jati hai -- 'In Conversation' tab hoga jab unka
     * jawab aayega.
     */
    activity: "messageSent",
    stage: null,
    body:
      "Hi [Name], thanks for connecting! I’m Adnan from Xportyn — we manufacture custom football kits and training wear directly from our factory in Sialkot.\n\n" +
      "I was looking at [Club] and was curious how you usually handle teamwear sourcing for the new season. Is this something you manage, or is there someone else on your team I should connect with?\n\n" +
      "Best regards,\n" +
      "Adnan Hassan\n" +
      "Sales Manager, Xportyn\n" +
      "+923476275532 | adnan@xportyn.com | www.xportyn.com",
    urdu:
      "Hi [Name], connect karne ka shukriya! Main Adnan hoon Xportyn se — hum Sialkot ki factory mein direct custom football kits aur training wear banate hain.\n\n" +
      "Main [Club] ka profile dekh raha tha aur jaanna chahta tha ke aap naye season ke liye teamwear sourcing kaise manage karte hain? Kya yeh aap manage karte hain, ya aapki team mein koi aur hai jisse mujhe baat karni chahiye?\n\n" +
      "Best regards,\n" +
      "Adnan Hassan\n" +
      "Sales Manager, Xportyn\n" +
      "+923476275532 | adnan@xportyn.com | www.xportyn.com",
  },
  {
    key: "step3",
    label: "Step 3 — Offer a free mock-up",
    when: "When they reply",
    activity: "mockupOffered",
    stage: null, // peshkash se stage nahi badalta -- mock-up bhejne par badlega
    body:
      "That makes sense. If it helps, our designers can put together a free " +
      "mock-up of a [Club] kit in your colours, no obligation. Just send your " +
      "crest and colours, or I can take them from your website.",
    urdu:
      "Theek baat hai. Agar faida ho to hamare designers [Club] ki kit ka aapke " +
      "rangon mein free mock-up bana sakte hain, koi pabandi nahi. Apna crest aur " +
      "rang bhej dein, ya main website se le leta hun.",
  },
  {
    key: "step4",
    label: "Step 4 — Useful follow-up (after 7 days of silence)",
    when: "No reply for 7 days",

    // Ye bhi hamara message hai -- pehle iska koi record nahi rakha jata tha
    activity: "messageSent",
    stage: null,
    body:
      "Hi [Name], just following up in case my previous message got buried in your inbox.\n\n" +
      "At Xportyn, we help clubs and academies get premium custom sportswear directly from our factory in Sialkot (no middleman). A few quick details:\n\n" +
      "• Products: Football kits, training wear, GK kits, team uniforms, custom designs, accessories & more.\n" +
      "• MOQ: Just 10 pieces\n" +
      "• Delivery: 3-4 weeks\n\n" +
      "If you are exploring new suppliers for the upcoming season, I’d be happy to send over some samples and pricing. Would that be useful?",
    urdu:
      "Hi [Name], bas follow-up kar raha hoon kahin meri pichli message aapke inbox mein dab na gayi ho.\n\n" +
      "Xportyn mein, hum clubs aur academies ko Sialkot ki factory se direct premium custom sportswear provide karte hain (koi middleman nahi). Kuch quick details:\n\n" +
      "• Products: Football kits, training wear, GK kits, team uniforms, custom designs, accessories aur bohat kuch.\n" +
      "• MOQ: Sirf 10 pieces\n" +
      "• Delivery: 3-4 hafte\n\n" +
      "Agar aap naye season ke liye naye suppliers dhoondh rahe hain, toh main samples aur pricing bhej kar khush hoga. Kya yeh useful hoga?",
    urdu:
      "Ek baat jo clubs ko dobara order karne se bachati hai: U8–U16 ke liye " +
      "umar ke bajaye chest aur height par size lein — aur 13+ walon ko ek size " +
      "bara dein, wo season ke beech barh jate hain. Poora size chart chahiye " +
      "to bhej dunga. Jawab ki zaroorat nahi.",
    note: "Stop after this — never more than two messages.",
  },
  {
    key: "step5",
    label: "Step 5 — Offer the $200 sample",
    when: "After they like the mock-up",
    activity: "sampleOrdered",
    stage: "Sample Ordered",
    body:
      "Glad you like it! If you'd like to check the quality before ordering for " +
      "the squad, we can make a sample for $200: one full match kit (jersey, " +
      "shorts and socks) plus a training kit, in this design. Shall I send the " +
      "details by email?",
    urdu:
      "Khushi hui ke pasand aaya! Poori team ka order dene se pehle quality check " +
      "karni ho to hum $200 mein sample bana sakte hain: is design mein poori " +
      "match kit (jersey, shorts, socks) aur ek training kit. Kya main details " +
      "email par bhej dun?",
  },
];

/* ================================================================== */
/*  JAWAB DENE KI GUIDE                                                */
/* ================================================================== */

const REPLY_GUIDE = [
  {
    theySay: '"Interested, send details"',
    reply:
      "Free mock-up offer (Step 3), then the $200 sample (Step 5) and the quote " +
      "link xportyn.com/quote",
    askZain: false,
  },
  {
    theySay: '"How much for 15 kits?"',
    reply:
      "Depends on design and fabric; I'll get you an exact quote within 1 " +
      "business day. — then ask for quantity, sizes and deadline.",
    askZain: true,
    askZainFor: "pricing",
  },
  {
    theySay: '"Is shipping included in the $200?"',
    reply:
      "Shipping is separate and depends on your country; I'll confirm the exact cost.",
    askZain: true,
    askZainFor: "shipping cost",
  },
  {
    theySay: '"We\'re sorted this season"',
    reply:
      "Say thanks, ask when they will sort kits for next season, and set a " +
      "reminder 2 months before.",
    askZain: false,
  },
  {
    theySay: '"Is ordering from Pakistan risky?"',
    reply:
      "Free mock-up first, a sample before any big order, tracked DHL/FedEx, " +
      "bank transfer or card, and export paperwork included.",
    askZain: false,
  },
  {
    theySay: '"Not interested" / "Stop"',
    reply:
      "No problem, thanks for letting me know. — mark as Lost, never message " +
      "them again.",
    askZain: false,
  },
  {
    theySay: "Asking for a discount, guarantee or free sample",
    reply: "Let me check with our founder.",
    askZain: true,
    askZainFor: "discount / guarantee",
  },
];

/**
 * Tayyar matn jo aksar chahiye hota hai.
 *
 * Step 4 me pehle "[link to post]" likha tha -- ek khali jagah jis ka koi
 * link mojood hi nahi tha. Ab Step 4 khud apni baat keh deta hai, aur agar
 * buyer kahe "bhej dein" to poora matn yahan tayyar hai.
 *
 * SIZE CHART KE NUMBERS JAAN BOOJH KAR KHALI HAIN. Wo XPORTYN ki apni
 * manufacturing par hote hain, aur andaze ke numbers bhejna ghalat maloomat
 * bhejna hai -- is se buyer ka bharosa jata hai. Zain se asal chart le kar
 * ek dafa yahan daal dein.
 */
const RESOURCES = [
  {
    key: "sizeGuide",
    title: "Youth kit sizing — send on request",
    when: "When they ask for the size chart or details",
    text:
      "Happy to help — here is what we tell clubs ordering for U8–U16 squads.\n" +
      "\n" +
      "1. Size on chest and height, not age. Two U12 players can be three " +
      "sizes apart. Age is the most common reason clubs end up re-ordering.\n" +
      "\n" +
      "2. For the 13+ group, order one size up. They grow through the season " +
      "and a tight kit by February means a mid-season re-order.\n" +
      "\n" +
      "3. Collect sizes about 6 weeks before the season. Any later and you " +
      "are choosing between rushing production or starting the season in old " +
      "kit.\n" +
      "\n" +
      "4. Add roughly 10% spare in your two most common sizes. New players " +
      "join, kits get lost, and a small buffer is far cheaper than a second " +
      "production run.\n" +
      "\n" +
      "5. If you are unsure, we can send a sample set to measure against " +
      "before you commit to the full order.\n" +
      "\n" +
      "[XPORTYN SIZE CHART — paste the real measurements here]\n" +
      "\n" +
      "If it helps, our designers can also put together a free mock-up of a " +
      "[Club] kit in your colours, no obligation.",
  },
  {
    key: "sizeGuidePost",
    title: "LinkedIn post — publish once",
    when: "Publish once on your own profile",
    text:
      "Ordering kit for a youth squad? Four things that save clubs a " +
      "re-order.\n" +
      "\n" +
      "After years of making kits for grassroots clubs and academies, the " +
      "same four mistakes come up again and again:\n" +
      "\n" +
      "1. Sizing by age instead of chest and height. Two U12 players can be " +
      "three sizes apart.\n" +
      "\n" +
      "2. Forgetting that the 13+ group grows mid-season. Order one size up " +
      "for them.\n" +
      "\n" +
      "3. Collecting sizes too late. Six weeks before the season is the " +
      "sweet spot.\n" +
      "\n" +
      "4. Ordering exactly the squad number. Add about 10% spare in your two " +
      "most common sizes — new players join and kits go missing.\n" +
      "\n" +
      "None of this is complicated, but getting it wrong costs a second " +
      "production run and a month of the season.\n" +
      "\n" +
      "Happy to share our full size chart with any club that wants it — just " +
      "drop me a message.\n" +
      "\n" +
      "#grassrootsfootball #youthsoccer #soccerkit #teamwear",
  },
];

/* ================================================================== */
/*  KHAREEDAR DHOONDNE KA TAREEQA                                      */
/* ================================================================== */

const SEARCH_HELPER = [
  {
    buyerType: "Grassroots Club",
    jobTitles: [
      "Club Secretary",
      "Chairman",
      "Kit Manager",
      "Welfare Officer",
      "Director of Coaching",
    ],
    searchWords: ["youth football club", "junior FC", "soccer club"],
    markets: ["UK", "Ireland", "Australia"],
  },
  {
    buyerType: "US/Canada Youth Soccer",
    jobTitles: [
      "Club Director",
      "Executive Director",
      "Operations Manager",
      "Registrar",
    ],
    searchWords: ["youth soccer", "soccer association", "SC"],
    markets: ["USA (Louisiana first)", "Canada"],
  },
  {
    buyerType: "School",
    jobTitles: ["Athletic Director", "Head of PE", "Director of Sport"],
    searchWords: ["high school", "academy", "secondary school"],
    markets: ["USA", "UK", "UAE", "Qatar"],
  },
  {
    buyerType: "College/University",
    jobTitles: ["Assistant AD", "Equipment Manager", "Head Soccer Coach"],
    searchWords: ["university athletics", "college soccer"],
    markets: ["USA", "UK"],
  },
  {
    buyerType: "Teamwear Reseller",
    jobTitles: ["Owner", "Founder", "Buyer"],
    searchWords: ["teamwear", "sports kit supplier", "sportswear shop"],
    markets: ["UK", "USA", "Gulf"],
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
    "CEO",
    "Director",
    "Owner",
    "President",
    "Head Coach",
    "Academy Director",
  ],
  searchWords: [
    "sports academy",
    "soccer club",
    "football club",
    "youth soccer",
    "soccer academy",
    "soccer academy USA",
    "football club USA",
    "football academy",
    "sports academy UK",
    "college soccer",
    "local soccer club",
    "high school soccer",
  ],
};

/* ================================================================== */
/*  ROZANA KA MAMOOL                                                   */
/* ================================================================== */

const DAILY_TASKS = [
  {
    key: "replies",
    minutes: 15,
    label: "Reply to yesterday's messages and connection notes",
    amount: "All",
  },
  {
    key: "comments",
    minutes: 15,
    label: "Comment on Zain's new post, then on 5 buyer posts",
    amount: "6 comments",
  },
  {
    key: "find",
    minutes: 20,
    label: "Find new buyers and send requests",
    amount: "15–20",
  },
  {
    key: "sequence",
    minutes: 15,
    label: "Step 2 to new connections; Step 4 to anyone silent for 7 days",
    amount: "—",
  },
  {
    key: "tracker",
    minutes: 10,
    label: "Update the pipeline tracker",
    amount: "—",
  },
];

const WEEKLY_TASKS = [
  {
    day: "Monday",
    label: "Pick this week's market (same country as the email campaign)",
  },
  {
    day: "Wednesday",
    label: "Withdraw requests older than 3 weeks that were never accepted",
  },
  { day: "Saturday", label: "Send Zain the weekly report" },
];

/* ================================================================== */
/*  QAWAID                                                             */
/* ================================================================== */

const RULES = [
  "No automation tools, bots or browser extensions — type everything by hand. LinkedIn bans accounts for these.",
  "Never more than 100 connection requests a week.",
  "Never a long sales pitch or price list in the first message.",
  "If two messages get no reply, stop.",
  "If someone says no, stop immediately.",
  "Never promise a price, discount, delivery date or guarantee until Zain confirms it.",
  "Only show kits, clubs and photos you are allowed to show.",
  "Always be upfront that you are from XPORTYN, Sialkot, Pakistan.",
];

const PROFILE_CHECKLIST = [
  { key: "photo", label: "Clear, smiling photo — plain background, no logo" },
  {
    key: "headline",
    label: "Set your headline",
    value:
      "Sales Manager, XPORTYN · Custom football kits for clubs & schools · MOQ 10 · Free mock-up",
  },
  {
    key: "banner",
    label: "Banner — the same kit photo banner as Zain's profile",
  },
  {
    key: "role",
    label:
      "Current role: XPORTYN (Private) Limited, linked to the company page, 3 lines about the work",
  },
  {
    key: "featured",
    label: "Featured: $200 sample page, quote page, and 2 posts of kits",
  },
  { key: "contact", label: "Contact info: work email and WhatsApp number" },
];

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

/** Stage ka rang */
const colorForStage = (stage) => STAGE_COLORS[stage] || "slate";

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
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
};

module.exports = {
  STAGES,
  CLOSED_STAGES,
  STAGE_COLORS,
  BUYER_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_LABELS,
  STAGE_ACTIVITY,
  STAGE_IMPLIES,
  NEXT_ACTION,
  NEXT_STEP_DAYS,
  nextStepFor,
  WEEKLY_TARGETS,
  WEEKLY_REQUEST_LIMIT,
  WEEKLY_REQUEST_WARN,
  MONTHLY_GOAL,
  OUTREACH_STEPS,
  REPLY_GUIDE,
  RESOURCES,
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
