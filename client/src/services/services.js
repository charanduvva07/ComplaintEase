import api, { uploadApi } from './api';

// ─── Auth ───────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// ─── Public (no auth required) ─────────────────────────────────────
export const publicService = {
  getDepartments: () => api.get('/departments'),
};

// ─── Users ───────────────────────────────────────────────────────────
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (formData) =>
    uploadApi.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/users/change-password', data),
  updatePreferences: (data) => api.put('/users/preferences', data),
  getDashboard: () => api.get('/users/dashboard'),
  getComplaints: (params) => api.get('/users/complaints', { params }),
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/users/notifications/read-all'),
};

// ─── Complaints ──────────────────────────────────────────────────────
export const complaintService = {
  submit: (formData) =>
    uploadApi.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/complaints', { params }),
  getOne: (id) => api.get(`/complaints/${id}`),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
  addComment: (id, formData) =>
    uploadApi.post(`/complaints/${id}/comments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getComments: (id) => api.get(`/complaints/${id}/comments`),
  rate: (id, data) => api.post(`/complaints/${id}/rate`, data),
};

// ─── Admin ───────────────────────────────────────────────────────────
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  updateComplaint: (id, data) => api.put(`/complaints/${id}`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/status`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getStaff: () => api.get('/admin/staff'),
  assignStaff: (id, staffId) => api.put(`/admin/complaints/${id}/assign`, { staffId }),
  verifyCompletion: (id, action, notes) => api.put(`/admin/complaints/${id}/verify`, { action, notes }),
  generateReport: (data) => api.post('/admin/reports/generate', data),
  getReports: () => api.get('/admin/reports'),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  bulkUpdate: (data) => api.put('/admin/complaints/bulk', data),
};

// ─── Staff ───────────────────────────────────────────────────────────
export const staffService = {
  getAssignedComplaints: (params) => api.get('/staff/complaints', { params }),
  acceptComplaint: (id) => api.put(`/staff/complaints/${id}/accept`),
  startWork: (id) => api.put(`/staff/complaints/${id}/start`),
  completeWork: (id, formData) =>
    uploadApi.put(`/staff/complaints/${id}/complete`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
