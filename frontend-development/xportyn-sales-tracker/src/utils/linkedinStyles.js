/**
 * LinkedIn pipeline ke rang.
 *
 * Wahi tareeqa jo Contacts ki table par hai: row ka rang wohi hai jo hover par
 * dikhta hai, taake dono screens ek jaisi lagen.
 */

const STAGE_STYLES = {
  'Request Sent': {
    row: 'bg-slate-100 hover:bg-slate-200',
    badge: 'bg-slate-200 text-slate-700',
    hex: '#94a3b8',
  },
  Connected: {
    row: 'bg-sky-100 hover:bg-sky-200',
    badge: 'bg-sky-200 text-sky-800',
    hex: '#38bdf8',
  },
  'In Conversation': {
    row: 'bg-blue-100 hover:bg-blue-200',
    badge: 'bg-blue-200 text-blue-800',
    hex: '#3b82f6',
  },
  'Mock-up Sent': {
    row: 'bg-yellow-100 hover:bg-yellow-200',
    badge: 'bg-yellow-200 text-yellow-800',
    hex: '#eab308',
  },
  'Sample Ordered': {
    row: 'bg-emerald-100 hover:bg-emerald-200',
    badge: 'bg-emerald-200 text-emerald-800',
    hex: '#10b981',
  },
  'Bulk Quote Sent': {
    row: 'bg-teal-100 hover:bg-teal-200',
    badge: 'bg-teal-200 text-teal-800',
    hex: '#14b8a6',
  },
  Won: {
    row: 'bg-green-200 hover:bg-green-300',
    badge: 'bg-green-300 text-green-900',
    hex: '#22c55e',
  },
  'Not now': {
    row: 'bg-amber-100 hover:bg-amber-200',
    badge: 'bg-amber-200 text-amber-800',
    hex: '#f59e0b',
  },
  Lost: {
    row: 'bg-red-100 hover:bg-red-200',
    badge: 'bg-red-200 text-red-800',
    hex: '#ef4444',
  },

  /*
   * Withdrawn: 3 hafte me request accept na hui.
   *
   * Jaan boojh kar halka slate -- Lost ki tarah laal nahi. Kuch haara nahi,
   * baat shuru hi nahi hui; laal rang isay nakami dikhata jo ghalat hai.
   */
  Withdrawn: {
    row: 'bg-slate-50 hover:bg-slate-100',
    badge: 'bg-slate-200 text-slate-500',
    hex: '#cbd5e1',
  },
};

const FALLBACK = {
  row: 'bg-white hover:bg-slate-50',
  badge: 'bg-slate-100 text-slate-600',
  hex: '#cbd5e1',
};

export const styleForStage = (stage) => STAGE_STYLES[stage] || FALLBACK;

/**
 * Target ke muqable me progress ka rang.
 *
 * Laal sirf tab jab bilkul shuruaat ho -- warna har Monday poora dashboard laal
 * hota aur us ka koi matlab na rehta.
 */
export const progressColor = (done, target) => {
  if (!target) return 'bg-slate-400';

  const pct = (done / target) * 100;

  if (pct >= 100) return 'bg-green-500';
  if (pct >= 60) return 'bg-brand-500';
  if (pct >= 25) return 'bg-amber-500';

  return 'bg-red-400';
};

/** Buyer type ke chhote nishan */
export const BUYER_TYPE_SHORT = {
  'Grassroots Club': 'Club',
  'US/Canada Youth Soccer': 'US/CA Soccer',
  School: 'School',
  'College/University': 'College',
  'Teamwear Reseller': 'Reseller',
};
