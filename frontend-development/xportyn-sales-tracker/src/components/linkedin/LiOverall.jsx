import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCopy, LuCheck, LuMail, LuMessageCircle, LuChevronRight } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { styleForStage } from '../../utils/linkedinStyles';
import { formatDate } from '../../utils/date';
import Spinner from '../Spinner';

/**
 * Shuru se ab tak ka hisaab.
 *
 * Shakl funnel ki hai, table ki nahi. Wajah: asal sawal "kitni requests gayin"
 * nahi hota -- asal sawal ye hota hai ke "jo gayin un me se kitni lagin, aur
 * un me se kitni baat tak pohanchin". Table me har number apni jagah akela
 * khara tha; funnel me har qadam apne PICHHLE qadam se jura hua dikhta hai,
 * aur rukawat foran nazar aa jati hai.
 *
 * Poora page ek screen me rakha gaya hai: bhejne wala matn band (details ke
 * andar) hai, kyunke wo sirf copy karne ke liye hai aur khula rehne se baqi
 * sab scroll me chala jata tha.
 *
 * Target ka muqabla yahan jaan boojh kar nahi hai: faislay ke liye apni hi
 * pichhli kaarkardagi dekhna zyada kaam ka hai.
 */

/** Funnel ke qadam -- har ek ki sharah apne pichhle qadam se nikalti hai */
const FUNNEL = [
  { key: 'requestSent', label: 'Requests sent', tone: 'text-slate-800' },
  { key: 'accepted', label: 'Accepted', rate: 'accepted', tone: 'text-sky-700' },
  { key: 'conversation', label: 'Conversations', rate: 'replied', tone: 'text-blue-700' },
  { key: 'mockupSent', label: 'Mock-ups sent', rate: 'mockup', tone: 'text-amber-700' },
  { key: 'sampleOrdered', label: 'Sample orders', rate: 'sample', tone: 'text-green-700' },
];

/** Jo funnel ka hissa nahi, magar ginti me hai */
const EXTRA = [
  { key: 'messageSent', label: 'Messages sent' },
  { key: 'mockupOffered', label: 'Mock-ups offered' },
  { key: 'bulkQuoteSent', label: 'Bulk quotes' },
];

/**
 * Funnel ka ek qadam, aur us se pehle sharah ka chip.
 *
 * Chip apne khane me hai aur qadam do khanon me -- is tarah 9 columns me
 * paanch qadam aur chaar chip theek baith jate hain. Chhoti screen par teer
 * chhup jata hai (wahan qadam ek doosre ke neeche aate hain, teer ka matlab
 * nahi rehta) aur sharah qadam ke andar aa jati hai.
 */
