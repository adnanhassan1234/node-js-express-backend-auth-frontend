/**
 * Status -> Tailwind classes + chart colors.
 *
 * NOTE: Tailwind ko class names literal chahiye hote hain (string concat se
 * `bg-${color}-50` kaam nahi karta), is liye har class poori likhi gayi hai.
 */

export const STATUSES = [
  'Not Contacted',
  'Email Sent',
  'Follow-up 1',
  'Follow-up 2',
  'Replied',
  'Deal Closed',
  'No Reply',
];

export const CATEGORIES = ['Soccer', 'Schools', 'Colleges'];

export const STATUS_STYLES = {
  // Sheet me hai magar abhi tak email nahi bheji — bilkul saaf/white row
  'Not Contacted': {
    label: 'Not Contacted',
    colorName: 'white',
    row: 'bg-slate-100 hover:bg-slate-200',
    badge: 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300',
    dot: 'bg-slate-300',
    bar: 'bg-white ring-1 ring-inset ring-slate-300',
    hex: '#e2e8f0',
  },
  'Email Sent': {
    label: 'Email Sent',
    colorName: 'yellow',
    row: 'bg-yellow-200 hover:bg-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-300',
    dot: 'bg-yellow-400',
    bar: 'bg-yellow-400',
    hex: '#facc15',
  },
  'Follow-up 1': {
    label: 'Follow-up 1',
    colorName: 'orange',
    row: 'bg-orange-200 hover:bg-orange-300',
    badge: 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-300',
    dot: 'bg-orange-400',
    bar: 'bg-orange-400',
    hex: '#fb923c',
  },
  'Follow-up 2': {
    label: 'Follow-up 2',
    colorName: 'red',
    row: 'bg-red-200 hover:bg-red-300',
    badge: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-300',
    dot: 'bg-red-400',
    bar: 'bg-red-400',
    hex: '#f87171',
  },
  Replied: {
    label: 'Replied',
    colorName: 'green',
    row: 'bg-green-200 hover:bg-green-300',
    badge: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-300',
    dot: 'bg-green-500',
    bar: 'bg-green-500',
    hex: '#22c55e',
  },
  'Deal Closed': {
    label: 'Deal Closed',
    colorName: 'blue',
    row: 'bg-blue-200 hover:bg-blue-300',
    badge: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-300',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
    hex: '#3b82f6',
  },
  'No Reply': {
    label: 'No Reply',
    colorName: 'grey',
    row: 'bg-slate-300 hover:bg-slate-400',
    badge: 'bg-slate-200 text-slate-700 ring-1 ring-inset ring-slate-300',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
    hex: '#94a3b8',
  },
};

/** Agar koi unknown status aa jaye to crash na ho */
export const styleForStatus = (status) => STATUS_STYLES[status] || STATUS_STYLES['No Reply'];

/** Pie chart ke liye category colors */
export const CATEGORY_COLORS = {
  Soccer: '#3366ff',
  Schools: '#22c55e',
  Colleges: '#f59e0b',
};
