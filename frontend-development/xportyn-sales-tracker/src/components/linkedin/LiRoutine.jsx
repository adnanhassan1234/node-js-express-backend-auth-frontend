import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuFlame, LuClock } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import Spinner from '../Spinner';

/**
 * Rozana ka mamool — playbook ke paanch kaam, roz ke.
 *
 * Har din ki apni row hai, is liye checkboxes agle din khud khali mil jate
 * hain — kuch reset karne ki zaroorat nahi. Streak batata hai kitne din
 * lagatar poore hue.
 */

/** Pakistan ka waqt — kaam 2 PM PKT se shuru hota hai */
const pktNow = () =>
  new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
  });

const LiRoutine = ({ playbook, onChanged }) => {
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(pktNow());

  const load = useCallback(() => {
    linkedinApi
      .day()
      .then((res) => setDay(res.data.data))
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the routine')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /* Ghari chalti rahe */
  useEffect(() => {
    const t = setInterval(() => setClock(pktNow()), 30000);
    return () => clearInterval(t);
  }, []);

  const toggle = async (key, done) => {
    // Pehle screen par dikha do, phir server ko batao -- warna click sust lagta hai
    setDay((d) => ({ ...d, tasks: { ...d.tasks, [key]: done } }));

    try {
      const res = await linkedinApi.updateDay({ taskKey: key, done });
      setDay((d) => ({ ...d, ...res.data.data }));

      if (res.data.data.allDone) toast.success('Aaj ka mamool poora! 🎯');
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
      load(); // server se asal haal wapas le lo
    }
  };

  const saveMarket = async (market) => {
    setDay((d) => ({ ...d, market }));

    try {
      await linkedinApi.updateDay({ market });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
    }
  };

  if (loading) return <Spinner label="Loading..." />;
  if (!day) return <p className="text-slate-500">No data</p>;

  const total = playbook.dailyTasks.length;
  const done = playbook.dailyTasks.filter((t) => day.tasks[t.key]).length;
  const pct = Math.round((done / total) * 100);
  const minutes = playbook.dailyTasks.reduce((s, t) => s + t.minutes, 0);

  return (
    <div className="space-y-4">
      {/* ---------- Upar ka khulasa ---------- */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Aaj ka mamool</h3>
            <p className="text-xs text-slate-500">
              Monday–Saturday · {minutes} minute · 2:00 PM PKT se shuru
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <LuClock className="h-3.5 w-3.5" />
              {clock} PKT
            </span>

            {day.streak > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                <LuFlame className="h-3.5 w-3.5" />
                {day.streak} din
              </span>
            )}

            <span className="text-sm font-bold text-slate-700">{done}/{total}</span>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
            style={{ width: pct + '%' }}
          />
        </div>
      </div>

      {/* ---------- Roz ke kaam ---------- */}
      <div className="card divide-y divide-slate-200">
        {playbook.dailyTasks.map((t) => {
          const checked = Boolean(day.tasks[t.key]);

          return (
            <label
              key={t.key}
              className={`flex cursor-pointer items-start gap-3 p-4 transition hover:bg-slate-50 ${
                checked ? 'bg-green-50/50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => toggle(t.key, e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {t.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t.minutes} min · {t.amount}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* ---------- Hafte ke kaam ---------- */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Hafte ke kaam</h3>

        <ul className="space-y-2">
          {playbook.weeklyTasks.map((w) => (
            <li key={w.day} className="flex gap-3 text-sm">
              <span className="w-24 shrink-0 font-bold text-brand-700">{w.day}</span>
              <span className="text-slate-700">{w.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <label className="label">Is hafte ka market (Monday wala kaam)</label>
          <input
            className="input sm:w-72"
            placeholder="UK, USA, UAE…"
            value={day.market || ''}
            onChange={(e) => setDay((d) => ({ ...d, market: e.target.value }))}
            onBlur={(e) => saveMarket(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Wohi mulk chunein jo email campaign me is hafte chal raha hai — dono ek saath lagein.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiRoutine;
