import { LuChevronLeft, LuChevronRight, LuRotateCcw } from 'react-icons/lu';

import { formatDate } from '../../utils/date';

/**
 * Hafte ka nav — pichhla hafta, agla hafta, aur "Is hafte" par wapsi.
 *
 * Wajood ki wajah: app pehle sirf maujooda hafta dikhati thi. Monday aate hi
 * guzra hafta nazar se ghayab ho jata tha, chahe uski ginti database me
 * mahfooz hoti. Ab purana hafta khola ja sakta hai -- aur us hafte ki report
 * baad me bhi save ki ja sakti hai.
 *
 * Aage jaane ka raasta maujooda hafte par band hai: aane waale hafte ki ginti
 * hamesha sifar hogi, us me dekhne ko kuch nahi.
 */

/** "2026-09-28" — local din, timezone ke phande se bachne ke liye */
export const weekKey = (any) => {
  const d = new Date(any);
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

/** Kisi bhi din ka Monday */
export const mondayOf = (any) => {
  const d = new Date(any);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

/** Jo hafta khula hai, wo maujooda hafta hai ya guzra hua? */
export const isCurrentWeek = (start) => weekKey(mondayOf(start)) === weekKey(mondayOf(new Date()));

const LiWeekNav = ({ start, end, onChange }) => {
  const shown = mondayOf(start);
  const current = isCurrentWeek(start);

  /* Maujooda hafte ke liye URL khali rakhte hain, taake link saaf rahe */
  const go = (days) => {
    const d = new Date(shown);
    d.setDate(d.getDate() + days);

    const key = weekKey(d);
    onChange?.(key === weekKey(mondayOf(new Date())) ? '' : key);
  };

  const arrow =
    'rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-100 ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => go(-7)} title="Pichhla hafta" className={arrow}>
        <LuChevronLeft className="h-4 w-4" />
      </button>

      <span className="text-sm font-semibold text-slate-800">
        {formatDate(start)} – {formatDate(end)}
      </span>

      <button
        type="button"
        onClick={() => go(7)}
        disabled={current}
        title={current ? 'Ye maujooda hafta hai' : 'Agla hafta'}
        className={arrow}
      >
        <LuChevronRight className="h-4 w-4" />
      </button>

      {current ? (
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
          Ye hafta
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onChange?.('')}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          <LuRotateCcw className="h-3.5 w-3.5" />
          Is hafte par wapas
        </button>
      )}
    </div>
  );
};

export default LiWeekNav;
