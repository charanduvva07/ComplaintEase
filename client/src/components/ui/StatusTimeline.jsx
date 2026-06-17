import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const statusConfig = {
  'Submitted': { color: '#94a3b8', icon: '📋' },
  'Under Review': { color: '#f59e0b', icon: '🔍' },
  'Assigned': { color: '#6366f1', icon: '👤' },
  'In Progress': { color: '#3b82f6', icon: '⚙️' },
  'Resolved': { color: '#22c55e', icon: '✅' },
  'Closed': { color: '#64748b', icon: '🔒' },
  'Rejected': { color: '#ef4444', icon: '❌' },
};

const StatusTimeline = ({ timeline = [], currentStatus }) => {
  if (!timeline?.length) return null;

  return (
    <div className="relative">
      {timeline.map((entry, idx) => {
        const isLast = idx === timeline.length - 1;
        const config = statusConfig[entry.status] || statusConfig['Submitted'];

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex gap-4 relative"
          >
            {/* Vertical line */}
            {!isLast && (
              <div
                className="absolute left-5 top-10 bottom-0 w-0.5"
                style={{ background: 'rgb(var(--border-r), var(--border-g), var(--border-b))' }}
              />
            )}

            {/* Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-base"
              style={{
                background: isLast ? config.color : 'rgb(var(--bg-hover))',
                border: `2px solid ${config.color}`,
                fontSize: '16px',
              }}
            >
              {isLast ? <span>{config.icon}</span> : <Check size={14} style={{ color: config.color }} />}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-semibold text-sm" style={{ color: isLast ? config.color : 'rgb(var(--text-primary))' }}>
                  {entry.status}
                </h4>
                <span className="text-xs text-muted">{formatDateTime(entry.timestamp)}</span>
              </div>

              {entry.message && (
                <p className="text-sm text-muted mt-1">{entry.message}</p>
              )}

              {entry.updatedBy?.name && (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: getAvatarColor(entry.updatedBy.name), fontSize: '9px' }}
                  >
                    {getInitials(entry.updatedBy.name)}
                  </div>
                  <span className="text-xs text-muted">by {entry.updatedBy.name}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
