import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, MessageSquare, Calendar } from 'lucide-react';
import { getStatusBadgeClass, getPriorityBadgeClass, getCategoryIcon, timeAgo, truncate } from '../../utils/helpers';

const ComplaintCard = ({ complaint, showUser = false }) => {
  const {
    _id, complaintId, title, category, status, priority, urgency,
    location, createdAt, submittedBy, department,
  } = complaint;

  return (
    <motion.div
      className="card overflow-hidden"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Top accent bar based on priority */}
      <div
        className="h-1"
        style={{
          background: priority === 'Critical' ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : priority === 'High' ? 'linear-gradient(90deg, #f97316, #ea580c)'
            : priority === 'Medium' ? 'linear-gradient(90deg, #f59e0b, #d97706)'
            : 'linear-gradient(90deg, #22c55e, #16a34a)',
        }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{getCategoryIcon(category)}</span>
            <span className="text-xs font-mono text-muted">{complaintId}</span>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
            <span className={`badge ${getPriorityBadgeClass(priority || urgency)}`}>{priority || urgency}</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/complaints/${_id}`}>
          <h3
            className="font-semibold text-base mb-2 hover:underline cursor-pointer line-clamp-2"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {truncate(location, 30)}
            </span>
          )}
          {department?.name && (
            <span className="flex items-center gap-1">
              <MessageSquare size={11} /> {department.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {timeAgo(createdAt)}
          </span>
        </div>

        {/* Footer */}
        {showUser && submittedBy && (
          <div
            className="flex items-center justify-between mt-4 pt-3"
            style={{ borderTop: '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(139,92,246))' }}
              >
                {submittedBy.name?.charAt(0)}
              </div>
              <span className="text-xs text-muted truncate max-w-[120px]">{submittedBy.name}</span>
            </div>
            <Link
              to={`/complaints/${_id}`}
              className="text-xs font-medium"
              style={{ color: 'rgb(var(--color-primary))' }}
            >
              View Details →
            </Link>
          </div>
        )}

        {!showUser && (
          <div className="mt-4">
            <Link
              to={`/complaints/${_id}`}
              className="btn btn-ghost btn-sm w-full text-center"
              style={{ fontSize: '13px' }}
            >
              View Details
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ComplaintCard;
