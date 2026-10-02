import { useEffect, useMemo, useRef, useState } from 'react';
import { LuChevronDown, LuSearch, LuCheck, LuX } from 'react-icons/lu';

/**
 * Dropdown jiske andar search hai.
 *
 * Aam `<select>` me jab 50-100 naam ho jate hain to scroll karna aziyat ban
 * jata hai. Yahan likhte hi list chhant jati hai.
 *
 * Hidayat: list jagah bana kar khulti hai (overlay nahi). Wajah: ye aksar
 * modal ya kisi aur `overflow-y-auto` wale dibbe ke andar lagta hai, jahan
 * overlay neeche se kat jati hai.
 *
 * `options`: [{ value, label, hint }] -- hint neeche choti likhai me aata hai
 * aur search usme bhi dhoondta hai (misal: club ya stage se naam dhoondna).
 */
const SearchSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Chunein',
  searchPlaceholder = 'Likh kar dhoondein…',
  emptyText = 'Kuch nahi mila',
  footer = null,
}) => {
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

  useEffect(() => {
    if (!open) return undefined;

    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => setHighlight(0), [query]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    return options.filter((o) =>
      (String(o.label || '') + ' ' + String(o.hint || '')).toLowerCase().includes(q)
    );
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const pick = (option) => {
    onChange(option ? option.value : '');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (shown[highlight]) pick(shown[highlight]);
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => {
        const next = e.key === 'ArrowDown' ? h + 1 : h - 1;
        if (next < 0) return shown.length - 1;
        if (next >= shown.length) return 0;
        return next;
      });
    }
  };

  if (!open) {
    return (
      <div ref={boxRef}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="input flex items-center justify-between text-left"
        >
          <span className={`min-w-0 truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <LuChevronDown className="ml-1 h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef}>
      <div className="rounded-lg border border-brand-500 bg-white ring-2 ring-brand-200">
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <LuSearch className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
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
          {shown.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{emptyText}</p>
          ) : (
            shown.map((o, i) => (
              <button
                key={o.value}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(o)}
                className={`flex w-full items-start justify-between gap-2 px-3 py-1.5 text-left transition ${
                  i === highlight ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">{o.label}</span>
                  {o.hint && <span className="block truncate text-xs text-slate-500">{o.hint}</span>}
                </span>

                {o.value === value && <LuCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />}
              </button>
            ))
          )}
        </div>

        {footer && (
          <p className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
            {footer}
          </p>
        )}

        {value && (
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full border-t border-slate-200 px-3 py-1.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            Chunav hatayein
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchSelect;
