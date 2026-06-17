import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit2, Users, Mail, Phone, X, Check } from 'lucide-react';
import { adminService } from '../../services/services';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminDepartments = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', contactEmail: '', contactPhone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['adminDepartments'],
    queryFn: adminService.getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createDepartment,
    onSuccess: () => {
      toast.success('Department created!');
      queryClient.invalidateQueries(['adminDepartments']);
      setShowForm(false);
      setForm({ name: '', code: '', description: '', contactEmail: '', contactPhone: '' });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateDepartment(id, data),
    onSuccess: () => {
      toast.success('Department updated!');
      queryClient.invalidateQueries(['adminDepartments']);
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const departments = data?.departments || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted text-sm">{departments.length} departments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Department'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h2 className="font-semibold mb-4">New Department</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Water & Sanitation" required />
            </div>
            <div className="form-group">
              <label className="label">Code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" placeholder="WS" required />
            </div>
            <div className="form-group sm:col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>
            <div className="form-group">
              <label className="label">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                <Check size={16} /> Create Department
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Departments grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card p-6 h-48 skeleton" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <motion.div
              key={dept._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.1)' }}
                  >
                    <Building2 size={18} style={{ color: 'rgb(99,102,241)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{dept.name}</h3>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgb(var(--bg-hover))', color: 'rgb(var(--text-muted))' }}
                    >
                      {dept.code}
                    </span>
                  </div>
                </div>
                <span
                  className="w-2 h-2 rounded-full mt-1"
                  style={{ background: dept.isActive ? '#22c55e' : '#ef4444' }}
                  title={dept.isActive ? 'Active' : 'Inactive'}
                />
              </div>

              {dept.description && (
                <p className="text-xs text-muted mb-3 line-clamp-2">{dept.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="p-2 rounded-lg text-center" style={{ background: 'rgb(var(--bg-hover))' }}>
                  <p className="font-bold">{dept.performance?.totalComplaints || 0}</p>
                  <p className="text-muted">Total</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: 'rgb(var(--bg-hover))' }}>
                  <p className="font-bold" style={{ color: '#22c55e' }}>
                    {dept.performance?.totalComplaints
                      ? Math.round((dept.performance.resolvedComplaints / dept.performance.totalComplaints) * 100)
                      : 0}%
                  </p>
                  <p className="text-muted">Resolved</p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1 text-xs text-muted">
                {dept.contactEmail && (
                  <p className="flex items-center gap-1"><Mail size={10} /> {dept.contactEmail}</p>
                )}
                {dept.contactPhone && (
                  <p className="flex items-center gap-1"><Phone size={10} /> {dept.contactPhone}</p>
                )}
                <p className="flex items-center gap-1"><Users size={10} /> {dept.staff?.length || 0} staff members</p>
              </div>

              {/* Categories */}
              {dept.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {dept.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.08)', color: 'rgb(99,102,241)' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
