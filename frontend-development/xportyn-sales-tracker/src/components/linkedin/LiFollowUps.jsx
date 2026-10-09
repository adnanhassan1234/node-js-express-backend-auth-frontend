import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuLinkedin, LuSearch, LuCircleCheck, LuRefreshCw } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { styleForStage } from '../../utils/linkedinStyles';
import { formatDate, daysFromToday } from '../../utils/date';

import Spinner from '../Spinner';
import LiBuyerModal from './LiBuyerModal';

/**
 * Aaj ka kaam — jin par agla qadam do din ke andar hai.
 *
 * Pipeline me poori list hoti hai (sab stages, saikron rows) aur usme se roz
 * ye chunna parta tha ke "aaj kis ko message karna hai". Ye tab sirf wohi
 * dikhata hai: jo guzar chuke, aaj, kal aur parson.
 *
 * Do din is liye ke table me bhi yehi hadd laal hoti hai -- do jagah do alag
 * hadd rakhna uljhan paida karta.
 */
const DUE_DAYS = 2;

/**
 * Din ke hisaab se hisse.
 *
 * Tarteeb ahem hai: guzar chuke sab se upar, kyunke unka waqt pehle hi nikal
 * chuka hai.
 */
const BUCKETS = [
  { key: 'late', title: 'Guzar chuke', tone: 'border-l-red-500 bg-red-50/60', badge: 'bg-red-200 text-red-800' },
  { key: 'today', title: 'Aaj', tone: 'border-l-red-500 bg-red-50/40', badge: 'bg-red-200 text-red-800' },
  { key: 'tomorrow', title: 'Kal', tone: 'border-l-amber-400 bg-amber-50/50', badge: 'bg-amber-200 text-amber-800' },
  { key: 'later', title: 'Parson', tone: 'border-l-amber-300 bg-amber-50/30', badge: 'bg-amber-100 text-amber-800' },
];

const bucketOf = (days) => {
  if (days < 0) return 'late';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return 'later';
};

/** "3 days late", "Due today", "2 days left" */
const whenLabel = (days) => {
  if (days < 0) return Math.abs(days) + (Math.abs(days) === 1 ? ' day late' : ' days late');
  if (days === 0) return 'Due today';
  return days + (days === 1 ? ' day left' : ' days left');
};

/** Haath se likha URL bhi chale (wohi usool jo Pipeline me hai) */
const profileUrl = (value) => {
  const v = String(value || '').trim();
  if (!v) return '';

  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return 'https://www.linkedin.com' + v;

  return 'https://' + v;
};

const LiFollowUps = ({ playbook, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);

    linkedinApi
      .buyers({ dueDays: DUE_DAYS, limit: 200, sortBy: 'nextStepDate', sortDir: 'asc' })
      .then((res) => setRows(res.data.data))
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load follow-ups')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const afterChange = () => {
    load();
    onChanged?.();
  };

  /* Wohi quick action jo Pipeline ki table me hai */
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

  if (loading) return <Spinner label="Loading follow-ups..." />;

  const grouped = BUCKETS.map((b) => ({
    ...b,
    items: rows.filter((r) => bucketOf(daysFromToday(r.nextStepDate)) === b.key),
  })).filter((b) => b.items.length > 0);

  return (
    <div className="space-y-4">
      {/* ---------- Upar ka hissa ---------- */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Aaj ka kaam
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {rows.length}
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Jin par agla qadam <strong>{DUE_DAYS} din</strong> ke andar hai — guzar chuke bhi
          </p>
        </div>

        <button type="button" onClick={load} className="btn-secondary py-1.5 text-xs">
          <LuRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <LuCircleCheck className="mx-auto h-9 w-9 text-green-500" />
          <p className="mt-2 font-semibold text-slate-700">Sab kaam ho chuka</p>
          <p className="mt-1 text-sm text-slate-400">
            Agle {DUE_DAYS} din me koi follow-up due nahi. Nayi requests bhejne ka waqt hai.
          </p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {group.title}
              </h4>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${group.badge}`}>
                {group.items.length}
              </span>
            </div>

            {group.items.map((b) => {
              const days = daysFromToday(b.nextStepDate);

              return (
                <div
                  key={b._id}
                  onClick={() => setOpenId(b._id)}
                  className={`card cursor-pointer border-l-4 p-4 transition hover:shadow-md ${group.tone}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">{b.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${styleForStage(b.stage).badge}`}
                        >
                          {b.stage}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {b.company || '—'}
                        {b.country ? ' · ' + b.country : ''}
                      </p>

                      {/*
                        Agla qadam kya hai -- ye aksar khali hota hai, is liye
                        us soorat me stage ka tay-shuda qadam dikha dete hain,
                        warna row dekh kar pata hi nahi chalta ke karna kya hai.
                      */}
                      <p className="mt-1.5 text-sm text-slate-700">
                        {b.nextStep || playbook.nextActions?.[b.stage]?.label || 'Agla qadam likha nahi'}
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-slate-600">
                        {formatDate(b.nextStepDate)}
                        <span className={days <= 0 ? ' text-red-600' : ' text-amber-700'}>
                          {' · ' + whenLabel(days)}
                        </span>
                      </p>
                    </div>

                    {/* Click row ko modal kholne se rokta hai */}
                    <div
                      className="flex shrink-0 flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                          href={
                            'https://www.linkedin.com/search/results/people/?keywords=' +
                            encodeURIComponent([b.name, b.company].filter(Boolean).join(' '))
                          }
                          target="_blank"
                          rel="noreferrer"
                          title="Profile ka link save nahi — naam se dhoondein"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-brand-700 hover:underline"
                        >
                          <LuSearch className="h-3.5 w-3.5" />
                          Dhoondein
                        </a>
                      )}

                      <select
                        value={b.stage}
                        onChange={(e) => changeStage(b, e.target.value)}
                        disabled={acting === b._id}
                        title="Kaam ho gaya? Stage badlein — nayi tareekh khud lag jayegi"
                        className="input w-auto py-1 text-xs disabled:opacity-50"
                      >
                        {playbook.stages.map((s) => (
                          <option key={s} value={s}>
                            {s === playbook.nextActions?.[b.stage]?.stage ? s + '  ← agla qadam' : s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      {openId && (
        <LiBuyerModal
          buyerId={openId}
          playbook={playbook}
          onClose={() => setOpenId(null)}
          onSaved={() => {
            setOpenId(null);
            afterChange();
          }}
          onDeleted={() => {
            setOpenId(null);
            afterChange();
          }}
        />
      )}
    </div>
  );
};

export default LiFollowUps;
