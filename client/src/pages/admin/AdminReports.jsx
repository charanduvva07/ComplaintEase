import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileBarChart, Download, Plus, Calendar, Trash2 } from 'lucide-react';
import { adminService } from '../../services/services';
import { formatDate, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    type: 'monthly',
    from: '',
    to: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: adminService.getReports,
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => adminService.generateReport(payload),
    onSuccess: () => {
      toast.success('Report generated!');
      queryClient.invalidateQueries(['adminReports']);
      setGenerating(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Report generation failed');
      setGenerating(false);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      type: form.type,
      dateRange: { from: form.from || undefined, to: form.to || undefined },
    });
    setGenerating(true);
  };

  const downloadPDF = (report) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ComplaintEase', 15, 20);
    doc.setFontSize(12);
    doc.text(report.title, 15, 32);

    // Summary stats
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Report Summary', 15, 55);

    const summary = [
      ['Total Complaints', String(report.summary?.totalComplaints || 0)],
      ['Resolved', String(report.summary?.resolved || 0)],
      ['Pending', String(report.summary?.pending || 0)],
      ['Resolution Rate', `${report.summary?.resolutionRate || 0}%`],
      ['Avg Resolution Time', `${report.summary?.avgResolutionTime || 0} hours`],
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: summary,
      theme: 'grid',
      styles: { fontSize: 11 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Complaints table
    if (report.data?.complaints?.length) {
      const complaints = report.data.complaints.slice(0, 100);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['ID', 'Title', 'Status', 'Priority', 'Category', 'Date']],
        body: complaints.map((c) => [
          c.complaintId || '',
          (c.title || '').slice(0, 40),
          c.status || '',
          c.priority || '',
          c.category || '',
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        ]),
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
      });
    }

    doc.save(`${report.title.replace(/[^a-z0-9]/gi, '-')}.pdf`);
    toast.success('PDF downloaded!');
  };

  const reports = data?.reports || [];

  const getTypeColor = (type) => {
    const map = {
      monthly: '#6366f1',
      department: '#10b981',
      resolution: '#3b82f6',
      analytics: '#8b5cf6',
      custom: '#f59e0b',
    };
    return map[type] || '#6366f1';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted text-sm">Generate and download complaint reports</p>
      </div>

      {/* Generate Report Card */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus size={18} style={{ color: 'rgb(var(--color-primary))' }} /> Generate New Report
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="label">Report Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
              <option value="monthly">Monthly Overview</option>
              <option value="department">Department Performance</option>
              <option value="resolution">Resolution Analysis</option>
              <option value="analytics">Full Analytics</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">From Date</label>
            <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="input" />
          </div>
          <div className="form-group">
            <label className="label">To Date</label>
            <input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="input" />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="btn btn-primary w-full"
            >
              {generateMutation.isPending ? 'Generating...' : <><FileBarChart size={16} /> Generate</>}
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="card p-6 h-24 skeleton" />)
        ) : reports.length === 0 ? (
          <div className="card p-16 text-center">
            <FileBarChart size={48} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No reports yet</h3>
            <p className="text-sm text-muted">Generate your first report above.</p>
          </div>
        ) : (
          reports.map((report, i) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${getTypeColor(report.type)}15` }}
                >
                  <FileBarChart size={20} style={{ color: getTypeColor(report.type) }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {report.dateRange?.from ? `${formatDate(report.dateRange.from)} – ${formatDate(report.dateRange.to)}` : 'All time'}
                    </span>
                    <span>Generated by {report.generatedBy?.name}</span>
                    <span>{formatDateTime(report.createdAt)}</span>
                  </div>

                  {/* Summary pills */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      { label: 'Total', value: report.summary?.totalComplaints },
                      { label: 'Resolved', value: report.summary?.resolved },
                      { label: 'Rate', value: `${report.summary?.resolutionRate || 0}%` },
                    ].map(({ label, value }) => (
                      <span
                        key={label}
                        className="px-2 py-0.5 rounded-md text-xs"
                        style={{ background: 'rgb(var(--bg-hover))', border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
                      >
                        {label}: <strong>{value ?? 0}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadPDF(report)}
                  className="btn btn-secondary btn-sm gap-1"
                >
                  <Download size={14} /> PDF
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReports;
