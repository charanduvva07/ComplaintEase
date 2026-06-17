import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '–';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '–';
  return format(d, fmt);
};

export const formatDateTime = (date) => formatDate(date, 'MMM d, yyyy HH:mm');

export const timeAgo = (date) => {
  if (!date) return '–';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '–';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const getStatusBadgeClass = (status) => {
  const map = {
    'Submitted': 'badge-submitted',
    'Under Review': 'badge-review',
    'Assigned': 'badge-assigned',
    'In Progress': 'badge-progress',
    'Resolved': 'badge-resolved',
    'Closed': 'badge-closed',
    'Rejected': 'badge-rejected',
  };
  return map[status] || 'badge-submitted';
};

export const getPriorityBadgeClass = (priority) => {
  const map = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
    Critical: 'badge-critical',
  };
  return map[priority] || 'badge-medium';
};

export const getCategoryIcon = (category) => {
  const map = {
    Water: '💧',
    Electricity: '⚡',
    Internet: '🌐',
    Roads: '🛣️',
    Sanitation: '🧹',
    Transport: '🚌',
    Hostel: '🏠',
    Academic: '📚',
    Technical: '💻',
    Other: '📋',
  };
  return map[category] || '📋';
};

export const getPriorityColor = (priority) => {
  const map = {
    Low: '#22c55e',
    Medium: '#f59e0b',
    High: '#f97316',
    Critical: '#ef4444',
  };
  return map[priority] || '#6366f1';
};

export const getStatusColor = (status) => {
  const map = {
    'Submitted': '#94a3b8',
    'Under Review': '#f59e0b',
    'Assigned': '#6366f1',
    'In Progress': '#3b82f6',
    'Resolved': '#22c55e',
    'Closed': '#64748b',
    'Rejected': '#ef4444',
  };
  return map[status] || '#94a3b8';
};

export const truncate = (str, length = 80) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#f59e0b', '#10b981', '#3b82f6',
  ];
  const idx = name?.charCodeAt(0) % colors.length || 0;
  return colors[idx];
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const isImageFile = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

export const downloadCSV = (data, filename = 'export.csv') => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// AI-powered complaint categorization (client-side NLP)
const categoryKeywords = {
  Water: ['water', 'pipe', 'leak', 'tap', 'supply', 'pipeline', 'drainage', 'flood', 'tank', 'plumbing'],
  Electricity: ['power', 'electric', 'electricity', 'light', 'street light', 'voltage', 'outage', 'generator', 'wire', 'fuse', 'transformer'],
  Internet: ['internet', 'wifi', 'network', 'connectivity', 'broadband', 'connection', 'bandwidth', 'router', 'online', 'speed'],
  Roads: ['road', 'pothole', 'pavement', 'street', 'highway', 'crack', 'path', 'footpath', 'marking', 'signal', 'construction'],
  Sanitation: ['garbage', 'waste', 'trash', 'dustbin', 'cleaning', 'hygiene', 'mosquito', 'rat', 'odour', 'smell', 'sanitation', 'drain'],
  Transport: ['bus', 'route', 'transport', 'vehicle', 'traffic', 'parking', 'autorickshaw', 'cab', 'commute', 'schedule'],
  Hostel: ['hostel', 'room', 'bathroom', 'mess', 'hall', 'dormitory', 'warden', 'accommodation', 'hot water', 'laundry'],
  Academic: ['exam', 'course', 'faculty', 'class', 'attendance', 'grade', 'syllabus', 'teacher', 'professor', 'schedule', 'academic'],
  Technical: ['server', 'portal', 'website', 'software', 'system', 'technical', 'computer', 'app', 'login', 'error', 'crash', 'bug'],
};

const urgencyKeywords = {
  Critical: ['emergency', 'urgent', 'critical', 'immediate', 'danger', 'life', 'accident', 'injury', 'fire', 'collapse'],
  High: ['serious', 'major', 'high', 'important', 'affected', 'cannot', 'unable', 'disruption', 'broken'],
  Medium: ['issue', 'problem', 'concern', 'need', 'require', 'inconvenience'],
  Low: ['minor', 'small', 'suggestion', 'improve', 'enhance', 'slight'],
};

export const analyzeComplaint = (text) => {
  const lower = text.toLowerCase();

  // Score categories
  const scores = Object.entries(categoryKeywords).map(([cat, keywords]) => ({
    category: cat,
    score: keywords.filter((kw) => lower.includes(kw)).length,
  }));
  scores.sort((a, b) => b.score - a.score);
  const suggestedCategory = scores[0]?.score > 0 ? scores[0].category : 'Other';

  // Score urgency
  const urgencyScores = Object.entries(urgencyKeywords).map(([level, keywords]) => ({
    level,
    score: keywords.filter((kw) => lower.includes(kw)).length,
  }));
  urgencyScores.sort((a, b) => b.score - a.score);
  const suggestedUrgency = urgencyScores[0]?.score > 0 ? urgencyScores[0].level : 'Medium';

  // Department suggestion based on category
  const deptMap = {
    Water: 'Water & Sanitation',
    Electricity: 'Electrical Department',
    Internet: 'IT & Digital Services',
    Roads: 'Roads & Infrastructure',
    Sanitation: 'Water & Sanitation',
    Transport: 'Roads & Infrastructure',
    Hostel: 'Housing & Facilities',
    Academic: 'Academic Affairs',
    Technical: 'IT & Digital Services',
    Other: 'General Services',
  };

  return {
    suggestedCategory,
    suggestedUrgency,
    suggestedDepartment: deptMap[suggestedCategory],
    confidence: Math.min(100, Math.round((scores[0]?.score || 0) * 20)),
    topCategories: scores.slice(0, 3).filter((s) => s.score > 0).map((s) => s.category),
  };
};
