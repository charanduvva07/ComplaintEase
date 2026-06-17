import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, X, PlusCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { userService } from '../../services/services';
import { getStatusBadgeClass, getPriorityBadgeClass, getCategoryIcon, formatDate, timeAgo } from '../../utils/helpers';

const STATUSES = ['', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const CATEGORIES = ['', 'Water', 'Electricity', 'Internet', 'Roads', 'Sanitation', 'Transport', 'Hostel', 'Academic', 'Technical', 'Other'];

const MyComplaints = () => {
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['myComplaints', filters, page],
    queryFn: () => userService.getComplaints({ ...filters, page, limit: 10 }),
    keepPreviousData: true,
  });

  const complaints = data?.complaints || [];
  const pagination = data?.pagination || {};

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const hasActiveFilters = filters.status || filters.category || filters.search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Complaints</h1>
          <p className="text-muted text-sm">
            {pagination.total || 0} total complaints
          </p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          <PlusCircle size={16} /> New Complaint
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search complaints..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} gap-2`}
          >
            <Filter size={16} /> Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white" style={{ background: 'rgb(239,68,68)' }}>
                {[filters.status, filters.category].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilters({ status: '', category: '', search: '' }); setPage(1); }}
              className="btn btn-ghost gap-2"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex gap-3 flex-wrap"
          >
            <select
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
              className="input w-auto min-w-36"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s || 'All Statuses'}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilter('category', e.target.value)}
              className="input w-auto min-w-36"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c ? `${getCategoryIcon(c)} ${c}` : 'All Categories'}</option>
              ))}
            </select>
          </motion.div>
        )}
      </div>

      {/* Complaints Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={48} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No complaints found</h3>
            <p className="text-sm text-muted mb-6">
              {hasActiveFilters ? 'Try adjusting your filters.' : "You haven't submitted any complaints yet."}
            </p>
            <Link to="/complaints/new" className="btn btn-primary">
              Submit Your First Complaint
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Department</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="font-mono text-xs text-muted">{c.complaintId}</span>
                    </td>
                    <td>
                      <Link
                        to={`/complaints/${c._id}`}
                        className="font-medium hover:underline"
                        style={{ color: 'rgb(var(--color-primary))' }}
                      >
                        <span className="mr-2">{getCategoryIcon(c.category)}</span>
                        {c.title.length > 50 ? c.title.slice(0, 50) + '...' : c.title}
                      </Link>
                    </td>
                    <td><span className="text-sm">{c.category}</span></td>
                    <td><span className={`badge ${getStatusBadgeClass(c.status)}`}>{c.status}</span></td>
                    <td><span className={`badge ${getPriorityBadgeClass(c.priority || c.urgency)}`}>{c.priority || c.urgency}</span></td>
                    <td><span className="text-sm">{c.department?.name || '–'}</span></td>
                    <td><span className="text-xs text-muted">{timeAgo(c.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
          >
            <p className="text-sm text-muted">
              Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn btn-ghost btn-sm btn-icon"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(
                Math.max(0, page - 2),
                Math.min(pagination.pages, page + 1)
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`btn btn-sm w-8 h-8 ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-ghost btn-sm btn-icon"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
