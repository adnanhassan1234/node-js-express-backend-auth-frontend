/** Date helpers — sab jagah ek hi format rahe */

/** "12 Sep 2026" jaisa readable format */
export const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** "17 Sept 2026, 12:16 pm" — email history ke liye */
export const formatDateTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/** <input type="date"> ke liye yyyy-mm-dd format */
export const toDateInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  // Local timezone ke hisaab se (UTC shift se din na badle)
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

/** Aaj ki date se compare — follow-up late to nahi ho gayi */
export const isOverdue = (value) => {
  if (!value) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return new Date(value) < startOfToday;
};

/** "3 din baqi" / "2 din late" type text */
export const daysFromToday = (value) => {
  if (!value) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  return Math.round((target - startOfToday) / (1000 * 60 * 60 * 24));
};
