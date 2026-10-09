import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  LuLayoutDashboard,
  LuUsers,
  LuCalendarClock,
  LuSend,
  LuMessageCircle,
  LuListChecks,
  LuSearch,
  LuFileText,
  LuCircleHelp,
  LuShieldCheck,
} from 'react-icons/lu';

import { linkedinApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';

import LiDashboard from '../components/linkedin/LiDashboard';
import LiPipeline from '../components/linkedin/LiPipeline';
import LiFollowUps from '../components/linkedin/LiFollowUps';
import LiOutreach from '../components/linkedin/LiOutreach';
import LiReplyGuide from '../components/linkedin/LiReplyGuide';
import LiRoutine from '../components/linkedin/LiRoutine';
import LiSearchHelper from '../components/linkedin/LiSearchHelper';
import LiReport from '../components/linkedin/LiReport';
import LiAskZain from '../components/linkedin/LiAskZain';
import LiRules from '../components/linkedin/LiRules';

/**
 * LinkedIn Dashboard — manager ki playbook ka poora module.
 *
 * Sab kuch ek page ke andar tabs me hai, alag sidebar items me nahi. Wajah:
 * sidebar pehle se 5 items rakhta hai, aur ye saare screens ek hi kaam ke
 * hisse hain -- inhe saath rakhna hi theek lagta hai.
 *
 * Tab ka naam URL me jata hai (?tab=pipeline), to link share bhi ho sakta hai
 * aur refresh par wahi tab khulta hai. Hafta bhi wahin rehta hai (?week=...)
 * -- Dashboard aur Weekly Report dono usi hafte par khulte hain, aur tab badal
 * kar wapas aane par hafta nahi badalta.
 */

const TABS = [
  { key: 'dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
  { key: 'pipeline', label: 'Pipeline', Icon: LuUsers },
  { key: 'followups', label: 'Follow-ups', Icon: LuCalendarClock },
  { key: 'outreach', label: 'Outreach', Icon: LuSend },
  { key: 'replies', label: 'Reply Guide', Icon: LuMessageCircle },
  { key: 'routine', label: 'Daily Routine', Icon: LuListChecks },
  { key: 'search', label: 'Buyer Finder', Icon: LuSearch },
  { key: 'report', label: 'Weekly Report', Icon: LuFileText },
  { key: 'askzain', label: 'Ask Zain', Icon: LuCircleHelp },
  { key: 'rules', label: 'Rules & Profile', Icon: LuShieldCheck },
];

const LinkedIn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  /* Khali matlab maujooda hafta -- URL saaf rehta hai */
  const week = searchParams.get('week') || '';

  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Playbook ek hi dafa aati hai aur har tab ko props me di jati hai -- har tab
   * apni alag call na kare, warna 9 tabs par 9 requests jayengi.
   */
  useEffect(() => {
    let cancelled = false;

    linkedinApi
      .playbook()
      .then((res) => { if (!cancelled) setPlaybook(res.data.data); })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the playbook')))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  /* Dashboard aur Ask Zain ka badge -- pending sawal aur due buyers */
  const [badges, setBadges] = useState({ pendingZain: 0, dueToday: 0, overdue: 0, dueSoon: 0 });

  const refreshBadges = useCallback(() => {
    linkedinApi
      .stats()
      .then((res) => {
        const d = res.data.data;
        setBadges({ pendingZain: d.pendingZain, dueToday: d.dueToday, overdue: d.overdue, dueSoon: d.dueSoon });
      })
      .catch(() => {
        /* Chup chaap -- badge na dikhe to bhi page chalta rahe */
      });
  }, []);

  useEffect(refreshBadges, [refreshBadges]);

  /**
   * Tab aur hafta, dono ek hi jagah se.
   *
   * Pehle goTab poora query string badal deta tha, is liye tab badalne par
   * hafta gum ho jata tha. Ab jo diya nahi gaya wo waise hi rehta hai.
   */
  const setParams = (next) => {
    const nextTab = next.tab !== undefined ? next.tab : tab;
    const nextWeek = next.week !== undefined ? next.week : week;

    const params = {};
    if (nextTab && nextTab !== 'dashboard') params.tab = nextTab;
    if (nextWeek) params.week = nextWeek;

    setSearchParams(params);
  };

  const goTab = (key) => setParams({ tab: key });
  const setWeek = (value) => setParams({ week: value });

  if (loading) return <Spinner size="lg" label="Loading LinkedIn playbook..." />;
  if (!playbook) return <p className="text-slate-500">Playbook could not be loaded</p>;

  const shared = { playbook, onChanged: refreshBadges };

  const badgeFor = (key) => {
    if (key === 'askzain' && badges.pendingZain) return badges.pendingZain;
    if (key === 'followups' && badges.dueSoon) return badges.dueSoon;
    if (key === 'pipeline' && badges.dueToday + badges.overdue) return badges.dueToday + badges.overdue;
    return null;
  };

  return (
    <div className="space-y-5">
      {/* ---------------- Header ---------------- */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">LinkedIn Dashboard</h2>
        <p className="text-sm text-slate-500">
          Connections, outreach aur Saturday wali report — sab ek jagah
        </p>
      </div>

      {/* ---------------- Tabs ---------------- */}
      <div className="card overflow-x-auto p-2">
        <div className="flex min-w-max gap-1">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            const badge = badgeFor(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => goTab(key)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}

                {badge ? (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Active tab ---------------- */}
      {tab === 'dashboard' && (
        <LiDashboard {...shared} onGoTab={goTab} week={week} onWeekChange={setWeek} />
      )}
      {tab === 'pipeline' && <LiPipeline {...shared} />}
      {tab === 'followups' && <LiFollowUps {...shared} />}
      {tab === 'outreach' && <LiOutreach {...shared} />}
      {tab === 'replies' && <LiReplyGuide {...shared} />}
      {tab === 'routine' && <LiRoutine {...shared} />}
      {tab === 'search' && <LiSearchHelper {...shared} />}
      {tab === 'report' && <LiReport {...shared} week={week} onWeekChange={setWeek} />}
      {tab === 'askzain' && <LiAskZain {...shared} />}
      {tab === 'rules' && <LiRules {...shared} />}
    </div>
  );
};

export default LinkedIn;
