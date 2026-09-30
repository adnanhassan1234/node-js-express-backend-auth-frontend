import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuTriangleAlert, LuFlame, LuCircleCheck } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { progressColor, styleForStage } from '../../utils/linkedinStyles';
import { formatDate } from '../../utils/date';
import Spinner from '../Spinner';
import LiWeekNav, { isCurrentWeek } from './LiWeekNav';

/**
 * LinkedIn ka Dashboard — hafte ke targets, pipeline ka haal, aur aaj ka kaam.
 *
 * Sab se ahem cheez upar hai: connection request counter. LinkedIn hafte mein
 * 100 se ziyada requests par account rok deta hai, is liye ye sirf ginti nahi
 * — ye ek hifazati nishan hai.
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

  return (
    <div className={`space-y-5 transition-opacity ${busy ? 'opacity-50' : ''}`}>
      {/* ---------- Kaun sa hafta ---------- */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <LiWeekNav start={stats.week.start} end={stats.week.end} onChange={onWeekChange} />

        {/*
          Guzra hafta dekhte waqt saaf batana zaroori hai ke kya us hafte ka
          hai aur kya aaj ka -- pipeline, mahine ka target aur mamool hamesha
          aaj ke hain, chahe koi bhi hafta khula ho.
        */}
        {!current && (
          <p className="text-xs font-medium text-amber-800">
            Guzra hafta — counter aur targets usi hafte ke hain. Pipeline, mahine ka target aur
            mamool hamesha aaj ka hai.
          </p>
        )}
      </div>

      {/* ---------- Connection request counter ---------- */}
      <div className={`card border p-5 ${reqTone.box}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Connection requests {current ? 'is hafte' : 'us hafte'}
            </p>
            <p className={`mt-1 text-3xl font-bold ${reqTone.text}`}>
              {requests.sent}
              <span className="ml-1 text-base font-medium text-slate-400">/ {requests.limit}</span>
            </p>
          </div>

          <div className="text-right">
            {requests.state === 'blocked' ? (
              <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                <LuTriangleAlert className="h-4 w-4" />
                Hadd poori — is hafte aur na bhejein
              </p>
            ) : requests.state === 'warn' ? (
              <p className="flex items-center gap-2 text-sm font-bold text-amber-700">
                <LuTriangleAlert className="h-4 w-4" />
                Sirf {requests.left} baqi — ehtiyat se
              </p>
            ) : (
              <p className="text-sm font-medium text-slate-500">{requests.left} aur bheji ja sakti hain</p>
            )}
            <p className="mt-0.5 text-xs text-slate-400">
              LinkedIn ki hadd 100/hafta — is se upar account ruk sakta hai
            </p>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${reqTone.bar}`}
            style={{ width: Math.min(100, (requests.sent / requests.limit) * 100) + '%' }}
          />
        </div>
      </div>

      {/* ---------- Hafte ke targets ---------- */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {current ? 'Is hafte ke targets' : 'Us hafte ke targets'}
          </h3>
          <p className="text-xs text-slate-500">
            {formatDate(stats.week.start)} – {formatDate(stats.week.end)}
          </p>
        </div>

        <div className="space-y-3.5">
          {Object.entries(targets).map(([key, t]) => {
            const value = weekCounts[key] || 0;
            const hit = value >= t.min;

            return (
              <div key={key}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-700">
                    {activityLabels[key]}
                    {hit && <LuCircleCheck className="ml-1.5 inline h-3.5 w-3.5 text-green-600" />}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    <strong className={hit ? 'text-green-700' : 'text-slate-800'}>{value}</strong>
                    {' / '}
                    {t.min === t.max ? t.min : t.min + '–' + t.max}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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

      {/* ---------- Pipeline + mahine ka target ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-slate-800">Pipeline</h3>

          <div className="flex flex-wrap gap-2">
            {playbook.stages.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onGoTab?.('pipeline')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition hover:opacity-80 ${
                  styleForStage(s).badge
                }`}
              >
                {s}
                <span className="ml-1.5 font-bold">{pipeline.byStage[s] || 0}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-4">
            {[
              ['Total', pipeline.total, 'text-slate-800'],
              ['Active', pipeline.active, 'text-brand-700'],
              ['Won', pipeline.won, 'text-green-700'],
              ['Lost', pipeline.lost, 'text-red-600'],
            ].map(([label, value, tone]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className={`text-2xl font-bold ${tone}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-1 text-sm font-bold text-slate-800">Is mahine ka target</h3>
          <p className="mb-3 text-xs text-slate-500">Month 3 goal</p>

          {[
            ['Sample orders', month.sampleOrders, month.goal.sampleOrders],
            ['Bulk quotes', month.bulkQuotes, month.goal.bulkOrders],
          ].map(([label, value, goal]) => (
            <div key={label} className="mb-3">
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-xs text-slate-500">
                  <strong className="text-slate-800">{value}</strong> / {goal}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${progressColor(value, goal)}`}
                  style={{ width: Math.min(100, (value / goal) * 100) + '%' }}
                />
              </div>
            </div>
          ))}

          {(stats.dueToday > 0 || stats.overdue > 0) && (
            <button
              type="button"
              onClick={() => onGoTab?.('pipeline')}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-left transition hover:bg-amber-100"
            >
              <p className="text-xs font-bold text-amber-800">Aaj ka kaam</p>
              <p className="text-xs text-amber-700">
                {stats.dueToday} due{stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''} — pipeline dekhein
              </p>
            </button>
          )}
        </div>
      </div>

      {/* ---------- Aaj ka mamool ---------- */}
      {day && (
        <div className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-800">Aaj ka mamool</h3>

            <div className="flex items-center gap-3">
              {day.streak > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                  <LuFlame className="h-3.5 w-3.5" />
                  {day.streak} din ka silsila
                </span>
              )}
              <span className="text-xs font-semibold text-slate-500">
                {done} / {playbook.dailyTasks.length} · {pct}%
              </span>
            </div>
          </div>

          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
              style={{ width: pct + '%' }}
            />
          </div>

          <button
            type="button"
            onClick={() => onGoTab?.('routine')}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            Poora mamool kholein →
          </button>
        </div>
      )}
    </div>
  );
};

export default LiDashboard;
