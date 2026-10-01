import { useEffect, useMemo, useRef, useState } from 'react';
import { LuChevronDown, LuSearch, LuCheck, LuX } from 'react-icons/lu';

import { COUNTRIES, PRIMARY_MARKETS, COUNTRY_ALIASES } from '../utils/countries';

/**
 * Country chunne ka dropdown, andar search ke saath.
 *
 * Do faisle jo samajhne layak hain:
 *
 * 1. List overlay (absolute) nahi, balke jagah bana kar khulti hai. Jis modal
 *    me ye lagta hai uska jism `overflow-y-auto` hai -- overlay neeche se kat
 *    jati thi. Is tarah list ke saath container khud scroll ho jata hai.
 *
 * 2. List pakki nahi hai: jo likha jaye wo bhi rakha ja sakta hai. Sheet se
 *    import hui rows me "Sydney, Australia" jaisi cheezein maujood hain, aur
 *    unhein zabardasti badalna ghalat hoga.
 */
const CountrySelect = ({ value, onChange, placeholder = 'Country chunein' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const boxRef = useRef(null);
  const searchRef = useRef(null);

  /* Khulte hi search par focus -- user seedha likhna shuru kar sake */
  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery('');
  }, [open]);

  /* Bahar click karne par band */
  useEffect(() => {
    if (!open) return undefined;

    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const { pinned, rest, flat } = useMemo(() => {
    const q = query.trim().toLowerCase();

    /**
     * Alias zaroori hai: "United Kingdom" me "uk" ka koi tukra nahi hai, is
     * liye sirf includes() se "uk" likhne par kuch nahi milta. Yehi haal
     * "usa", "uae", "ksa" ka hai -- aur log aksar yahi likhte hain.
     */
    const aliased = COUNTRY_ALIASES[q];
    const match = (c) => c.toLowerCase().includes(q) || c === aliased;

    const top = q ? PRIMARY_MARKETS.filter(match) : PRIMARY_MARKETS;
    const all = q ? COUNTRIES.filter(match) : COUNTRIES;
    const others = all.filter((c) => !top.includes(c));

    return { pinned: top, rest: others, flat: [...top, ...others] };
  }, [query]);

  /**
   * Jo likha hai wo list me nahi? To usay bhi rakhne ka raasta do.
   *
   * Magar alias par nahi: "uk" likhne par "United Kingdom" pehle se list me
   * aa gaya hai, to alag se "uk" rakhne ki peshkash sirf ghalti karwayegi.
   */
  const typed = query.trim();
  const custom =
    typed &&
    !COUNTRY_ALIASES[typed.toLowerCase()] &&
    !flat.some((c) => c.toLowerCase() === typed.toLowerCase())
      ? typed
      : '';

  const options = custom ? [...flat, custom] : flat;

  useEffect(() => setHighlight(0), [query]);

  const pick = (country) => {
    onChange(country);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (options[highlight]) pick(options[highlight]);
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => {
        const next = e.key === 'ArrowDown' ? h + 1 : h - 1;
        if (next < 0) return options.length - 1;
        if (next >= options.length) return 0;
        return next;
      });
    }
  };

  /* Ek row -- highlight ka hisaab poori (flat) list par hota hai */
  const row = (country, index) => (
    <button
      key={country}
      type="button"
      onMouseEnter={() => setHighlight(index)}
      onClick={() => pick(country)}
      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition ${
        index === highlight ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {country}
      {country === value && <LuCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />}
    </button>
  );

  return (
    <div ref={boxRef}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="input flex items-center justify-between text-left"
        >
          <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value || placeholder}</span>
          <LuChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      ) : (
        <div className="rounded-lg border border-brand-500 bg-white ring-2 ring-brand-200">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <LuSearch className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Mulk ka naam likhein…"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Band karein"
              className="shrink-0 text-slate-400 transition hover:text-slate-700"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">Koi mulk nahi mila</p>
            ) : (
              <>
                {pinned.length > 0 && (
                  <>
                    <p className="px-3 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Playbook ke markets
                    </p>
                    {pinned.map((c, i) => row(c, i))}
                  </>
                )}

                {rest.length > 0 && (
                  <>
                    <p className="mt-1 border-t border-slate-100 px-3 pb-0.5 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Sab mulk
                    </p>
                    {rest.map((c, i) => row(c, pinned.length + i))}
                  </>
                )}

                {custom && (
                  <>
                    <p className="mt-1 border-t border-slate-100 px-3 pb-0.5 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Jaisa likha hai
                    </p>
                    {row(custom, flat.length)}
                  </>
                )}
              </>
            )}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => pick('')}
              className="w-full border-t border-slate-200 px-3 py-1.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              Country hata dein
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
