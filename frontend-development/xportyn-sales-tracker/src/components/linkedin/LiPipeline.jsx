import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuPlus,
  LuDownload,
  LuUpload,
  LuSearch,
  LuTrash2,
  LuDatabaseBackup,
  LuHardDriveDownload,
  LuChevronDown,
  LuFileText,
  LuLinkedin,
  LuUserCheck,
} from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { styleForStage, BUYER_TYPE_SHORT } from '../../utils/linkedinStyles';
import { formatDate, daysFromToday } from '../../utils/date';

import Spinner from '../Spinner';
import Pagination from '../Pagination';
import LiBuyerModal from './LiBuyerModal';

/**
 * Agla qadam kitna aham hai -- rang se.
 *
 * Do din ya us se kam = laal aur mota. Wajah: ek din ka waqt rakh kar kaam
 * karna mushkil hai; do din pehle nazar aa jaye to aadmi tayyari kar leta
 * hai. Teesra din peela -- khabardar, magar abhi aaram hai.
 */
const urgencyClass = (b, days) => {
  if (b.isOverdue || days <= 2) return 'font-bold text-red-600';
  if (days === 3) return 'font-bold text-amber-600';

  return 'font-semibold text-slate-500';
};

/**
 * Haath se likhe URL par bharosa nahi kiya ja sakta.
 *
 * "linkedin.com/in/sarah" me https:// nahi hai, to browser usay app ke andar
 * ka raasta samajh kar apni hi site par kholne ki koshish karta hai. Is liye
 * https:// khud laga dete hain.
 *
 * Aur "/in/sarah" jaisa sirf raasta ho (log aksar itna hi copy karte hain) to
 * usay LinkedIn ke domain par lagate hain -- warna "https://in/sarah" ban kar
 * kahin nahi kholta.
 */
const profileUrl = (value) => {
  const v = String(value || '').trim();
  if (!v) return '';

  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return 'https://www.linkedin.com' + v;

  return 'https://' + v;
};

/**
 * Jis buyer ka profile link save nahi, uske liye naam + club se LinkedIn par
 * dhoondne ka raasta. Import ki hui rows me link aksar khali hota hai.
 */
const searchUrl = (b) =>
  'https://www.linkedin.com/search/results/people/?keywords=' +
  encodeURIComponent([b.name, b.company].filter(Boolean).join(' '));

/**
 * Pipeline tracker — playbook ki "one row per person" wali table.
 *
 * Jis buyer ka agla qadam aaj ya guzar chuka hai wo alag nazar aata hai, kyunke
 * asal kaam wahi hai. Baqi sirf record hai.
 */
