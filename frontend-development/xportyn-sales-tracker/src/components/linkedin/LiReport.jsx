import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuCopy,
  LuCheck,
  LuSave,
  LuPrinter,
  LuMessageCircle,
  LuMail,
  LuTrash2,
} from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/date';
import Spinner from '../Spinner';
import LiWeekNav, { isCurrentWeek, weekKey } from './LiWeekNav';

/**
 * Hafte ki report — Saturday ko Zain ko bhejni hoti hai.
 *
 * Ginti khud bharti hai us activity se jo hafte bhar record hui. Sirf teen
 * cheezein haath se likhni hoti hain: sab se achhi baat-cheet, Zain ke liye
 * sawal (wo bhi khud aa jate hain), aur agle hafte ka market.
 */
const LiReport = ({ playbook, week = '', onWeekChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [best, setBest] = useState('');
  const [market, setMarket] = useState('');

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  /* Is hafte ki report pehle save ho chuki hai? */
  const [saved, setSaved] = useState(null);
  const [removing, setRemoving] = useState('');

  const load = useCallback(() => {
    Promise.all([linkedinApi.reportPreview(week ? { week } : {}), linkedinApi.reports()])
      .then(([p, h]) => {
        const preview = p.data.data;
        const rows = h.data.data;

        setData(preview);
        setHistory(rows);

        /**
         * Agar is hafte ki report pehle save ho chuki hai to haath se likhe
         * hisse wapas bhar dete hain.
         *
         * Warna ek nuqsan hota tha: Saturday ko "best conversation" likh kar
         * Save kiya, Sunday ko page khola aur phir Save dabaya -- to wo khaali
         * ho kar mit jata tha.
         */
        const already = rows.find(
          (r) => new Date(r.weekStart).getTime() === new Date(preview.weekStart).getTime()
        );

        setSaved(already || null);
        setBest(already?.bestConversation || '');
        setMarket(already?.nextMarket || '');
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not build the report')))
      .finally(() => setLoading(false));
  }, [week]);

  useEffect(load, [load]);

  if (loading) return <Spinner label="Building report..." />;
  if (!data) return <p className="text-slate-500">No data</p>;

  /* Report ka text -- haath se likhi cheezein milane ke baad */
  const text = [
    'Week of ' + formatDate(data.weekStart) + ' — LinkedIn sales report',
    '',
    'Connection requests sent: ' + data.counts.requestSent + '   Accepted: ' + data.counts.accepted,
    'Real conversations: ' + data.counts.conversation,
    'Mock-ups offered: ' + data.counts.mockupOffered + '   Mock-ups sent: ' + data.counts.mockupSent,
    'Sample orders ($200): ' + data.counts.sampleOrdered +
      '   Bulk quotes sent: ' + data.counts.bulkQuoteSent,
    '',
    'Best conversation this week: ' + (best || '—'),
    'Needs Zain: ' + (data.needsZain.length ? data.needsZain.join('; ') : '—'),
    "Next week's market: " + (market || '—'),
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Report copied');
    } catch {
      toast.error('Could not copy - please select the text manually');
    }
  };

  const save = async () => {
    setSaving(true);

    try {
      await linkedinApi.saveReport({
        week: week || undefined,
        bestConversation: best,
        needsZain: data.needsZain,
        nextMarket: market,
        text,
      });

      toast.success('Report saved');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save ki hui report mitana.
   *
   * Ye khaas khatarnak nahi: ginti activity se banti hai, report sirf uska
   * likha hua roop hai. Usi hafte par ja kar Save dabane se wapas ban jati
   * hai -- sirf haath se likhi do lainein dobara likhni parengi.
   */
  const remove = async (r) => {
    const when = formatDate(r.weekStart);

    const ok = window.confirm(
      'Week of ' + when + ' ki report delete karein?\n\n' +
        'Activity ko kuch nahi hota. Usi hafte par ja kar Save dabane se report ' +
        'dobara ban jayegi.'
    );
    if (!ok) return;

    setRemoving(r._id);

    try {
      await linkedinApi.deleteReport(r._id);
      toast.success('Report deleted');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete'));
    } finally {
      setRemoving('');
    }
  };

  const whatsapp = () => window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');

  const email = () =>
    window.open(
      'mailto:?subject=' +
        encodeURIComponent('LinkedIn sales report — week of ' + formatDate(data.weekStart)) +
        '&body=' + encodeURIComponent(text),
      '_blank'
    );

  const current = isCurrentWeek(data.weekStart);

  return (
    <div className="space-y-4">
      {/* ---------- Kaun sa hafta ---------- */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <LiWeekNav start={data.weekStart} end={data.weekEnd} onChange={onWeekChange} />

        {saved ? (
          <p className="text-xs font-medium text-green-700">
            Save ho chuki hai — dobara Save karne se yehi report update hogi, nayi nahi banegi.
          </p>
        ) : (
          <p className="text-xs font-medium text-amber-800">
            Abhi save nahi hui — Save dabayein, warna hafta guzarne par ginti sirf yahin
            arrow se milegi.
          </p>
        )}
      </div>

      {/* ---------- Ginti ---------- */}
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">
            {current ? 'Is hafte ki ginti' : 'Us hafte ki ginti'}
          </h3>
          <p className="text-xs text-slate-500">
            {formatDate(data.weekStart)} – {formatDate(data.weekEnd)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(playbook.activityLabels).map(([key, label]) => {
            const value = data.counts[key] || 0;
            const target = playbook.weeklyTargets[key];
            const hit = target && value >= target.min;

            return (
              <div key={key} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className={`text-2xl font-bold ${hit ? 'text-green-700' : 'text-slate-800'}`}>{value}</p>
                {target && (
                  <p className="text-[11px] text-slate-400">
                    target {target.min === target.max ? target.min : target.min + '–' + target.max}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Haath se bharne wali cheezein ---------- */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Ye khud likhni hain</h3>

        <div className="space-y-3">
          <div>
            <label className="label">Best conversation this week</label>
            <input
              className="input"
              placeholder="Club, mulk, aur unhein kya chahiye"
              value={best}
              onChange={(e) => setBest(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Next week&apos;s market</label>
            <input
              className="input sm:w-72"
              placeholder="UK, USA, UAE…"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Needs Zain ({data.needsZain.length})</label>

            {data.needsZain.length === 0 ? (
              <p className="text-xs text-slate-400">
                Koi sawal jawab ke intezar me nahi — Ask Zain wali list khali hai
              </p>
            ) : (
              <ul className="space-y-1">
                {data.needsZain.map((q, i) => (
                  <li key={i} className="rounded bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                    {q}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-1 text-xs text-slate-500">
              Ye khud aate hain Ask Zain se — jo abhi Pending hain.
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Report ---------- */}
      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">Report</h3>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn-primary py-1.5 text-xs">
              {copied ? <LuCheck className="h-3.5 w-3.5" /> : <LuCopy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button type="button" onClick={whatsapp} className="btn-secondary py-1.5 text-xs">
              <LuMessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </button>

            <button type="button" onClick={email} className="btn-secondary py-1.5 text-xs">
              <LuMail className="h-3.5 w-3.5" />
              Email
            </button>

            <button type="button" onClick={() => window.print()} className="btn-secondary py-1.5 text-xs">
              <LuPrinter className="h-3.5 w-3.5" />
              Print
            </button>

            <button type="button" onClick={save} disabled={saving} className="btn-secondary py-1.5 text-xs">
              <LuSave className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800">
          {text}
        </pre>
      </div>

      {/* ---------- Purani reports ---------- */}
      {history.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-800">Purani reports ({history.length})</h3>

          <ul className="divide-y divide-slate-200">
            {history.map((r) => (
              <li key={r._id} className="py-2.5">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-brand-700">
                    Week of {formatDate(r.weekStart)}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {(r.counts?.requestSent ?? 0)} requests · {(r.counts?.sampleOrdered ?? 0)} samples
                    </span>
                  </summary>

                  <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-3 font-sans text-xs text-slate-700">
                    {r.text}
                  </pre>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    {/* Us hafte ka poora dashboard kholne ke liye */}
                    <button
                      type="button"
                      onClick={() => onWeekChange?.(weekKey(new Date(r.weekStart)))}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Ye hafta kholein →
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(r)}
                      disabled={removing === r._id}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                      {removing === r._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LiReport;
