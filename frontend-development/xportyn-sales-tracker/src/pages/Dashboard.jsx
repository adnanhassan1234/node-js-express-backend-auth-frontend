import { useCallback, useEffect, useState } from 'react';
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

import { statsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { CATEGORY_COLORS, styleForStatus } from '../utils/statusStyles';
import { formatDate, daysFromToday } from '../utils/date';

import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ContactModal from '../components/ContactModal';

/** Dashboard — stats cards, charts aur upcoming follow-ups */
const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);

    Promise.all([statsApi.summary(), statsApi.upcomingFollowUps(2, 50)])
      .then(([statsRes, followUpsRes]) => {
        setStats(statsRes.data.data);
        setFollowUps(followUpsRes.data.data);
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Dashboard load nahi hua')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadData, [loadData]);

  /** Card par click -> Contacts page par us status ka filter laga do */
  const goToContacts = (filters) => {
    const params = new URLSearchParams(filters).toString();
    navigate(`/contacts?${params}`);
  };

  if (loading) return <Spinner size="lg" label="Dashboard load ho raha hai..." />;
  if (!stats) return <p className="text-slate-500">Data load nahi hua</p>;

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
            {stats.totalContacts} contacts · {stats.withEmail} ke paas email hai
          </p>
        </div>

        <button type="button" onClick={loadData} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {/* ---------------- Stat cards ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={cards.totalContacts}
          accent="brand"
          icon="👥"
          onClick={() => goToContacts({})}
        />
        <StatCard
          title="Not Contacted"
          value={cards.notContacted}
          accent="slate"
          icon="📋"
          subtitle="Abhi email nahi bheji"
          onClick={() => goToContacts({ status: 'Not Contacted' })}
        />
        <StatCard
          title="Emails Sent"
          value={cards.emailsSent}
          accent="yellow"
          icon="✉️"
          subtitle="Initial email bhej di"
          onClick={() => goToContacts({ status: 'Email Sent' })}
        />
        <StatCard
          title="Follow-ups Pending"
          value={cards.followUpsPending}
          accent="orange"
          icon="🔁"
          subtitle="Follow-up 1 + Follow-up 2"
          // Card dono statuses ginta hai — is liye filter bhi dono par lagta hai
          onClick={() => goToContacts({ status: 'Follow-up 1,Follow-up 2' })}
        />
        <StatCard
          title="Replied"
          value={cards.replied}
          accent="green"
          icon="💬"
          onClick={() => goToContacts({ status: 'Replied' })}
        />
        <StatCard
          title="Deals Closed"
          value={cards.dealsClosed}
          accent="blue"
          icon="🤝"
          onClick={() => goToContacts({ status: 'Deal Closed' })}
        />
        <StatCard
          title="No Reply"
          value={cards.noReply}
          accent="slate"
          icon="🔇"
          onClick={() => goToContacts({ status: 'No Reply' })}
        />
        <StatCard
          title="Overdue Follow-ups"
          value={cards.overdue}
          accent="red"
          icon="⏰"
          subtitle="Date nikal chuki hai"
        />
        <StatCard
          title="Without Email"
          value={stats.withoutEmail}
          accent="slate"
          icon="📵"
          subtitle="Phone/website se contact karein"
          onClick={() => goToContacts({ hasEmail: 'false' })}
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
              <p className="pt-20 text-center text-sm text-slate-400">Abhi koi contact nahi hai</p>
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
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Upcoming Follow-ups</h3>
            <p className="text-xs text-slate-500">Aaj se agle 2 din ke andar (overdue bhi shamil)</p>
          </div>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
            {followUps.length}
          </span>
        </div>

        {followUps.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            🎉 Abhi koi follow-up due nahi hai
          </p>
        ) : (
          <div className="overflow-x-auto">
            {/* Wahi style jo Contacts table par hai — dono ek jaise lagen */}
            <table className="w-full text-sm [&_td]:border-b [&_td]:border-r [&_td]:border-slate-200/70 [&_td:last-child]:border-r-0">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-200 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0">
                <tr>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Follow-up Date</th>
                </tr>
              </thead>

              <tbody>
                {followUps.map((contact) => {
                  const days = daysFromToday(contact.nextFollowUpDate);

                  return (
                    <tr
                      key={contact._id}
                      onClick={() => setSelectedId(contact._id)}
                      className={`cursor-pointer transition ${styleForStatus(contact.status).row}`}
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{contact.name}</p>
                        <p className="text-xs text-slate-500">
                          {contact.category} · {contact.city || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {contact.email || <span className="text-amber-600">No email</span>}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={contact.status} />
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-700">
                          {formatDate(contact.nextFollowUpDate)}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            contact.isOverdue ? 'text-red-600' : 'text-slate-500'
                          }`}
                        >
                          {days < 0
                            ? `${Math.abs(days)} din late`
                            : days === 0
                              ? 'Aaj due hai'
                              : `${days} din baqi`}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedId && (
        <ContactModal
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={loadData}
          onDeleted={loadData}
        />
      )}
    </div>
  );
};

export default Dashboard;
