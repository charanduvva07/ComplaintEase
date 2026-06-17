import { useQuery } from '@tanstack/react-query';
import { staffService } from '../../services/services';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `rgba(var(--${color}-rgb), 0.1)`, color: `rgb(var(--${color}-rgb))` }}
      >
        <Icon size={24} />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black mb-1">{value}</h3>
      <p className="text-sm font-medium text-muted uppercase tracking-wider">{title}</p>
    </div>
  </motion.div>
);

const StaffDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['staffComplaints', { page: 1, limit: 5 }],
    queryFn: () => staffService.getAssignedComplaints({ page: 1, limit: 5 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const { complaints, stats } = data || { complaints: [], stats: [] };

  const getStat = (statusArr) => {
    return stats.filter(s => statusArr.includes(s._id)).reduce((acc, curr) => acc + curr.count, 0);
  };

  const pendingCount = getStat(['Assigned', 'Accepted', 'In Progress']);
  const completedCount = getStat(['Completed', 'Verified', 'Resolved', 'Closed']);
  const inProgressCount = getStat(['In Progress']);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-2">Staff Overview</h1>
        <p className="text-muted">Manage your assigned tasks and update work progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assigned" value={pendingCount + completedCount} icon={ClipboardList} color="blue" delay={0.1} />
        <StatCard title="Pending Work" value={pendingCount} icon={AlertTriangle} color="orange" delay={0.2} />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} color="indigo" delay={0.3} />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle2} color="green" delay={0.4} />
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Assignments</h2>
          <Link to="/staff/complaints" className="text-sm text-indigo-500 hover:text-indigo-400 font-medium flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
            <p>No recent assignments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <Link
                key={c._id}
                to={`/staff/complaints/${c._id}`}
                className="block p-4 rounded-xl border transition-all hover:border-indigo-500 hover:shadow-lg"
                style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                        {c.complaintId}
                      </span>
                      <span className={`badge ${
                        c.status === 'Assigned' ? 'badge-warning' :
                        c.status === 'In Progress' ? 'badge-info' :
                        'badge-success'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{c.title}</h3>
                  </div>
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted">
                  <span>Location: {c.location}</span>
                  <span>Priority: <strong className={c.priority === 'High' || c.priority === 'Critical' ? 'text-red-400' : ''}>{c.priority}</strong></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
