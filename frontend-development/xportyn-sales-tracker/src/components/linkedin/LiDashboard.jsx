import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuTriangleAlert, LuFlame, LuCircleCheck, LuArrowRight } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { progressColor, styleForStage } from '../../utils/linkedinStyles';
import Spinner from '../Spinner';
import LiWeekNav, { isCurrentWeek } from './LiWeekNav';

/**
 * LinkedIn ka Dashboard — hafte ke targets, pipeline ka haal, aur aaj ka kaam.
 *
 * Sab se ahem cheez upar hai: connection request counter. LinkedIn hafte mein
 * 100 se ziyada requests par account rok deta hai, is liye ye sirf ginti nahi
 * — ye ek hifazati nishan hai.
 *
 * Layout ka usool: poora haal EK nazar me aa jaye, scroll kiye baghair.
 * Pehle har cheez apne poore chaure card me thi aur 6 target bars ek ke neeche
 * ek lagti thin -- do screen bhar jati thin. Ab targets jaali (grid) me hain
 * aur chhoti cheezein saath mila di gayi hain.
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

  const { weekCounts, targets, requests, month, pipeline } = stats;
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
              title="Counter aur targets usi hafte ke hain. Pipeline, mahine ka target aur mamool hamesha aaj ka hai."
            >
              Guzra hafta
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Connection requests {current ? 'is hafte' : 'us hafte'}
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
                  title="Dono ginti isi hafte ki hain. Accept aksar kuch din baad hota hai, is liye sharah taqreeban hai."
                >
                  {weekCounts.accepted || 0} accept
                  {rate !== null && <span className="font-medium text-slate-400"> · ~{rate}%</span>}
                </span>
              </p>
            </div>

            {requests.state === 'blocked' ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-red-700">
                <LuTriangleAlert className="h-4 w-4" />
                Hadd poori — is hafte aur na bhejein
              </p>
            ) : requests.state === 'warn' ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                <LuTriangleAlert className="h-4 w-4" />
                Sirf {requests.left} baqi — ehtiyat se
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500" title="LinkedIn ki hadd 100/hafta — is se upar account ruk sakta hai">
                {requests.left} aur bheji ja sakti hain
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

      {/* ================= Targets — jaali me, ek ke neeche ek nahi ================= */}
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          {current ? 'Is hafte ke targets' : 'Us hafte ke targets'}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(targets).map(([key, t]) => {
            const value = weekCounts[key] || 0;
            const hit = value >= t.min;

            return (
              <div
                key={key}
                className={`rounded-lg border p-3 ${hit ? 'border-green-200 bg-green-50/50' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium leading-tight text-slate-600">
                    {activityLabels[key]}
                  </p>
                  {hit && <LuCircleCheck className="h-4 w-4 shrink-0 text-green-600" />}
                </div>

                <p className="mt-1 leading-none">
                  <span className={`text-xl font-bold ${hit ? 'text-green-700' : 'text-slate-800'}`}>
                    {value}
                  </span>
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    / {t.min === t.max ? t.min : t.min + '–' + t.max}
                  </span>
                </p>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor(value, t.min)}`}
                    style={{ width: Math.min(100, (value / t.min) * 100) + '%' }}
                  />
                </div>
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
              Poora pipeline
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

        {/* Daayen taraf do chhoti cheezein -- pehle ye alag poore card the */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-800">
              Is mahine ka target
              <span className="ml-1.5 text-xs font-normal text-slate-400">Month 3</span>
            </h3>

            {[
              ['Sample orders', month.sampleOrders, month.goal.sampleOrders],
              ['Bulk quotes', month.bulkQuotes, month.goal.bulkOrders],
            ].map(([label, value, goal]) => (
              <div key={label} className="mb-2 last:mb-0">
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="text-slate-500">
                    <strong className="text-slate-800">{value}</strong> / {goal}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className={`h-full rounded-full ${progressColor(value, goal)}`}
                    style={{ width: Math.min(100, (value / goal) * 100) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Aaj ka kaam -- sirf tab jab waqai kuch due ho */}
          {(stats.dueToday > 0 || stats.overdue > 0) && (
            <button
              type="button"
              onClick={() => onGoTab?.('pipeline')}
              className="card w-full border-l-4 border-l-amber-400 bg-amber-50/60 p-3 text-left transition hover:bg-amber-100/60"
            >
              <p className="text-xs font-bold text-amber-900">Aaj ka kaam</p>
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
                <h3 className="text-sm font-bold text-slate-800">Aaj ka mamool</h3>

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