const Step = ({ step, value, perWeek, rate, showArrow }) => (
  <>
    {showArrow && (
      <div className="hidden items-center justify-center lg:flex">
        <div className="text-center">
          <LuChevronRight className="mx-auto h-4 w-4 text-slate-300" />
          {rate !== null && rate !== undefined && (
            <span className="text-[11px] font-bold text-slate-500">{rate}%</span>
          )}
        </div>
      </div>
    )}

    <div className="col-span-1 rounded-lg border border-slate-200 p-3 lg:col-span-2">
      <p className={`text-3xl font-bold leading-none ${value > 0 ? step.tone : 'text-slate-300'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-600">{step.label}</p>

      <p className="mt-0.5 text-[11px] text-slate-400">
        {perWeek}/week
        {rate !== null && rate !== undefined && (
          <span className="ml-1 font-bold text-slate-500 lg:hidden">· {rate}%</span>
        )}
      </p>
    </div>
  </>
);

const LiOverall = ({ playbook }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    linkedinApi
      .overallReport()
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the report')))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner label="Building report..." />;
  if (!data) return <p className="text-slate-500">No data</p>;

  const { counts, perWeek, rates, pipeline } = data;

  /* Manager ko bhejne ke liye */
  const text = [
    'XPORTYN LinkedIn — overall',
    'Since ' + formatDate(data.since) + '  (' + data.weeks + (data.weeks === 1 ? ' week' : ' weeks') + ')',
    '',
    'Connection requests sent: ' + counts.requestSent + '   (' + perWeek.requestSent + '/week)',
    'Accepted: ' + counts.accepted + (rates.accepted !== null ? '  (' + rates.accepted + '% of requests)' : ''),
    'Messages sent: ' + counts.messageSent,
    'Real conversations: ' + counts.conversation +
      (rates.replied !== null ? '  (' + rates.replied + '% of accepted)' : ''),
    'Mock-ups offered: ' + counts.mockupOffered + '   Mock-ups sent: ' + counts.mockupSent,
    'Sample orders ($200): ' + counts.sampleOrdered + '   Bulk quotes sent: ' + counts.bulkQuoteSent,
    '',
    'Pipeline: ' + pipeline.total + ' total — ' + pipeline.open + ' open, ' + pipeline.closed + ' closed',
    Object.entries(pipeline.byStage)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => s + ' ' + n)
      .join(' · '),
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

  const share = (how) =>
    window.open(
      how === 'wa'
        ? 'https://wa.me/?text=' + encodeURIComponent(text)
        : 'mailto:?subject=' + encodeURIComponent('XPORTYN LinkedIn — overall report') +
          '&body=' + encodeURIComponent(text),
      '_blank'
    );

  return (
    <div className="space-y-3">
      {/* ================= Arsa + bhejne ke buttons ================= */}
      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Since the start</h3>
          <p className="text-xs text-slate-500">
            {formatDate(data.since)} — {data.days} days ({data.weeks}{' '}
            {data.weeks === 1 ? 'week' : 'weeks'})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="btn-primary py-1.5 text-xs">
            {copied ? <LuCheck className="h-3.5 w-3.5" /> : <LuCopy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={() => share('wa')} className="btn-secondary py-1.5 text-xs">
            <LuMessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </button>
          <button type="button" onClick={() => share('mail')} className="btn-secondary py-1.5 text-xs">
            <LuMail className="h-3.5 w-3.5" />
            Email
          </button>
        </div>
      </div>

      {/* ================= Funnel ================= */}
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(14,minmax(0,1fr))]">
          {FUNNEL.map((step, i) => (
            <Step
              key={step.key}
              step={step}
              value={counts[step.key] || 0}
              perWeek={perWeek[step.key] ?? 0}
              rate={step.rate ? rates[step.rate] : null}
              showArrow={i > 0}
            />
          ))}
        </div>
      </div>

      {/* ================= Baqi ginti ================= */}
      <div className="card flex flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3">
        {EXTRA.map((e) => (
          <div key={e.key} className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-800">{counts[e.key] || 0}</span>
            <span className="text-xs text-slate-600">{e.label}</span>
            <span className="text-[11px] text-slate-400">({perWeek[e.key] ?? 0}/wk)</span>
          </div>
        ))}
      </div>

      {/* ================= Pipeline ================= */}
      <div className="card px-4 py-3">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">Pipeline right now</h3>
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{pipeline.total}</strong> total ·{' '}
            <strong className="text-brand-700">{pipeline.open}</strong> open ·{' '}
            <strong className="text-slate-500">{pipeline.closed}</strong> closed
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {playbook.stages
            .filter((s) => (pipeline.byStage[s] || 0) > 0)
            .map((s) => (
              <span
                key={s}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${styleForStage(s).badge}`}
              >
                {s}
                <span className="ml-1.5 font-bold">{pipeline.byStage[s]}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Matn band rehta hai -- wo sirf copy karne ke liye hai */}
      <details className="card px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-slate-800 hover:text-brand-700">
          Text to send
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-sans text-sm leading-relaxed text-slate-800">
          {text}
        </pre>
      </details>
    </div>
  );
};

export default LiOverall;
