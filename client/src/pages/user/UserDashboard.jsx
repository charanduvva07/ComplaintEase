import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Clock, CheckCircle, XCircle, PlusCircle,
  TrendingUp, AlertTriangle, BarChart2
} from 'lucide-react';
import { userService } from '../../services/services';
import StatCard from '../../components/ui/StatCard';
import ComplaintCard from '../../components/ui/ComplaintCard';
import { useAuth } from '../../contexts/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

const UserDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: userService.getDashboard,
    refetchInterval: 60000,
  });

  const stats = data?.stats || {};
  const monthlyTrend = (data?.monthlyTrend || []).map((item) => ({
    name: MONTH_NAMES[(item._id.month - 1)],
    complaints: item.count,
  }));
  const categoryBreakdown = (data?.categoryBreakdown || []).map((item) => ({
    name: item._id,
    value: item.count,
  }));

  const statCards = [
    { title: 'Total Complaints', value: stats.total ?? 0, icon: FileText, color: '#6366f1' },
    { title: 'Pending Review', value: (stats.submitted ?? 0) + (stats.underReview ?? 0), icon: Clock, color: '#f59e0b' },
    { title: 'In Progress', value: stats.inProgress ?? 0, icon: AlertTriangle, color: '#3b82f6' },
    { title: 'Resolved', value: stats.resolved ?? 0, icon: CheckCircle, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}! 👋</span>
          </h1>
          <p className="text-muted text-sm mt-1">Here's an overview of your complaints</p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          <PlusCircle size={16} /> Submit Complaint
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...card} loading={isLoading} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div
          className="card p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Complaint Trend</h3>
              <p className="text-xs text-muted mt-1">Your complaints over the past months</p>
            </div>
            <BarChart2 size={20} style={{ color: 'rgb(var(--text-muted))' }} />
          </div>

          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--text-muted))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--bg-card))',
                    border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
                    borderRadius: '8px',
                    color: 'rgb(var(--text-primary))',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="complaints" stroke="#6366f1" strokeWidth={2} fill="url(#colorComplaints)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={32} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-2" />
                <p className="text-sm text-muted">No data yet. Submit your first complaint!</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Category Pie */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">By Category</h3>
              <p className="text-xs text-muted mt-1">Breakdown of complaints</p>
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--bg-card))',
                    border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted">No complaints yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Complaints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Complaints</h3>
          <Link to="/complaints" className="text-sm font-medium" style={{ color: 'rgb(var(--color-primary))' }}>
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="card p-6 h-48 skeleton" />)}
          </div>
        ) : data?.recentComplaints?.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentComplaints.map((complaint) => (
              <ComplaintCard key={complaint._id} complaint={complaint} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <FileText size={48} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No complaints yet</h3>
            <p className="text-sm text-muted mb-6">Get started by submitting your first complaint.</p>
            <Link to="/complaints/new" className="btn btn-primary">
              <PlusCircle size={16} /> Submit Your First Complaint
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserDashboard;
