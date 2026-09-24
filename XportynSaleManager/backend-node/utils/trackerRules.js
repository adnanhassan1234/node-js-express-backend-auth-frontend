/**
 * XPORTYN Sales Tracker — business rules
 * -------------------------------------
 * Ek hi jagah par saari "status" related logic rakhi hai (colors + follow-up cadence),
 * taake controller aur frontend dono same rules follow karein.
 */

/**
 * Allowed statuses (Mongoose enum bhi yahi use karta hai)
 *
 * "Not Contacted" = sheet import to ho gayi magar abhi tak koi email nahi bheji.
 * Ye har naye contact ki starting position hai. Jab aap waqai email bhej dein
 * tab aap khud "Email Sent" par le jate hain — tabhi counter barhta hai.
 */
const STATUSES = [
  'Not Contacted',
  'Email Sent',
  'Follow-up 1',
  'Follow-up 2',
  'Replied',
  'Deal Closed',
  'No Reply',
];

// Allowed categories
const CATEGORIES = ['Soccer', 'Schools', 'Colleges'];

// Status -> Color mapping (frontend row colors isi se banti hain)
const STATUS_COLORS = {
  'Not Contacted': 'white',
  'Email Sent': 'yellow',
  'Follow-up 1': 'orange',
  'Follow-up 2': 'red',
  Replied: 'green',
  'Deal Closed': 'blue',
  'No Reply': 'grey',
};

/**
 * PDF ke liye hex colors.
 * Ye jaan bujh kar app ki row colors se milte julte rakhe gaye hain, taake
 * screen par dekha hua contact print me bhi usi rang ka lage.
 *
 *   row  = row ka background
 *   dot  = row ke shuru me chhoti si rangeen patti
 *   text = status ke lafz ka rang
 */
const STATUS_PDF_COLORS = {
  'Not Contacted': { row: '#f1f5f9', dot: '#cbd5e1', text: '#64748b' },
  'Email Sent': { row: '#fef08a', dot: '#eab308', text: '#854d0e' },
  'Follow-up 1': { row: '#fed7aa', dot: '#f97316', text: '#9a3412' },
  'Follow-up 2': { row: '#fecaca', dot: '#ef4444', text: '#991b1b' },
  Replied: { row: '#bbf7d0', dot: '#22c55e', text: '#166534' },
  'Deal Closed': { row: '#bfdbfe', dot: '#3b82f6', text: '#1e40af' },
  'No Reply': { row: '#cbd5e1', dot: '#94a3b8', text: '#475569' },
};

/**
 * Follow-up cadence:
 *  - Not Contacted -> koi follow-up nahi (abhi email hi nahi bheji)
 *  - Email Sent    -> lastContactDate + 4 din
 *  - Follow-up 1   -> lastContactDate + 7 din
 *  - baqi sab      -> koi follow-up nahi (null)
 */
const FOLLOW_UP_DAYS = {
  'Email Sent': 4,
  'Follow-up 1': 7,
};

/** Date me din add karke nayi Date return karta hai (original ko change nahi karta) */
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Status ke hisaab se color return karta hai */
const colorForStatus = (status) => STATUS_COLORS[status] || 'grey';

/**
 * Status + lastContactDate se agli follow-up date nikalta hai.
 * Agar us status par koi follow-up nahi banti to null return hota hai.
 */
const nextFollowUpFor = (status, lastContactDate) => {
  const days = FOLLOW_UP_DAYS[status];
  if (!days) return null;
  return addDays(lastContactDate || new Date(), days);
};

/**
 * Excel/CSV ki "Category" value ko hamare 3 categories me map karta hai.
 * Rules (user requirement ke mutabiq):
 *   "soccer" / "football"        -> Soccer
 *   "college" / "university"     -> Colleges   (school se pehle check hota hai,
 *                                               warna "Law school" galat map hota)
 *   "school"                     -> Schools
 */
const mapCategory = (rawValue) => {
  const value = String(rawValue || '').toLowerCase();

  if (!value) return null;
  if (value.includes('soccer') || value.includes('football')) return 'Soccer';
  if (value.includes('college') || value.includes('universit')) return 'Colleges';
  if (value.includes('school') || value.includes('academy')) return 'Schools';

  return null;
};

/**
 * Sheet ki "Status" value ko hamare 7 statuses me map karta hai.
 *
 * Sheet me log kuch bhi likh dete hain -- "email sent", "EMAILSENT",
 * "Follow up 1", "FU2", "closed" -- is liye sirf harf aur adad rakh kar
 * milan karte hain. Na pehchana jaye to null (caller default laga lega).
 */
const STATUS_ALIASES = {
  'Not Contacted': ['notcontacted', 'notcontact', 'new', 'pending', 'none', 'nil'],
  'Email Sent': ['emailsent', 'sent', 'initialemailsent', 'initialemail', 'emailed', 'mailsent'],
  'Follow-up 1': ['followup1', 'follow1', 'fu1', '1stfollowup', 'firstfollowup', 'followupone'],
  'Follow-up 2': ['followup2', 'follow2', 'fu2', '2ndfollowup', 'secondfollowup', 'followuptwo'],
  Replied: ['replied', 'reply', 'responded', 'response', 'answered'],
  'Deal Closed': ['dealclosed', 'closed', 'won', 'dealwon', 'converted', 'sale'],
  'No Reply': ['noreply', 'noresponse', 'noanswer', 'nothing', 'ignored'],
};

const normalizeStatus = (rawValue) => {
  const value = String(rawValue || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!value) return null;

  // Pehle bilkul theek naam (jaise sheet me "Email Sent" likha ho)
  const exact = STATUSES.find(
    (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '') === value
  );
  if (exact) return exact;

  // Phir aliases
  const found = Object.entries(STATUS_ALIASES).find(([, aliases]) => aliases.includes(value));
  return found ? found[0] : null;
};

module.exports = {
  STATUSES,
  CATEGORIES,
  STATUS_COLORS,
  STATUS_PDF_COLORS,
  FOLLOW_UP_DAYS,
  addDays,
  colorForStatus,
  nextFollowUpFor,
  mapCategory,
  normalizeStatus,
};
