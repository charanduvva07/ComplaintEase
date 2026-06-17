import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffService } from '../../services/services';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ClipboardList, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const StaffComplaints = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['staffComplaintsList', { page, statusFilter }],
    queryFn: () => staffService.getAssignedComplaints({ page, limit: 10, status: statusFilter }),
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Assigned': return <ClipboardList size={16} />;
      case 'Accepted':
      case 'In Progress': return <Clock size={16} />;
      case 'Completed':
      case 'Verified':
      case 'Resolved': return <CheckCircle2 size={16} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    if (['Completed', 'Verified', 'Resolved', 'Closed'].includes(status)) return 'badge-success';
    if (['In Progress', 'Accepted'].includes(status)) return 'badge-info';
    return 'badge-warning';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">My Assignments</h1>
          <p className="text-muted">Manage and update all your assigned tasks.</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input pr-10"
          >
            <option value="">All Statuses</option>
            <option value="Assigned">Assigned (New)</option>
            <option value="Accepted">Accepted</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed / Pending Verification</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : !data?.complaints?.length ? (
          <div className="p-12 text-center text-muted flex flex-col items-center">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p className="text-lg">No assignments found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">ID / Details</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">Location</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">Assigned At</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.complaints.map((complaint) => (
                  <motion.tr 
                    key={complaint._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-400 text-sm mb-1">{complaint.complaintId}</span>
                        <span className="font-semibold">{complaint.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`badge flex items-center w-fit gap-1.5 ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        {complaint.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p>{complaint.location}</p>
                        <p className="text-muted text-xs mt-1">Priority: <span className="font-semibold text-white">{complaint.priority}</span></p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted">
                      {complaint.assignedAt ? (
                        <>
                          <p>{format(new Date(complaint.assignedAt), 'MMM d, yyyy')}</p>
                          <p className="text-xs">{formatDistanceToNow(new Date(complaint.assignedAt), { addSuffix: true })}</p>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        to={`/staff/complaints/${complaint._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Manage
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-sm text-muted">
              Showing page {page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffComplaints;
