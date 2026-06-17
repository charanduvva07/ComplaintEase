import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, User, Clock } from 'lucide-react';
import { adminService } from '../../services/services';
import { formatDateTime, getInitials, getAvatarColor } from '../../utils/helpers';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminAuditLogs = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page],
    queryFn: () => adminService.getAuditLogs({ page, limit: 20 }),
    keepPreviousData: true,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted text-sm">Complete history of admin actions</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <Activity size={40} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-3" />
            <p className="text-muted">No audit logs yet</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 px-6 py-4"
                style={{ borderBottom: '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: getAvatarColor(log.performedBy?.name), fontSize: '10px' }}
                >
                  {getInitials(log.performedBy?.name || '?')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.performedBy?.name || 'System'}</span>
                    <span
                      className="badge text-xs"
                      style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}
                    >
                      {log.performedBy?.role || 'system'}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{log.action}</p>
                  <p className="text-xs text-muted">{log.targetType}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted">{formatDateTime(log.createdAt)}</p>
                  {log.ipAddress && (
                    <p className="text-xs text-muted font-mono">{log.ipAddress}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

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

export default AdminAuditLogs;
