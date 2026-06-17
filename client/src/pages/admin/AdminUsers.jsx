import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, X, UserCheck, UserX, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/services';
import { formatDate, timeAgo, getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ROLES = ['', 'user', 'staff', 'admin'];

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', filters, page],
    queryFn: () => adminService.getUsers({ ...filters, page, limit: 15 }),
    keepPreviousData: true,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => adminService.toggleUserStatus(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success(data.isActive ? 'User activated' : 'User suspended');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('Role updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const users = data?.users || [];
  const pagination = data?.pagination || {};

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const getRoleBadgeStyle = (role) => {
    const styles = {
      admin: { background: 'rgba(99,102,241,0.1)', color: '#6366f1' },
      staff: { background: 'rgba(16,185,129,0.1)', color: '#10b981' },
      user: { background: 'rgba(148,163,184,0.1)', color: '#64748b' },
    };
    return styles[role] || styles.user;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-muted text-sm">{pagination.total || 0} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-10"
          />
        </div>
        <select value={filters.role} onChange={(e) => setFilter('role', e.target.value)} className="input w-auto">
          <option value="">All Roles</option>
          {ROLES.filter(Boolean).map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={filters.isActive} onChange={(e) => setFilter('isActive', e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ search: '', role: '', isActive: '' })} className="btn btn-ghost gap-2">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Complaints</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.profilePic?.url ? (
                          <img src={u.profilePic.url} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: getAvatarColor(u.name) }}
                          >
                            {getInitials(u.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => updateRoleMutation.mutate({ id: u._id, role: e.target.value })}
                        className="text-xs px-2 py-1 rounded-lg font-medium border-0 cursor-pointer"
                        style={getRoleBadgeStyle(u.role)}
                        disabled={u.role === 'admin' && u._id !== u._id}
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: u.isActive ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">{u.isVerified ? '✅' : '⏳'}</span>
                    </td>
                    <td>
                      <span className="text-sm">{u.stats?.totalComplaints || 0}</span>
                    </td>
                    <td>
                      <span className="text-xs text-muted">{timeAgo(u.createdAt)}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatusMutation.mutate(u._id)}
                        disabled={toggleStatusMutation.isPending || u.role === 'admin'}
                        className={`btn btn-sm gap-1 ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        title={u.role === 'admin' ? 'Cannot modify admin' : u.isActive ? 'Suspend user' : 'Activate user'}
                      >
                        {u.isActive ? <><UserX size={13} /> Suspend</> : <><UserCheck size={13} /> Activate</>}
                      </button>
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
            <p className="text-sm text-muted">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost btn-sm btn-icon">
                <ChevronLeft size={16} />
              </button>
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

export default AdminUsers;
