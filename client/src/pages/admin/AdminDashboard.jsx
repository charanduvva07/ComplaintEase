import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, CheckCircle, Clock, XCircle, Users,
  TrendingUp, AlertTriangle, Activity, BarChart3
} from 'lucide-react';
import { adminService } from '../../services/services';
import StatCard from '../../components/ui/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  getStatusBadgeClass, getPriorityBadgeClass, getCategoryIcon,
  timeAgo, formatDate, getInitials, getAvatarColor
} from '../../utils/helpers';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { 'Submitted': '#94a3b8', 'Under Review': '#f59e0b', 'Assigned': '#6366f1', 'In Progress': '#3b82f6', 'Resolved': '#22c55e', 'Closed': '#64748b', 'Rejected': '#ef4444' };
const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b', '#06b6d4', '#84cc16'];

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminService.getDashboard,
    refetchInterval: 60000,
  });

  const stats = data?.stats || {};
  const userStats = data?.userStats || {};
  const categoryBreakdown = (data?.categoryBreakdown || []).map((c) => ({ name: c._id, value: c.count }));
  const statusBreakdown = (data?.statusBreakdown || []).map((s) => ({ name: s._id, value: s.count }));

  const statCards = [
    {
      title: 'Total Complaints',
      value: stats.total ?? 0,
      icon: FileText,
      color: '#6366f1',
      trend: stats.growth > 0 ? 'up' : 'down',
      trendValue: Math.abs(stats.growth || 0),
      subtitle: 'vs last month',
    },
    {
      title: 'Resolved',
      value: stats.resolved ?? 0,
      icon: CheckCircle,
      color: '#22c55e',
      subtitle: `${stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate`,
    },
    {
      title: 'Pending',
      value: stats.pending ?? 0,
      icon: Clock,
      color: '#f59e0b',
    },
    {
      title: 'Total Users',
      value: userStats.total ?? 0,
      icon: Users,
      color: '#8b5cf6',
      trend: 'up',
      trendValue: userStats.thisMonth || 0,
      subtitle: 'new this month',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted text-sm mt-1">Real-time overview · Updated every 60s</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/complaints" className="btn btn-secondary btn-sm">
            <FileText size={14} /> All Complaints
          </Link>
          <Link to="/admin/analytics" className="btn btn-primary btn-sm">
            <BarChart3 size={14} /> Analytics
          </Link>
        </div>
      </div>

      {/* KPI Summary Bar */}
      {!isLoading && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex flex-wrap items-center gap-6"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          {[
            { label: 'Resolution Rate', value: `${stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%`, color: '#22c55e' },
            { label: 'Avg Resolution Time', value: `${Math.round(stats.avgResolutionTime || 0)}h`, color: '#6366f1' },
            { label: 'Active Users', value: stats.activeUsers ?? '–', color: '#8b5cf6' },
            { label: 'This Month', value: stats.thisMonth ?? 0, color: '#f59e0b' },
            { label: 'Growth vs Last Month', value: `${stats.growth > 0 ? '+' : ''}${stats.growth}%`, color: stats.growth >= 0 ? '#22c55e' : '#ef4444' },
          ].map((kpi) => (
            <div key={kpi.label} className="text-center min-w-[80px]">
              <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-muted mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...card} loading={isLoading} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <motion.div className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Status Distribution</h3>
              <p className="text-xs text-muted mt-0.5">All-time complaint status breakdown</p>
            </div>
          </div>
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusBreakdown} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--bg-card))',
                    border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
                    borderRadius: '10px',
                    fontSize: '12px',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted">No data yet</p>
            </div>
          )}
        </motion.div>

        {/* Category Pie */}
        <motion.div className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Category Breakdown</h3>
              <p className="text-xs text-muted mt-0.5">Complaints by category</p>
            </div>
          </div>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgb(var(--bg-card))', border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))', borderRadius: '10px', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted">No data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Complaints & Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <motion.div className="card overflow-hidden lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="font-semibold">Recent Complaints</h3>
            <Link to="/admin/complaints" className="text-sm font-medium" style={{ color: 'rgb(var(--color-primary))' }}>View all →</Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentComplaints || []).map((c) => (
                    <tr key={c._id}>
                      <td><span className="font-mono text-xs text-muted">{c.complaintId}</span></td>
                      <td>
                        <Link to={`/complaints/${c._id}`} className="font-medium text-sm hover:underline" style={{ color: 'rgb(var(--color-primary))' }}>
                          <span className="mr-1">{getCategoryIcon(c.category)}</span>
                          {c.title.length > 35 ? c.title.slice(0, 35) + '...' : c.title}
                        </Link>
                        <p className="text-xs text-muted">{c.submittedBy?.name}</p>
                      </td>
                      <td><span className={`badge ${getStatusBadgeClass(c.status)}`}>{c.status}</span></td>
                      <td><span className={`badge ${getPriorityBadgeClass(c.priority)}`}>{c.priority}</span></td>
                      <td><span className="text-xs text-muted">{timeAgo(c.createdAt)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} style={{ color: 'rgb(var(--color-primary))' }} />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-3 w-3/4 mb-1 rounded" />
                    <div className="skeleton h-2 w-1/2 rounded" />
                  </div>
                </div>
              ))
            ) : (
              (data?.recentActivity || []).map((log) => (
                <div key={log._id} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: getAvatarColor(log.performedBy?.name), fontSize: '10px' }}
                  >
                    {getInitials(log.performedBy?.name || 'S')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{log.action}</p>
                    <p className="text-xs text-muted">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}

            {!isLoading && !data?.recentActivity?.length && (
              <p className="text-sm text-muted text-center py-4">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Department Performance */}
      {(data?.departmentStats?.length || 0) > 0 && (
        <motion.div className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-semibold mb-4">Department Leaderboard</h3>
          <div className="space-y-3">
            {data.departmentStats.map((dept, i) => {
              const rate = dept.performance?.totalComplaints > 0
                ? Math.round((dept.performance.resolvedComplaints / dept.performance.totalComplaints) * 100)
                : 0;
              return (
                <div key={dept._id} className="flex items-center gap-4">
                  <span className="w-6 text-sm font-bold text-muted">#{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{dept.name}</span>
                  <span className="text-xs text-muted">{dept.performance?.totalComplaints || 0} complaints</span>
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgb(var(--bg-hover))' }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${rate}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'rgb(99,102,241)' }}>{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
