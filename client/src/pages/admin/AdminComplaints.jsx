import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Filter, X, ChevronLeft, ChevronRight, Download,
  CheckSquare, Square, Edit2, Trash2, Eye
} from 'lucide-react';
import { adminService } from '../../services/services';
import {
  getStatusBadgeClass, getPriorityBadgeClass, getCategoryIcon,
  formatDate, timeAgo, downloadCSV
} from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUSES = ['', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const PRIORITIES = ['', 'Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = ['', 'Water', 'Electricity', 'Internet', 'Roads', 'Sanitation', 'Transport', 'Hostel', 'Academic', 'Technical', 'Other'];

const AdminComplaints = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '', category: '', priority: '', search: '', from: '', to: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilter('search', searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminComplaints', filters, page],
    queryFn: () => adminService.getComplaints({ ...filters, page, limit: 15 }),
    keepPreviousData: true,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: adminService.getStaff,
  });

  const bulkMutation = useMutation({
    mutationFn: (data) => adminService.bulkUpdate(data),
    onSuccess: (data) => {
      toast.success(`${data.modifiedCount} complaints updated`);
      queryClient.invalidateQueries(['adminComplaints']);
      setSelectedIds([]);
      setBulkAction('');
    },
    onError: (err) => toast.error(err.message),
  });

  const complaints = data?.complaints || [];
  const pagination = data?.pagination || {};
  const allSelected = complaints.length > 0 && complaints.every((c) => selectedIds.includes(c._id));

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(complaints.map((c) => c._id));
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) return;
    const [action, value] = bulkAction.split(':');
    bulkMutation.mutate({ ids: selectedIds, action, value });
  };

  const handleExportCSV = () => {
    if (complaints.length === 0) return toast.error('No data to export');
    const exportData = complaints.map((c) => ({
      ID: c.complaintId,
      Title: c.title,
      Category: c.category,
      Status: c.status,
      Priority: c.priority,
      Department: c.department?.name || '',
      Location: c.location,
      SubmittedBy: c.submittedBy?.name || '',
      Date: formatDate(c.createdAt),
    }));
    downloadCSV(exportData, `complaints-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('CSV exported!');
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Complaints</h1>
          <p className="text-muted text-sm">{pagination.total || 0} total complaints</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-secondary gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, ID, location..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} gap-2`}
          >
            <Filter size={16} /> Filters
          </button>
          {hasActiveFilters && (
            <button onClick={() => { setFilters({ status: '', category: '', priority: '', search: '', from: '', to: '' }); setPage(1); }} className="btn btn-ghost gap-2">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-3 flex-wrap pt-3"
            style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
          >
            <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="input w-auto min-w-36">
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
            <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} className="input w-auto min-w-32">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className="input w-auto min-w-36">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
            <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className="input w-auto" placeholder="From" />
            <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className="input w-auto" placeholder="To" />
          </motion.div>
        )}

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pt-3"
            style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
          >
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--color-primary))' }}>
              {selectedIds.length} selected
            </span>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="input w-auto">
              <option value="">Bulk Action...</option>
              <option value="status:Under Review">Set Under Review</option>
              <option value="status:In Progress">Set In Progress</option>
              <option value="status:Resolved">Set Resolved</option>
              <option value="status:Closed">Set Closed</option>
              <option value="status:Rejected">Set Rejected</option>
              <option value="priority:High">Set High Priority</option>
              <option value="priority:Critical">Set Critical Priority</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              Apply
            </button>
            <button onClick={() => setSelectedIds([])} className="btn btn-ghost btn-sm">
              Clear selection
            </button>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted">No complaints found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <button onClick={toggleSelectAll} className="text-muted">
                      {allSelected ? <CheckSquare size={16} style={{ color: 'rgb(99,102,241)' }} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Department</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} style={{ background: selectedIds.includes(c._id) ? 'rgba(99,102,241,0.04)' : undefined }}>
                    <td>
                      <button onClick={() => toggleSelect(c._id)}>
                        {selectedIds.includes(c._id)
                          ? <CheckSquare size={16} style={{ color: 'rgb(99,102,241)' }} />
                          : <Square size={16} style={{ color: 'rgb(var(--text-muted))' }} />
                        }
                      </button>
                    </td>
                    <td><span className="font-mono text-xs text-muted">{c.complaintId}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(c.category)}</span>
                        <div>
                          <p className="text-sm font-medium">{c.title.length > 40 ? c.title.slice(0, 40) + '...' : c.title}</p>
                          <p className="text-xs text-muted">{c.location}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${getStatusBadgeClass(c.status)}`}>{c.status}</span></td>
                    <td><span className={`badge ${getPriorityBadgeClass(c.priority)}`}>{c.priority}</span></td>
                    <td><span className="text-sm">{c.department?.name || '–'}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'rgb(99,102,241)', fontSize: '9px' }}>
                          {c.submittedBy?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm">{c.submittedBy?.name || '–'}</span>
                      </div>
                    </td>
                    <td><span className="text-xs text-muted">{timeAgo(c.createdAt)}</span></td>
                    <td>
                      <Link to={`/complaints/${c._id}`} className="btn btn-ghost btn-icon btn-sm">
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}>
            <p className="text-sm text-muted">
              Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost btn-sm btn-icon">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`btn btn-sm w-8 h-8 ${p === page ? 'btn-primary' : 'btn-ghost'}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn btn-ghost btn-sm btn-icon">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaints;
