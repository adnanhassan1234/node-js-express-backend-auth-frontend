/**
 * Dashboard ka ek stat card.
 * `accent` se left border aur number ka rang change hota hai.
 */
const ACCENTS = {
  slate: { border: 'border-l-slate-400', text: 'text-slate-700', bg: 'bg-slate-100' },
  yellow: { border: 'border-l-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-100' },
  orange: { border: 'border-l-orange-400', text: 'text-orange-600', bg: 'bg-orange-100' },
  red: { border: 'border-l-red-400', text: 'text-red-600', bg: 'bg-red-100' },
  green: { border: 'border-l-green-500', text: 'text-green-600', bg: 'bg-green-100' },
  blue: { border: 'border-l-blue-500', text: 'text-blue-600', bg: 'bg-blue-100' },
  brand: { border: 'border-l-brand-600', text: 'text-brand-700', bg: 'bg-brand-100' },
};

const StatCard = ({ title, value, accent = 'slate', icon, subtitle, onClick }) => {
  const style = ACCENTS[accent] || ACCENTS.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`card flex w-full items-center justify-between border-l-4 p-4 text-left transition
                  ${style.border}
                  ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className={`mt-1 text-3xl font-bold ${style.text}`}>{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>

      {icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ${style.bg}`}>
          {icon}
        </div>
      )}
    </button>
  );
};

export default StatCard;