const LiPipeline = ({ playbook, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const [filters, setFilters] = useState({
    search: '',
    stage: 'All',
    buyerType: 'All',
    dueOnly: false,

    /* Last Contact ka arsa -- yyyy-mm-dd, khali matlab koi hadd nahi */
    from: '',
    to: '',
  });

  /**
   * Chune hue buyers.
   *
   * `selectAll` alag isliye hai: 399 rows 16 pages par hain, aur har page
   * par jaa kar tick karna bekaar hai. Poora page chunne par app poochh leti
   * hai ke saare matching rows chunne hain ya nahi.
   */
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  const fileRef = useRef(null);
  const restoreRef = useRef(null);
  const [busy, setBusy] = useState(false);

  /* Download menu — CSV aur poora backup dono isi ke neeche hain */
  const [downloadOpen, setDownloadOpen] = useState(false);

  const [marking, setMarking] = useState(false);

  /* Kis row ka quick action chal raha hai */
  const [acting, setActing] = useState('');

  const params = useCallback(
    () => ({
      page,
      limit: perPage,
      search: filters.search || undefined,
      stage: filters.stage !== 'All' ? filters.stage : undefined,
      buyerType: filters.buyerType !== 'All' ? filters.buyerType : undefined,
      dueOnly: filters.dueOnly ? 'true' : undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [page, perPage, filters]
  );

  const load = useCallback(() => {
    setLoading(true);

    linkedinApi
      .buyers(params())
      .then((res) => {
        setRows(res.data.data);
        setMeta({ totalRecords: res.data.totalRecords, totalPages: res.data.totalPages });
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the pipeline')))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(load, [load]);

  /* Filter badle to pehle page par wapas -- warna khali list milti hai */
  const clearSelection = () => {
    setSelected([]);
    setSelectAll(false);
  };

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
    clearSelection();   // filter badla to purana selection be-mani hai
  };

  const afterChange = () => {
    clearSelection();
    load();
    onChanged?.();
  };

  const toggleOne = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const togglePage = (on) => {
    setSelected(on ? rows.map((r) => r._id) : []);
    if (!on) setSelectAll(false);
  };

  /* Chune hue (ya saare matching) delete */
  const handleDelete = async () => {
    const count = selectAll ? meta.totalRecords : selected.length;

    const warning = selectAll
      ? 'Delete ALL ' + count + ' buyers matching the current filters?' +
        '\n\nYe wapas nahi aayenge.'
      : 'Delete ' + count + ' selected buyer' + (count === 1 ? '' : 's') + '?' +
        '\n\nYe wapas nahi aayenge.';

    if (!window.confirm(warning)) return;

    setDeleting(true);

    try {
      const payload = selectAll
        ? { all: true, ...params() }
        : { ids: selected };

      const res = await linkedinApi.bulkDeleteBuyers(payload);
      toast.success(res.data.message);

      setPage(1);
      afterChange();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  /**
   * "In logon ne connection accept kar li."
   *
   * Accept hone ki ginti manager ki report ka hissa hai, magar pehle usay
   * likhne ka sirf ek raasta tha: har buyer ka modal khol kar stage badalna.
   * Hafte me 25 dafa aisa karna kaam nahi, saza hai.
   */
  const handleAccepted = async () => {
    if (selected.length === 0) return;

    setMarking(true);

    try {
      const res = await linkedinApi.bulkLogActivity({
        ids: selected,
        type: 'accepted',
        stage: 'Connected',
        note: 'Connection accept hui',
      });

      toast.success(res.data.message);
      clearSelection();
      afterChange();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
    } finally {
      setMarking(false);
    }
  };

  /**
   * Table se seedha stage badalna -- Action column ka dropdown.
   *
   * Pehle yahan sirf ek button tha jo agla qadam dikhata tha. Masla ye tha ke
   * agar row kisi aur stage par hai to jo kaam chahiye wo nazar hi nahi aata
   * -- misal ke taur par "In Conversation" wali row par "Accept ho gaya" ka
   * koi raasta nahi tha. Dropdown me har stage mojood hai.
   *
   * PUT /buyers/:id hi kaafi hai: wo stage badalta hai, usi qadam ki activity
   * khud likh deta hai (STAGE_ACTIVITY se) aur ek hi din dobara ginne se
   * rokta hai. Yani "Accepted" ki ginti isi se barhti hai -- koi alag call
   * nahi chahiye.
   */
  const changeStage = async (buyer, stage) => {
    if (stage === buyer.stage) return;

    setActing(buyer._id);

    try {
      await linkedinApi.updateBuyer(buyer._id, { stage });
      toast.success(buyer.name + ' — ' + stage);
      afterChange();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
    } finally {
      setActing('');
    }
  };

  const handleExport = async () => {
    try {
      const res = await linkedinApi.exportBuyers(params());
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'linkedin-pipeline.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Download failed'));
    }
  };

  /**
   * Poora backup — Excel, saari sheets ke saath.
   *
   * CSV export sirf list deta hai. Ye alag hai: is me activity bhi aati hai,
   * aur hafte wali report ki ginti usi se banti hai. Dusri machine par kaam
   * le jana ho to YEHI use karein, CSV nahi.
   */
  const handleBackup = async () => {
    setBusy(true);

    try {
      const res = await linkedinApi.backup();
      const url = URL.createObjectURL(new Blob([res.data]));

      const a = document.createElement('a');
      a.href = url;
      a.download = 'xportyn-linkedin-backup-' + new Date().toISOString().slice(0, 10) + '.xlsx';
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Backup failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Restore kuch mitata nahi, magar phir bhi bata dena behtar hai
    if (
      !window.confirm(
        'Restore from "' + file.name + '"?\n\n' +
          'Jo buyers pehle se hain wo update ho jayenge aur unki activity mil jayegi. ' +
          'Kuch delete nahi hoga.'
      )
    ) {
      e.target.value = '';
      return;
    }

    setBusy(true);

    try {
      const res = await linkedinApi.restore(file);
      toast.success(res.data.message, { duration: 6000 });
      afterChange();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Restore failed'));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await linkedinApi.importBuyers(file);
      toast.success(res.data.message);
      afterChange();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Import failed'));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* ---------- Filters + actions ---------- */}
      <div className="card p-4">
        {/*
          Search ab poori chaurai nahi leta -- tareekh wale do khane aa gaye
          hain, aur paanchon ek hi line me aa jate hain.
        */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Name, organization, country..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Stage</label>
            <select className="input" value={filters.stage} onChange={(e) => setFilter('stage', e.target.value)}>
              <option value="All">All stages</option>
              {playbook.stages.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Buyer Type</label>
            <select className="input" value={filters.buyerType} onChange={(e) => setFilter('buyerType', e.target.value)}>
              <option value="All">All types</option>
              {playbook.buyerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Last Contact ka arsa -- "is hafte kis kis se baat hui" */}
          <div>
            <label className="label">Last contact from</label>
            <input
              type="date"
              className="input"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => setFilter('from', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Last contact to</label>
            <input
              type="date"
              className="input"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => setFilter('to', e.target.value)}
            />
          </div>
        </div>

        {(filters.from || filters.to) && (
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, from: '', to: '' }))}
            className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
          >
            Tareekh ka filter hatayein
          </button>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={filters.dueOnly}
              onChange={(e) => setFilter('dueOnly', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Sirf wo jin ka agla qadam due hai
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Sirf buyers ki saadi list (naam, organization, stage…). Poore backup ke liye Restore."
              className="btn-secondary py-1.5 text-xs"
            >
              <LuUpload className="h-4 w-4" />
              Import list
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />

            {/*
              Download ke do rukh hain aur farq ahem hai: CSV sirf list deta
              hai, Excel backup me activity bhi aati hai. Do alag buttons se
              ye farq nazar nahi aata tha, is liye dono ek menu me hint ke
              saath — jaise Contacts page par hai.
            */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDownloadOpen((open) => !open)}
                disabled={busy}
                className="btn-secondary py-1.5 text-xs"
              >
                <LuDownload className="h-4 w-4" />
                {busy ? 'Working...' : 'Download'}
                <LuChevronDown className="h-3.5 w-3.5" />
              </button>

              {downloadOpen && (
                <>
                  {/* Bahar click karne par menu band */}
                  <div className="fixed inset-0 z-40" onClick={() => setDownloadOpen(false)} />

                  <div className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setDownloadOpen(false);
                        handleExport();
                      }}
                      className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <LuFileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">Export CSV</span>
                        <span className="block text-xs text-slate-500">
                          Sirf pipeline ki list — dekhne ya kisi ko bhejne ke liye
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDownloadOpen(false);
                        handleBackup();
                      }}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <LuDatabaseBackup className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          Full backup (Excel)
                        </span>
                        <span className="block text-xs text-slate-500">
                          Activity, Ask Zain, reports — sab kuch. Dusri machine par kaam le jana
                          ho to yehi, CSV nahi.
                        </span>
                      </span>
                    </button>

                    <p className="bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                      CSV maujooda filter ke mutabiq — <strong>{meta.totalRecords}</strong> buyers
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => restoreRef.current?.click()}
              disabled={busy}
              title="Full backup (Excel) se sab kuch wapas — activity, Ask Zain, reports, daily"
              className="btn-secondary py-1.5 text-xs"
            >
              <LuHardDriveDownload className="h-4 w-4" />
              Restore backup
            </button>
            <input
              ref={restoreRef}
              type="file"
              accept=".xlsx"
              onChange={handleRestore}
              className="hidden"
            />

            <button type="button" onClick={() => setAdding(true)} className="btn-primary py-1.5 text-xs">
              <LuPlus className="h-4 w-4" />
              Add Buyer
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Chune hue rows ka bar ---------- */}
      {selected.length > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-brand-500 p-4">
          <div className="text-sm">
            <span className="font-bold text-slate-800">
              {selectAll ? meta.totalRecords : selected.length}
            </span>{' '}
            <span className="text-slate-600">chune hue</span>

            {/* Poora page chun liya aur aur bhi baqi hain -- sab chunne ka option */}
            {!selectAll && selected.length === rows.length && meta.totalRecords > rows.length && (
              <button
                type="button"
                onClick={() => setSelectAll(true)}
                className="ml-2 font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900"
              >
                Saare {meta.totalRecords} chunein
              </button>
            )}

            {selectAll && (
              <span className="ml-2 text-xs font-semibold text-amber-700">
                (maujooda filter ke saare rows)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={clearSelection} className="btn-secondary py-1.5 text-xs">
              Clear
            </button>

            {/*
              selectAll par band: "filter ke saare rows" ko accepted kar dena
              hafte ki ginti kharab kar deta hai. Jo asal me accept hue, sirf
              unke checkbox lagayein.
            */}
            <button
              type="button"
              onClick={handleAccepted}
              disabled={marking || selectAll}
              title={
                selectAll
                  ? 'Saare rows par ek saath accepted lagana theek nahi — jin ne accept kiya sirf unhein chunein'
                  : 'Chune hue buyers ko Connected karein aur accepted ginti me likhein'
              }
              className="btn-secondary py-1.5 text-xs"
            >
              <LuUserCheck className="h-4 w-4" />
              {marking ? 'Saving...' : 'Accept ho gaya (' + selected.length + ')'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger py-1.5 text-xs"
            >
              <LuTrash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete ' + (selectAll ? meta.totalRecords : selected.length)}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Table ---------- */}
      <div className="card">
        {loading ? (
          <Spinner label="Loading pipeline..." />
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <LuSearch className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-semibold text-slate-700">Koi buyer nahi mila</p>
            <p className="mt-1 text-sm text-slate-400">
              {filters.search || filters.stage !== 'All' || filters.dueOnly || filters.from || filters.to
                ? 'Filters badal kar dekhein'
                : 'Pehla buyer add karein — connection request bhejte waqt row banayein'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm [&_td]:border-b [&_td]:border-r [&_td]:border-slate-200/70 [&_td:last-child]:border-r-0">
                <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-200 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={rows.length > 0 && selected.length === rows.length}
                        onChange={(e) => togglePage(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-brand-600 focus:ring-brand-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Buyer</th>
                    <th className="px-4 py-3 font-semibold">Country</th>
                    <th className="px-4 py-3 font-semibold">LinkedIn</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Next Step</th>
                    <th className="px-4 py-3 font-semibold">Last Contact</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((b, i) => {
                    const days = b.nextStepDate ? daysFromToday(b.nextStepDate) : null;

                    return (
                      <tr
                        key={b._id}
                        onClick={() => setOpenId(b._id)}
                        className={`cursor-pointer transition ${styleForStage(b.stage).row}`}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={"Select " + b.name}
                            checked={selected.includes(b._id)}
                            onChange={() => toggleOne(b._id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-500">
                          {(meta.totalRecords ? (page - 1) * perPage : 0) + i + 1}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{b.name}</p>
                          {/* Country ka apna khaana hai, is liye yahan sirf club */}
                          <p className="text-xs text-slate-500">{b.company || '—'}</p>
                          {b.jobTitle && <p className="text-xs text-slate-400">{b.jobTitle}</p>}
                        </td>

                        <td className="px-4 py-3 text-slate-700">{b.country || '—'}</td>

                        {/*
                          Pehle ye link Type ke saath ek chhota icon tha, jo
                          nazar hi nahi aata tha. Ab apna column hai.

                          stopPropagation zaroori hai: row par click modal
                          kholta hai, aur hum sirf LinkedIn kholna chahte hain.
                        */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {b.linkedinUrl ? (
                            <a
                              href={profileUrl(b.linkedinUrl)}
                              target="_blank"
                              rel="noreferrer"
                              title={'Profile kholein — ' + b.name}
                              className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                            >
                              <LuLinkedin className="h-3.5 w-3.5" />
                              LinkedIn
                            </a>
                          ) : (
                            <a
                              href={searchUrl(b)}
                              target="_blank"
                              rel="noreferrer"
                              title="Profile ka link save nahi — naam aur club se LinkedIn par dhoondein"
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-brand-700 hover:underline"
                            >
                              <LuSearch className="h-3.5 w-3.5" />
                              Dhoondein
                            </a>
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {BUYER_TYPE_SHORT[b.buyerType] || b.buyerType}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styleForStage(b.stage).badge}`}>
                            {b.stage}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {/*
                            Do alag cheezein hain: kya karna hai (text) aur
                            kab (tareekh). Aksar sirf tareekh bhari hoti hai.
                            Pehle us soorat me tareekh ke upar khali "—" aata
                            tha, jo sirf uljhan paida karta tha -- lagta tha
                            ke kuch gum ho gaya. Ab "—" tab hi aata hai jab
                            dono khali hon.
                          */}
                          {b.nextStep ? (
                            <p className="text-slate-700">{b.nextStep}</p>
                          ) : (
                            !b.nextStepDate && <p className="text-slate-400">—</p>
                          )}

                          {b.nextStepDate && (
                            <p className={`text-xs ${urgencyClass(b, days)}`}>
                              {formatDate(b.nextStepDate)}
                              {days < 0
                                ? ` · ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} late`
                                : days === 0
                                  ? ' · Due today'
                                  : days <= 2
                                    ? ` · ${days} day${days === 1 ? '' : 's'} left`
                                    : ''}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {b.lastContactDate ? formatDate(b.lastContactDate) : '—'}
                        </td>

                        {/*
                          Stage ka dropdown. Default me wohi stage chuna hua
                          hota hai jahan buyer ab hai, aur agle qadam par
                          nishan laga hota hai.

                          stopPropagation zaroori hai -- warna dropdown kholte
                          hi row ka modal khul jata hai.
                        */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={b.stage}
                            onChange={(e) => changeStage(b, e.target.value)}
                            disabled={acting === b._id}
                            title={playbook.nextActions?.[b.stage]?.hint || 'Stage badlein — ginti khud likh jati hai'}
                            className="input w-auto py-1 text-xs disabled:opacity-50"
                          >
                            {playbook.stages.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage === playbook.nextActions?.[b.stage]?.stage
                                  ? stage + '  ← agla qadam'
                                  : stage}
                              </option>
                            ))}
                          </select>

                          {acting === b._id && (
                            <span className="ml-1.5 text-xs text-slate-400">Saving...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={meta.totalPages}
              totalRecords={meta.totalRecords}
              perPage={perPage}
              perPageOptions={[12, 25, 50, 100, 200]}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            />
          </>
        )}
      </div>

      {openId && (
        <LiBuyerModal
          buyerId={openId}
          playbook={playbook}
          onClose={() => setOpenId(null)}
          onSaved={afterChange}
          onDeleted={afterChange}
        />
      )}

      {adding && (
        <LiBuyerModal
          playbook={playbook}
          onClose={() => setAdding(false)}
          onSaved={afterChange}
        />
      )}
    </div>
  );
};

export default LiPipeline;
