import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { contactsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { CATEGORIES, STATUSES, styleForStatus } from '../utils/statusStyles';
import { formatDate, isOverdue } from '../utils/date';

import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import ContactModal from '../components/ContactModal';
import ImportModal from '../components/ImportModal';
import AddContactModal from '../components/AddContactModal';

/** Download ke teen options */
const EXPORT_OPTIONS = [
  { format: 'csv', icon: '📄', label: 'CSV file', hint: 'Opens in Excel, Sheets and almost anything else' },
  { format: 'xlsx', icon: '📊', label: 'Excel / Google Sheets', hint: 'Sheets me: File → Import → Upload' },
  { format: 'pdf', icon: '📕', label: 'PDF file', hint: 'Print ya share karne ke liye' },
];

/** Contacts page — filters, color-coded table, import aur detail modal */
const Contacts = () => {
  // URL se initial filters (Dashboard card click se aate hain)
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All',
    status: searchParams.get('status') || 'All',
    city: searchParams.get('city') || 'All',
    hasEmail: searchParams.get('hasEmail') || 'All',
    lastContactFrom: searchParams.get('lastContactFrom') || '',
    lastContactTo: searchParams.get('lastContactTo') || '',
  });

  /**
   * Date wale khane turant filter nahi karte — user pehle dono dates chunta hai,
   * phir "OK" dabata hai. Is liye draft alag rakha hai.
   */
  const [dateDraft, setDateDraft] = useState({
    from: searchParams.get('lastContactFrom') || '',
    to: searchParams.get('lastContactTo') || '',
  });

  // Search ko debounce karte hain (har keystroke par API call na ho)
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState({ totalRecords: 0, totalPages: 1 });
  const [options, setOptions] = useState({ cities: [] });

  const [selectedId, setSelectedId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  /* ---------------- Debounce search ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.search]);

  /* ---------------- Filter dropdown options ---------------- */
  const loadOptions = useCallback(() => {
    contactsApi
      .filterOptions()
      .then((res) => setOptions(res.data.data))
      .catch(() => {
        /* options fail ho jayen to bhi page chalta rahe */
      });
  }, []);

  useEffect(loadOptions, [loadOptions]);

  /* ---------------- Contacts load ---------------- */
  const loadContacts = useCallback(() => {
    setLoading(true);

    const params = {
      page,
      limit: perPage,
      search: debouncedSearch || undefined,
      category: filters.category !== 'All' ? filters.category : undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      city: filters.city !== 'All' ? filters.city : undefined,
      hasEmail: filters.hasEmail !== 'All' ? filters.hasEmail : undefined,
      lastContactFrom: filters.lastContactFrom || undefined,
      lastContactTo: filters.lastContactTo || undefined,
    };

    contactsApi
      .list(params)
      .then((res) => {
        setContacts(res.data.data);
        setMeta({ totalRecords: res.data.totalRecords, totalPages: res.data.totalPages });
        setSelectedIds([]);
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load contacts')))
      .finally(() => setLoading(false));
  }, [
    page,
    perPage,
    debouncedSearch,
    filters.category,
    filters.status,
    filters.city,
    filters.hasEmail,
    filters.lastContactFrom,
    filters.lastContactTo,
  ]);

  useEffect(loadContacts, [loadContacts]);

  /* ---------------- URL sync (filters shareable rahen) ---------------- */
  useEffect(() => {
    const next = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') next[key] = value;
    });

    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  /* ---------------- Handlers ---------------- */

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      status: 'All',
      city: 'All',
      hasEmail: 'All',
      lastContactFrom: '',
      lastContactTo: '',
    });
    setDateDraft({ from: '', to: '' });
    setPage(1);
  };

  /** "OK" dabane par date range filter lag jata hai */
  const applyDateFilter = () => {
    setFilters((prev) => ({
      ...prev,
      lastContactFrom: dateDraft.from,
      lastContactTo: dateDraft.to,
    }));
    setPage(1);
  };

  const clearDateFilter = () => {
    setDateDraft({ from: '', to: '' });
    setFilters((prev) => ({ ...prev, lastContactFrom: '', lastContactTo: '' }));
    setPage(1);
  };

  /** Table se direct status change (row click trigger na ho, is liye stopPropagation) */
  const handleStatusChange = async (event, contactId) => {
    event.stopPropagation();
    const status = event.target.value;

    try {
      const res = await contactsApi.updateStatus(contactId, status);

      // Poori list dobara fetch karne ke bajaye sirf wohi row update kar dete hain
      setContacts((prev) => prev.map((c) => (c._id === contactId ? res.data.data : c)));
      toast.success(`Status set to "${status}"`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Status update failed'));
    }
  };

  const toggleSelect = (event, contactId) => {
    event.stopPropagation();

    setSelectedIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === contacts.length ? [] : contacts.map((c) => c._id)));
  };

  /**
   * Download — bilkul wohi filters bhejte hain jo abhi lage huay hain,
   * is liye jo table me dikh raha hai wohi file me aata hai (sirf ye page nahi, poori list).
   *
   * Token header me chahiye hota hai, is liye seedha <a href> kaam nahi karta —
   * pehle blob laate hain, phir usay download karwate hain.
   */
  const handleExport = async (format) => {
    setExportOpen(false);
    setExporting(format);

    try {
      const params = {
        search: debouncedSearch || undefined,
        category: filters.category !== 'All' ? filters.category : undefined,
        status: filters.status !== 'All' ? filters.status : undefined,
        city: filters.city !== 'All' ? filters.city : undefined,
        hasEmail: filters.hasEmail !== 'All' ? filters.hasEmail : undefined,
        lastContactFrom: filters.lastContactFrom || undefined,
        lastContactTo: filters.lastContactTo || undefined,
      };

      const res = await contactsApi.download(params, format);

      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download =
        'xportyn-contacts-' + new Date().toISOString().slice(0, 10) + '.' + format;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(format.toUpperCase() + ' downloaded');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Download failed'));
    } finally {
      setExporting('');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} contacts?`)) return;

    try {
      const res = await contactsApi.bulkRemove(selectedIds);
      toast.success(res.data.message);
      loadContacts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete failed'));
    }
  };

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([, v]) => v && v !== 'All').length,
    [filters]
  );

  /* ---------------- Render ---------------- */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Contacts</h2>
          <p className="text-sm text-slate-500">
            {meta.totalRecords} contacts {activeFilterCount > 0 && '(filtered)'}
          </p>
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button type="button" onClick={handleBulkDelete} className="btn-danger">
              Delete {selectedIds.length}
            </button>
          )}
          {/* ---------- Download (CSV / Excel / PDF) ---------- */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((open) => !open)}
              disabled={Boolean(exporting) || meta.totalRecords === 0}
              className="btn-secondary"
            >
              {exporting ? 'Preparing...' : '⬇️ Download'}
            </button>

            {exportOpen && (
              <>
                {/* Bahar click karne par menu band */}
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />

                <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {EXPORT_OPTIONS.map((option) => (
                    <button
                      key={option.format}
                      type="button"
                      onClick={() => handleExport(option.format)}
                      className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-0 hover:bg-slate-50"
                    >
                      <span className="text-base leading-none">{option.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {option.label}
                        </span>
                        <span className="block text-xs text-slate-500">{option.hint}</span>
                      </span>
                    </button>
                  ))}

                  <p className="bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                    Matching the current filters — <strong>{meta.totalRecords}</strong> contacts
                  </p>
                </div>
              </>
            )}
          </div>

          <button type="button" onClick={loadContacts} className="btn-secondary">
            🔄 Refresh
          </button>
          <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
            ➕ Add Contact
          </button>
          <button type="button" onClick={() => setShowImport(true)} className="btn-primary">
            ⬆️ Import Excel/CSV
          </button>
        </div>
      </div>

      {/* ---------------- Filters ---------------- */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="label">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by name, email or city..."
              className="input"
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="input"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="input"
            >
              <option value="All">All Statuses</option>
              {/* Dashboard ke "Follow-ups Pending" card se aane par yehi select hota hai */}
              <option value="Follow-up 1,Follow-up 2">Follow-ups Pending (1 + 2)</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">City</label>
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="input"
            >
              <option value="All">All Cities</option>
              {options.cities?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ---------- Last Contact date range (OK dabane par lagta hai) ---------- */}
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
          <div>
            <label className="label">Last Contact — From</label>
            <input
              type="date"
              value={dateDraft.from}
              max={dateDraft.to || undefined}
              onChange={(e) => setDateDraft((d) => ({ ...d, from: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyDateFilter()}
              className="input w-36"
            />
          </div>

          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={dateDraft.to}
              min={dateDraft.from || undefined}
              onChange={(e) => setDateDraft((d) => ({ ...d, to: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyDateFilter()}
              className="input w-36"
            />
          </div>

          <button type="button" onClick={applyDateFilter} className="btn-primary">
            OK
          </button>

          {(filters.lastContactFrom || filters.lastContactTo) && (
            <button type="button" onClick={clearDateFilter} className="btn-danger">
           Remove Date
            </button>
          )}

{/* 
          <p className="text-xs text-slate-500">
            This works together with the status and category filters above. For a single day, put
            the same date in both boxes.
          </p> */}
          {/* Dayen taraf — date wali isi line me */}
          <div className="ml-auto flex flex-wrap items-center gap-4 pb-1.5">
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-600">
              <input
                type="checkbox"
                checked={filters.hasEmail === 'true'}
                onChange={(e) => updateFilter('hasEmail', e.target.checked ? 'true' : 'All')}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              With email only
            </label>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="whitespace-nowrap text-sm font-semibold text-brand-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Table ---------------- */}
      <div className="card overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading contacts..." />
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-2 font-semibold text-slate-700">No contacts found</p>
            <p className="mt-1 text-sm text-slate-500">
              {activeFilterCount > 0
                ? 'Try changing the filters'
                : 'Import an Excel or CSV file to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              {/*
                A light grid line on every cell, with a dark header.
                The header colour matches the sidebar and the PDF/Excel export header.
              */}
              <table className="w-full text-sm [&_td]:border-b [&_td]:border-r [&_td]:border-slate-200/70 [&_td:last-child]:border-r-0">
                <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-200 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === contacts.length && contacts.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-brand-500 focus:ring-brand-400"
                      />
                    </th>
                    <th className="w-12 px-3 py-3 text-center font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last Contact</th>
                    <th className="px-4 py-3 font-semibold">Next Follow-up</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                {/* Rows ke beech ki line ab har cell ke border-b se aati hai */}
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr
                      key={contact._id}
                      onClick={() => setSelectedId(contact._id)}
                      className={`cursor-pointer transition ${styleForStatus(contact.status).row}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact._id)}
                          onChange={(e) => toggleSelect(e, contact._id)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>

                      {/* Serial number — pages ke aar paar chalta hai (page 2 par 26 se) */}
                      <td className="px-3 py-3 text-center text-xs font-medium text-slate-400">
                        {(page - 1) * perPage + index + 1}
                      </td>

                      <td className="max-w-[240px] px-4 py-3">
                        <p className="truncate font-semibold text-slate-800">{contact.name}</p>
                        {contact.contactPerson && (
                          <p className="truncate text-xs text-slate-500">{contact.contactPerson}</p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {contact.city || '—'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                          {contact.category}
                        </span>
                      </td>

                      <td className="max-w-[200px] px-4 py-3">
                        {contact.email ? (
                          <span className="block truncate text-slate-600">{contact.email}</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600">No email</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {contact.phone || '—'}
                      </td>

                      {/* Inline status change */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={contact.status}
                          onChange={(e) => handleStatusChange(e, contact._id)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold
                                     text-slate-700 outline-none focus:border-brand-500"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(contact.lastContactDate)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {contact.nextFollowUpDate ? (
                          <span
                            className={`font-medium ${
                              isOverdue(contact.nextFollowUpDate)
                                ? 'text-red-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {formatDate(contact.nextFollowUpDate)}
                            {isOverdue(contact.nextFollowUpDate) && ' ⏰'}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(contact._id);
                          }}
                          className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700
                                     ring-1 ring-inset ring-brand-200 transition hover:bg-brand-50"
                        >
                          Open Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={meta.totalPages}
              totalRecords={meta.totalRecords}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-slate-500">
        <span className="font-semibold">Row colors:</span>
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${styleForStatus(s).bar}`} />
            {s}
          </span>
        ))}
      </div>

      {/* Modals */}
      {selectedId && (
        <ContactModal
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={(updated) =>
            setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
          }
          onDeleted={(id) => setContacts((prev) => prev.filter((c) => c._id !== id))}
        />
      )}

      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            // Nayi entry list me aa jaye, aur city dropdown bhi update ho
            loadContacts();
            loadOptions();
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            loadContacts();
            loadOptions();
          }}
        />
      )}
    </div>
  );
};

export default Contacts;
