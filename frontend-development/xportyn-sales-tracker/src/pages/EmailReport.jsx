import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuCopy,
  LuCheck,
  LuMail,
  LuMessageCircle,
  LuChevronRight,
  LuTriangleAlert,
} from 'react-icons/lu';

import { statsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { styleForStatus } from '../utils/statusStyles';
import { formatDate } from '../utils/date';
import Spinner from '../components/Spinner';

/**
 * Email outreach ki report.
 *
 * LinkedIn wali report ke andaz me, magar bunyaad alag hai -- aur ye farq
 * samajhna zaroori hai:
 *
 *   LinkedIn  -> har kaam ka apna record (activity) hota hai, is liye "kul
 *                kitni requests gayin" jaisa sawal theek theek nikalta hai.
 *   Email     -> contact par sirf uska MAUJOODA status hota hai. Jo contact ab
 *                "No Reply" par hai wo Email Sent -> FU1 -> FU2 se guzra hoga,
 *                magar us safar ka koi nishan nahi bacha.
 *
 * Is liye yahan funnel "ab kitne kis haal me hain" dikhata hai, "kul kitne
 * guzre" nahi. Ye farq page par bhi likha hai -- warna number ghalat samjha
 * jata hai.
 */

/** Funnel ke qadam -- status ki tarteeb me */
const FUNNEL = [
  { key: 'Email Sent', label: 'Email sent', tone: 'text-sky-700' },
  { key: 'Follow-up 1', label: 'Follow-up 1', tone: 'text-blue-700' },
  { key: 'Follow-up 2', label: 'Follow-up 2', tone: 'text-amber-700' },
  { key: 'Replied', label: 'Replied', tone: 'text-green-700' },
  { key: 'Deal Closed', label: 'Deal closed', tone: 'text-emerald-700' },
];

const Step = ({ step, value, showArrow }) => (
  <>
    {showArrow && (
      <div className="hidden items-center justify-center lg:flex">
        <LuChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    )}

    <div className="col-span-1 rounded-lg border border-slate-200 p-3 lg:col-span-2">
      <p className={`text-3xl font-bold leading-none ${value > 0 ? step.tone : 'text-slate-300'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-600">{step.label}</p>
    </div>
  </>
);

const EmailReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    statsApi
      .outreachReport()
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the report')))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner size="lg" label="Building report..." />;
  if (!data) return <p className="text-slate-500">No data</p>;

  const { totals, byStatus, replied, replies, followUps, activity, rates } = data;

  const text = [
    'XPORTYN email outreach — report',
    data.since ? 'Since ' + formatDate(data.since) : '',
    '',
    'Contacts: ' + totals.all,
    'Emailed: ' + totals.contacted + (rates.contacted !== null ? '  (' + rates.contacted + '%)' : ''),
    'Not contacted yet: ' + totals.notContacted,
    '',
    'Email Sent: ' + (byStatus['Email Sent'] || 0) +
      '   Follow-up 1: ' + (byStatus['Follow-up 1'] || 0) +
      '   Follow-up 2: ' + (byStatus['Follow-up 2'] || 0),
    'Replied: ' + (byStatus.Replied || 0) + '   Deal Closed: ' + (byStatus['Deal Closed'] || 0),
    'No Reply: ' + (byStatus['No Reply'] || 0) +
      (rates.noReply !== null ? '  (' + rates.noReply + '% of emailed)' : ''),
    '',
    'Reply rate: ' + (rates.replied !== null ? rates.replied + '%' : '—'),
    'Follow-ups due today: ' + followUps.dueToday + '   Overdue: ' + followUps.overdue,
    'Emailed in the last 7 days: ' + activity.week + '   Last 30 days: ' + activity.month,
  ]
    .filter((l) => l !== '')
    .join('\n');

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
        : 'mailto:?subject=' + encodeURIComponent('XPORTYN email outreach — report') +
          '&body=' + encodeURIComponent(text),
      '_blank'
    );

  return (
    <div className="space-y-3">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Email Report</h2>
          <p className="text-sm text-slate-500">
            {data.since ? formatDate(data.since) + ' se ab tak' : 'Email outreach ka haal'}
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

      {/* ---------------- Kul ---------------- */}
      <div className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {[
          ['Contacts', totals.all, 'text-slate-800'],
          ['Emailed', totals.contacted, 'text-sky-700', rates.contacted],
          ['Not contacted', totals.notContacted, 'text-slate-400'],
          ['Replied', replied, 'text-green-700', rates.replied],
        ].map(([label, value, tone, pct]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`text-2xl font-bold leading-tight ${tone}`}>
              {value}
              {pct !== null && pct !== undefined && (
                <span className="ml-1.5 text-xs font-bold text-slate-400">{pct}%</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ---------------- Funnel ---------------- */}
      <div className="card p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">Where they are now</h3>
          <p className="text-xs text-slate-500">
            <strong className="text-red-600">{byStatus['No Reply'] || 0}</strong> closed as No Reply
            {rates.noReply !== null && <span className="text-slate-400"> · {rates.noReply}% of emailed</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(14,minmax(0,1fr))]">
          {FUNNEL.map((step, i) => (
            <Step key={step.key} step={step} value={byStatus[step.key] || 0} showArrow={i > 0} />
          ))}
        </div>

        {/*
          Ye warning page ka sab se ahem jumla hai. Bina iske koi ye samajh
          sakta hai ke "Follow-up 1: 34" ka matlab 34 follow-ups bheji gayin --
          jabke asal matlab hai ke 34 contacts IS WAQT us haal me hain.
        */}
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-800">
          <LuTriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Ye ginti <strong>&quot;is waqt kitne kis haal me hain&quot;</strong> hai —{' '}
            <strong>&quot;kul kitne bheje gaye&quot;</strong> nahi. Jo contact ab No Reply par hai wo
            Email Sent aur dono follow-ups se guzra tha, magar app sirf maujooda status rakhti hai.
          </span>
        </p>
      </div>

      {/* ---------------- Follow-ups + raabta ---------------- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-bold text-slate-800">Follow-ups</h3>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-600">Due today</span>
              <strong className={followUps.dueToday > 0 ? 'text-red-600' : 'text-slate-400'}>
                {followUps.dueToday}
              </strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-600">Overdue</span>
              <strong className={followUps.overdue > 0 ? 'text-red-600' : 'text-slate-400'}>
                {followUps.overdue}
              </strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-600">Next 7 days</span>
              <strong className="text-slate-700">{followUps.upcoming}</strong>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 text-sm font-bold text-slate-800">Emailed recently</h3>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-600">Last 7 days</span>
              <strong className="text-slate-800">{activity.week}</strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-600">Last 30 days</span>
              <strong className="text-slate-800">{activity.month}</strong>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Aakhri raabte ki tareekh se. Jis ko ek hafte me do email gayin wo ek hi dafa ginta hai,
            is liye ye kam se kam ki ginti hai.
          </p>
        </div>
      </div>

      {/* ---------------- Inbox ---------------- */}
      <div className="card p-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">Inbox</h3>
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{replies.human}</strong> real ·{' '}
            <strong className="text-slate-500">{replies.auto}</strong> auto-reply
          </p>
        </div>

        {/*
          Yahan do number aksar alag hote hain aur wajah batana zaroori hai --
          warna lagta hai ke kisi ek jagah ghalti hai.
        */}
        {replies.contacts !== replied && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            Status me <strong>{replied}</strong> contacts &quot;Replied&quot; hain magar inbox se{' '}
            <strong>{replies.contacts}</strong> ka jawab pakra gaya. Reply detection har jawab nahi
            pakarti (spam folder, filters) — upar wali reply rate <strong>status</strong> par mabni
            hai, jo zyada bharosay laiq hai.
          </p>
        )}
      </div>

      {/* ---------------- Saare statuses ---------------- */}
      <div className="card p-4">
        <h3 className="mb-2 text-sm font-bold text-slate-800">All statuses</h3>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(byStatus)
            .filter(([, n]) => n > 0)
            .map(([s, n]) => (
              <span
                key={s}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${styleForStatus(s).badge}`}
              >
                {s}
                <span className="ml-1.5 font-bold">{n}</span>
              </span>
            ))}
        </div>
      </div>

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

export default EmailReport;
