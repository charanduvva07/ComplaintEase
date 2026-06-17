import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { adminService } from '../../services/services';
import { TrendingUp, Clock, Users, Award } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b', '#06b6d4', '#84cc16'];
const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

const AdminAnalytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => adminService.getAnalytics({ months: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const monthlyTrend = (data?.monthlyTrend || []).map((item) => ({
    name: `${MONTH_NAMES[(item._id.month - 1)]} ${item._id.year}`,
    total: item.total,
    resolved: item.resolved,
  }));

  const categoryTrend = (data?.categoryTrend || []).map((c) => ({ name: c._id, value: c.count }));
  const resolutionTrend = (data?.resolutionTrend || []).map((r) => ({
    name: `${MONTH_NAMES[(r._id.month - 1)]}`,
    avgTime: Math.round(r.avgTime || 0),
  }));
  const priorityBreakdown = (data?.priorityBreakdown || []).map((p) => ({ name: p._id, value: p.count }));
  const userGrowth = (data?.userGrowth || []).map((u) => ({
    name: `${MONTH_NAMES[(u._id.month - 1)]}`,
    users: u.count,
  }));
  const deptPerf = (data?.avgResolutionByDept || []).slice(0, 6);
  const staffPerf = (data?.staffPerformance || []).slice(0, 10);

  const tooltipStyle = {
    contentStyle: {
      background: 'rgb(var(--bg-card))',
      border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'rgb(var(--text-primary))',
    },
  };

  const ChartCard = ({ title, children, description }) => (
    <motion.div
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
      {isLoading ? (
        <div className="skeleton h-52 rounded-xl" />
      ) : (
        children
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted text-sm">Performance metrics and trend analysis</p>
      </div>

      {/* Monthly Trend – Full width */}
      <ChartCard title="Complaint Volume Trend" description="Total vs resolved complaints over the past 6 months">
        {monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.4)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#totalGrad)" name="Total" />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} fill="url(#resolvedGrad)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-52 flex items-center justify-center"><p className="text-muted text-sm">No data available</p></div>}
      </ChartCard>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Category Distribution" description="Complaints by category">
          {categoryTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryTrend} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryTrend.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center"><p className="text-muted text-sm">No data</p></div>}
        </ChartCard>

        <ChartCard title="Priority Breakdown" description="Complaints by priority level">
          {priorityBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.4)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                  {priorityBreakdown.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center"><p className="text-muted text-sm">No data</p></div>}
        </ChartCard>
      </div>

      {/* Row 3 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Avg Resolution Time (hrs)" description="Monthly average resolution time in hours">
          {resolutionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.4)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="avgTime" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Avg Hours" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center"><p className="text-muted text-sm">No data</p></div>}
        </ChartCard>

        <ChartCard title="User Growth" description="New user registrations per month">
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.4)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="users" fill="#10b981" radius={[6, 6, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center"><p className="text-muted text-sm">No data</p></div>}
        </ChartCard>
      </div>

      {/* Department & Staff Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {deptPerf.length > 0 && (
          <ChartCard title="Department Resolution (Avg Hours)" description="Fastest resolving departments">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.4)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipStyle} formatter={(val) => [`${Math.round(val)}h`, 'Avg Resolution']} />
                <Bar dataKey="avgTime" fill="#6366f1" radius={[0, 4, 4, 0]} name="Avg Hours" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {staffPerf.length > 0 && (
          <ChartCard title="Top Staff Performers" description="Most complaints resolved">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={staffPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.4)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipStyle} formatter={(val) => [val, 'Completed Tasks']} />
                <Bar dataKey="completedTasks" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
