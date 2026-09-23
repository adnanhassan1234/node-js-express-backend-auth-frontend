import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { statsApi, inboxApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { CATEGORY_COLORS, styleForStatus } from '../utils/statusStyles';
import { formatDate, daysFromToday } from '../utils/date';

import {
  LuAlarmClock,
  LuBellOff,
  LuBellRing,
  LuClipboardList,
  LuHandshake,
  LuMail,
  LuMailX,
  LuTarget,
  LuMessageCircle,
  LuRepeat,
  LuRefreshCw,
  LuSearch,
  LuSend,
  LuUsers,
} from 'react-icons/lu';

import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ContactModal from '../components/ContactModal';
import Pagination from '../components/Pagination';

/**
 * Date range ko API params me badalta hai.
 *
 * null ka matlab default list: aaj se agle 2 din, aur pichhli saari overdue.
 * Range chunne par limit barha dete hain -- user ne jaan boojh kar maanga hai.
 */
/**
 * "Ready to Email" ka rang number ke hisaab se badalta hai.
 *
 * Is card ka matlab ulta hai: number ZYADA hona achhi baat hai (kaam mojood),
 * aur KAM hona khatra (outreach rukne wala hai). Ek tay-shuda rang ye farq
 * nahi bata sakta -- green me "0" dekh kar lagta hai sab theek hai.
 */
const readyAccent = (n) => {
  if (!n) return 'red';           // 0 -- bhejne ko kuch nahi bacha
  if (n < 10) return 'orange';    // khatam hone ko hai
  return 'green';                 // kaafi kaam mojood hai
};

const followUpParams = (range, page = 1, perPage = 10) => ({
  page,
  limit: perPage,
  ...(range ? { from: range.from || undefined, to: range.to || undefined } : {}),
});

/** Dashboard — stats cards, charts aur upcoming follow-ups */
const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  /* ---------- Follow-up date search ---------- */
  const [fuFrom, setFuFrom] = useState('');
  const [fuTo, setFuTo] = useState('');
  const [fuLoading, setFuLoading] = useState(false);
  const [filtered, setFiltered] = useState(false);

  /* ---------- Pagination ---------- */
  const [fuPage, setFuPage] = useState(1);
  const [fuPerPage, setFuPerPage] = useState(10);
  const [fuMeta, setFuMeta] = useState({ totalRecords: 0, totalPages: 1 });

  /**
   * Jo range abhi lagi hui hai wo ref me rakhte hain, state me nahi --
   * warna loadData har dafa naya ban jata aur effect chakkar me par jata.
   */
  const appliedRange = useRef(null);
  const fuPageRef = useRef(1);
  const fuPerPageRef = useRef(10);

  const loadFollowUps = useCallback((range, page = 1, perPage = 10) => {
    appliedRange.current = range;
    fuPageRef.current = page;
    fuPerPageRef.current = perPage;

    setFuPage(page);
    setFuPerPage(perPage);
    setFuLoading(true);

    return statsApi
      .upcomingFollowUps(followUpParams(range, page, perPage))
      .then((res) => {
        setFollowUps(res.data.data);
        setFiltered(Boolean(res.data.filtered));
        setFuMeta({ totalRecords: res.data.totalRecords, totalPages: res.data.totalPages });
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load follow-ups')))
      .finally(() => setFuLoading(false));
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);

    // Refresh par jo date range lagi hui hai wohi barqarar rehti hai
    Promise.all([
      statsApi.summary(),
      statsApi.upcomingFollowUps(
        followUpParams(appliedRange.current, fuPageRef.current, fuPerPageRef.current)
      ),
    ])
      .then(([statsRes, followUpsRes]) => {
        setStats(statsRes.data.data);
        setFollowUps(followUpsRes.data.data);
        setFiltered(Boolean(followUpsRes.data.filtered));
        setFuMeta({
          totalRecords: followUpsRes.data.totalRecords,
          totalPages: followUpsRes.data.totalPages,
        });
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the dashboard')))
      .finally(() => setLoading(false));
  }, []);

  /* Date search lagao */
  const searchByDate = () => {
    if (!fuFrom && !fuTo) {
      toast.error('Pick at least one date');
      return;
    }
    // Nayi search hamesha pehle page se shuru
    loadFollowUps({ from: fuFrom, to: fuTo }, 1, fuPerPage);
  };

  /* Wapas default par (agle 2 din + overdue) */
  const clearDateSearch = () => {
    setFuFrom('');
    setFuTo('');
    loadFollowUps(null, 1, fuPerPage);
  };

  useEffect(loadData, [loadData]);

  /**
   * Refresh sirf stats hi nahi -- mailbox bhi check karta hai, taake
   * "New Replies" ka card yahin se update ho jaye.
   */
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const res = await inboxApi.checkReplies();
      if (res.data.newReplies > 0) toast.success(res.data.message);
    } catch (error) {
      /* Mailbox check fail ho jaye to bhi stats refresh honi chahiyen */
    } finally {
      loadData();
      setRefreshing(false);
    }
  };

  /** Card par click -> Contacts page par us status ka filter laga do */
  const goToContacts = (filters) => {
    const params = new URLSearchParams(filters).toString();
    navigate(`/contacts?${params}`);
  };

  if (loading) return <Spinner size="lg" label="Loading dashboard..." />;
  if (!stats) return <p className="text-slate-500">No data could be loaded</p>;

  const { cards, byStatus, byCategory, byCity } = stats;

  // Pie chart me sirf wohi categories jin me contacts hain
  const pieData = byCategory.filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">
            {stats.totalContacts} contacts · {stats.withEmail} with an email address
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary"
        >
          {/* Icon ghoomta hai jab refresh chal raha ho */}
          <LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ---------------- Stat cards ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={cards.totalContacts}
          accent="brand"
          icon={<LuUsers className="h-5 w-5" />}
          onClick={() => goToContacts({})}
        />
        <StatCard
          title="Not Contacted"
          value={cards.notContacted}
          accent="slate"
          icon={<LuClipboardList className="h-5 w-5" />}
          subtitle="No email sent yet"
          onClick={() => goToContacts({ status: 'Not Contacted' })}
        />
        <StatCard
          title="Ready to Email"
          value={cards.readyToEmail ?? 0}
          accent={readyAccent(cards.readyToEmail ?? 0)}
          icon={<LuTarget className="h-5 w-5" />}
          subtitle="Have an email, not contacted yet"
          onClick={() => goToContacts({ hasEmail: 'true', status: 'Not Contacted' })}
        />
        <StatCard
          title="Emails Sent"
          value={cards.emailsSent}
          accent="yellow"
          icon={<LuSend className="h-5 w-5" />}
          subtitle="Initial email sent"
          onClick={() => goToContacts({ status: 'Email Sent' })}
        />
        <StatCard
          title="Follow-ups Pending"
          value={cards.followUpsPending}
          accent="orange"
          icon={<LuRepeat className="h-5 w-5" />}
          subtitle="Follow-up 1 + Follow-up 2"
          // Card dono statuses ginta hai — is liye filter bhi dono par lagta hai
          onClick={() => goToContacts({ status: 'Follow-up 1,Follow-up 2' })}
        />
        <StatCard
          title="New Replies"
          value={cards.newReplies || 0}
          accent="green"
          icon={<LuBellRing className="h-5 w-5" />}
          subtitle="From your inbox — unread"
          onClick={() => navigate('/replies')}
        />
        <StatCard
          title="Replied"
          value={cards.replied}
          accent="green"
          icon={<LuMessageCircle className="h-5 w-5" />}
          onClick={() => goToContacts({ status: 'Replied' })}
        />
        <StatCard
          title="Deals Closed"
          value={cards.dealsClosed}
          accent="blue"
          icon={<LuHandshake className="h-5 w-5" />}
          onClick={() => goToContacts({ status: 'Deal Closed' })}
        />
        <StatCard
          title="No Reply"
          value={cards.noReply}
          accent="slate"
          icon={<LuBellOff className="h-5 w-5" />}
          onClick={() => goToContacts({ status: 'No Reply' })}
        />
      
      </div>

      {/* ---------------- Charts ---------------- */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bar chart — status wise */}
        <div className="card p-5 lg:col-span-3">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Contacts by Status</h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="status"
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.status} fill={styleForStatus(entry.status).hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart — category wise */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Contacts by Category</h3>

          <div className="h-72">
            {pieData.length === 0 ? (
              <p className="pt-20 text-center text-sm text-slate-400">No contacts yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={2}
                    label={({ category, count }) => `${category}: ${count}`}
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Top cities ---------------- */}
      {byCity?.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-800">Top Cities</h3>
          <div className="flex flex-wrap gap-2">
            {byCity.map((c) => (
              <button
                key={c.city}
                type="button"
                onClick={() => goToContacts({ city: c.city })}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs
                           font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
              >
                {c.city}
                {c.country ? ' (' + c.country + ')' : ''}{' '}
                <span className="font-bold text-brand-600">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Upcoming follow-ups ---------------- */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Upcoming Follow-ups</h3>
            <p className="text-xs text-slate-500">
              {filtered
                ? 'Showing the follow-up dates you picked'
                : 'Due within the next 2 days (overdue included)'}
            </p>
          </div>

          {/* ---- Follow-up date search ---- */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fuFrom}
              max={fuTo || undefined}
              onChange={(e) => setFuFrom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByDate()}
              aria-label="Follow-up date from"
              className="input w-[9.5rem] py-1.5 text-xs"
            />

            <span className="text-xs text-slate-400">to</span>

            <input
              type="date"
              value={fuTo}
              min={fuFrom || undefined}
              onChange={(e) => setFuTo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByDate()}
              aria-label="Follow-up date to"
              className="input w-[9.5rem] py-1.5 text-xs"
            />

            <button
              type="button"
              onClick={searchByDate}
              disabled={fuLoading}
              className="btn-primary py-1.5 text-xs"
            >
              <LuSearch className="h-4 w-4" aria-hidden="true" />
              {fuLoading ? 'Searching...' : 'Search'}
            </button>

            {filtered && (
              <button
                type="button"
                onClick={clearDateSearch}
                className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
              >
                Clear
              </button>
            )}

            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
              {fuMeta.totalRecords}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
