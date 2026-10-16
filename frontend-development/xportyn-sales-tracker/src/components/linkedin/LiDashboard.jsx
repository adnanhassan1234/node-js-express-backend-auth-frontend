import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuTriangleAlert, LuFlame, LuArrowRight } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { styleForStage } from '../../utils/linkedinStyles';
import Spinner from '../Spinner';
import LiWeekNav, { isCurrentWeek } from './LiWeekNav';

/**
 * LinkedIn ka Dashboard — hafte ka kaam, pipeline ka haal, aur aaj ka mamool.
 *
 * Sab se ahem cheez upar hai: connection request counter. LinkedIn hafte mein
 * 100 se ziyada requests par account rok deta hai, is liye ye sirf ginti nahi
 * — ye ek hifazati nishan hai.
 *
 * Layout ka usool: poora haal EK nazar me aa jaye, scroll kiye baghair.
 * Pehle har cheez apne poore chaure card me thi aur 6 bars ek ke neeche ek
 * lagti thin -- do screen bhar jati thin. Ab ginti jaali (grid) me hai aur
 * chhoti cheezein saath mila di gayi hain.
 */
const LiDashboard = ({ playbook, onGoTab, week = '', onWeekChange }) => {
  const [stats, setStats] = useState(null);
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Hafta badalne par poora page spinner me nahi jata -- purani ginti halki
   * ho kar wahin rehti hai. Har arrow par screen khali ho jana bura lagta hai.
   */
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setBusy(true);

    Promise.all([linkedinApi.stats(week ? { week } : {}), linkedinApi.day()])
      .then(([s, d]) => {
        setStats(s.data.data);
        setDay(d.data.data);
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the dashboard')))
      .finally(() => {
        setLoading(false);
        setBusy(false);
      });
  }, [week]);

  useEffect(load, [load]);

  if (loading) return <Spinner label="Loading..." />;
  if (!stats) return <p className="text-slate-500">No data</p>;

  const { weekCounts, requests, pipeline } = stats;
  const { activityLabels } = playbook;

  const done = day ? playbook.dailyTasks.filter((t) => day.tasks[t.key]).length : 0;
  const pct = Math.round((done / playbook.dailyTasks.length) * 100);

  /* Connection counter ka rang aur paighaam */
  const reqTone =
    requests.state === 'blocked'
      ? { box: 'border-red-300 bg-red-50', text: 'text-red-700', bar: 'bg-red-500' }
      : requests.state === 'warn'
        ? { box: 'border-amber-300 bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' }
        : { box: 'border-slate-200 bg-white', text: 'text-slate-700', bar: 'bg-brand-500' };

  const current = isCurrentWeek(stats.week.start);
  const rate = requests.sent > 0 ? Math.round(((weekCounts.accepted || 0) / requests.sent) * 100) : null;

  return (
    <div className={`space-y-4 transition-opacity ${busy ? 'opacity-50' : ''}`}>
      {/* ================= Hero: hafta + request counter ================= */}
      <div className={`card border ${reqTone.box}`}>
        {/* Hafte ka nav isi card ke andar hai -- pehle ye apna poora card lete tha */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 px-4 py-2">
          <LiWeekNav start={stats.week.start} end={stats.week.end} onChange={onWeekChange} />

          {!current && (
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800"
              title="The counter and counts are for that week. Pipeline and routine are always today's."
            >
              Past week
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Connection requests {current ? 'this week' : 'that week'}
              </p>

              <p className={`mt-0.5 text-3xl font-bold leading-none ${reqTone.text}`}>
                {requests.sent}
                <span className="ml-1 text-base font-medium text-slate-400">/ {requests.limit}</span>

                {/*
                  Accept hone ki ginti yahin, kyunke asal sawal yehi hota hai:
                  "kitni bhejin aur kitni lagin". Sharah taqreeban hai -- aaj
                  accept hone wali requests aksar pichhle hafte bheji gayi thin.
                */}
                <span
                  className="ml-3 text-sm font-semibold text-slate-600"
                  title="Both counts are for this week. Accepts often come days later, so the rate is approximate."
                >
                  {weekCounts.accepted || 0} accepted
                  {rate !== null && <span className="font-medium text-slate-400"> · ~{rate}%</span>}
                </span>
              </p>
            </div>

            {requests.state === 'blocked' ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-red-700">
                <LuTriangleAlert className="h-4 w-4" />
                Limit reached — send no more this week
              </p>
            ) : requests.state === 'warn' ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                <LuTriangleAlert className="h-4 w-4" />
                Only {requests.left} left — go carefully
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500" title="LinkedIn's limit is 100/week — above that your account can be restricted">
                {requests.left} more can be sent
              </p>
            )}
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${reqTone.bar}`}
              style={{ width: Math.min(100, (requests.sent / requests.limit) * 100) + '%' }}
            />
          </div>
        </div>
      </div>

      {/* ================= Hafte ka kaam ================= */}
      {/*
        Yahan pehle targets ka muqabla tha -- har ginti ke saath "/ 80" aur ek
        bar. Hata diya: ab sirf ye dikhta hai ke kitna kaam hua.
      */}
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          {current ? "This week's work" : "That week's work"}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.keys(activityLabels).map((key) => {
            const value = weekCounts[key] || 0;

            return (
              <div
                key={key}
                className={`rounded-lg border p-3 ${value > 0 ? 'border-slate-200' : 'border-slate-100 bg-slate-50/60'}`}
              >
                <p className="text-xs font-medium leading-tight text-slate-600">
                  {activityLabels[key]}
                </p>
                <p className={`mt-1 text-2xl font-bold leading-none ${value > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= Pipeline + (mahina & mamool) ================= */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Pipeline</h3>
            <button
              type="button"
              onClick={() => onGoTab?.('pipeline')}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              Full pipeline
              <LuArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {playbook.stages.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onGoTab?.('pipeline')}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80 ${
                  styleForStage(s).badge
                }`}
              >
                {s}
                <span className="ml-1.5 font-bold">{pipeline.byStage[s] || 0}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-200 pt-3">
            {[
              ['Total', pipeline.total, 'text-slate-800'],
              ['Active', pipeline.active, 'text-brand-700'],
              ['Won', pipeline.won, 'text-green-700'],
              ['Lost', pipeline.lost, 'text-red-600'],
            ].map(([label, value, tone]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className={`text-xl font-bold leading-tight ${tone}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daayen taraf chhoti cheezein */}
        <div className="space-y-4">
          {/*
            "Is mahine ka target" ka card yahan se hata diya gaya -- us me sirf
            goal ka muqabla tha, aur mahine ki ginti ab Weekly Report ke
            "Shuru se ab tak" wale hisse me mojood hai.
          */}

          {/* Aaj ka kaam -- sirf tab jab waqai kuch due ho */}
          {(stats.dueToday > 0 || stats.overdue > 0) && (
            <button
              type="button"
              onClick={() => onGoTab?.('pipeline')}
              className="card w-full border-l-4 border-l-amber-400 bg-amber-50/60 p-3 text-left transition hover:bg-amber-100/60"
            >
              <p className="text-xs font-bold text-amber-900">Due today</p>
              <p className="text-xs text-amber-800">
                {stats.dueToday} due{stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''} — pipeline dekhein
              </p>
            </button>
          )}

          {day && (
            <button
              type="button"
              onClick={() => onGoTab?.('routine')}
              className="card w-full p-4 text-left transition hover:border-brand-300"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800">Today's routine</h3>

                <div className="flex items-center gap-2">
                  {day.streak > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                      <LuFlame className="h-3 w-3" />
                      {day.streak}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-500">
                    {done}/{playbook.dailyTasks.length}
                  </span>
                </div>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                  style={{ width: pct + '%' }}
                />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiDashboard;
