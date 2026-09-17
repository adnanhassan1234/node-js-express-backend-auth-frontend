/** Simple pagination bar — Contacts table ke neeche */
const Pagination = ({ currentPage, totalPages, totalRecords, perPage, onPageChange, onPerPageChange }) => {
  if (!totalRecords) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalRecords);

  // Sirf aas paas ke page numbers dikhate hain (1 ... 4 5 6 ... 20)
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>
          <strong className="text-slate-800">{from}</strong>–
          <strong className="text-slate-800">{to}</strong> of{' '}
          <strong className="text-slate-800">{totalRecords}</strong>
        </span>

        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand-500"
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600
                     transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>

        {start > 1 && <span className="px-2 text-slate-400">…</span>}

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] rounded-md px-3 py-1.5 text-sm font-medium transition ${
              page === currentPage
                ? 'bg-brand-600 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}

        {end < totalPages && <span className="px-2 text-slate-400">…</span>}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600
                     transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
