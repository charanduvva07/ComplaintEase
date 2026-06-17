import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  ChevronLeft, MapPin, Calendar, Building2, User,
  AlertTriangle, Star, Send, Paperclip, Eye, Clock
} from 'lucide-react';
import { complaintService, adminService } from '../../services/services';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import StatusTimeline from '../../components/ui/StatusTimeline';
import CommentThread from '../../components/ui/CommentThread';
import {
  getStatusBadgeClass, getPriorityBadgeClass, getCategoryIcon,
  formatDate, timeAgo
} from '../../utils/helpers';
import toast from 'react-hot-toast';

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { joinComplaint, leaveComplaint, onEvent } = useSocket();
  const queryClient = useQueryClient();
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const [selectedStaff, setSelectedStaff] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintService.getOne(id),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => complaintService.getComments(id),
    refetchInterval: 30000,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staffList'],
    queryFn: () => adminService.getStaff(),
    enabled: isAdmin,
  });

  // Join complaint room for live updates
  useEffect(() => {
    joinComplaint(id);
    const cleanup1 = onEvent('comment:new', () => queryClient.invalidateQueries(['comments', id]));
    const cleanup2 = onEvent('complaint:statusChanged', () => queryClient.invalidateQueries(['complaint', id]));
    return () => {
      leaveComplaint(id);
      cleanup1?.();
      cleanup2?.();
    };
  }, [id]);

  const rateMutation = useMutation({
    mutationFn: (data) => complaintService.rate(id, data),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      setShowRating(false);
      queryClient.invalidateQueries(['complaint', id]);
    },
    onError: (err) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: (staffId) => adminService.assignStaff(id, staffId),
    onSuccess: () => {
      toast.success('Staff assigned successfully');
      queryClient.invalidateQueries(['complaint', id]);
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ action, notes }) => adminService.verifyCompletion(id, action, notes),
    onSuccess: () => {
      toast.success('Verification status updated');
      queryClient.invalidateQueries(['complaint', id]);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="card p-6 h-48 skeleton" />
        <div className="card p-6 h-64 skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <AlertTriangle size={48} style={{ color: '#ef4444' }} className="mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Complaint Not Found</h2>
        <p className="text-muted mb-6">This complaint doesn't exist or you don't have access to it.</p>
        <Link to="/complaints" className="btn btn-primary">Back to Complaints</Link>
      </div>
    );
  }

  const complaint = data?.complaint;
  if (!complaint) return null;

  const canRate = !complaint.rating?.score
    && ['Resolved', 'Closed'].includes(complaint.status)
    && complaint.submittedBy?._id === user?._id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost gap-2">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Header card */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-lg">{getCategoryIcon(complaint.category)}</span>
              <span className="text-sm font-mono text-muted">{complaint.complaintId}</span>
              <span className={`badge ${getStatusBadgeClass(complaint.status)}`}>{complaint.status}</span>
              <span className={`badge ${getPriorityBadgeClass(complaint.priority)}`}>{complaint.priority}</span>
            </div>
            <h1 className="text-xl font-bold">{complaint.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Eye size={12} /> {complaint.viewCount || 0} views
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mb-6 space-y-4">
            {['Submitted', 'Under Review'].includes(complaint.status) && (
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1">Assign to Staff</label>
                  <select 
                    value={selectedStaff} 
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="input"
                  >
                    <option value="">Select a technician...</option>
                    {staffData?.staff?.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.department?.name || 'General'})</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => assignMutation.mutate(selectedStaff)}
                  disabled={!selectedStaff || assignMutation.isPending}
                  className="btn btn-primary"
                >
                  Assign
                </button>
              </div>
            )}

            {complaint.status === 'Completed' && (
              <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3">
                <h3 className="font-bold text-green-400">Verify Work Completion</h3>
                <textarea 
                  className="input"
                  placeholder="Verification or rework notes..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => verifyMutation.mutate({ action: 'verify', notes: verificationNotes })}
                    disabled={verifyMutation.isPending}
                    className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                  >
                    Verify & Resolve
                  </button>
                  <button 
                    onClick={() => verifyMutation.mutate({ action: 'rework', notes: verificationNotes })}
                    disabled={verifyMutation.isPending || !verificationNotes}
                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    Request Rework
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-sm">
          {[
            { icon: Calendar, label: 'Submitted', value: formatDate(complaint.createdAt) },
            { icon: MapPin, label: 'Location', value: complaint.location },
            { icon: Building2, label: 'Department', value: complaint.department?.name },
            { icon: User, label: 'Assigned To', value: complaint.assignedTo?.name || 'Unassigned' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={14} style={{ color: 'rgb(var(--text-muted))' }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">{label}</p>
                <p className="font-medium">{value || '–'}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="divider" />

        <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          {complaint.description}
        </p>

        {/* Images */}
        {complaint.images?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Attached Images</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {complaint.images.map((img, i) => (
                <a key={i} href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt="" className="w-full h-32 object-cover rounded-xl hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {complaint.documents?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Documents</p>
            <div className="flex flex-wrap gap-2">
              {complaint.documents.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:opacity-80"
                  style={{ background: 'rgb(var(--bg-hover))', border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
                >
                  <Paperclip size={14} style={{ color: 'rgb(var(--color-primary))' }} />
                  {doc.filename}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Completion Proofs */}
        {complaint.completionProofImages?.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5">
            <p className="text-xs font-medium text-green-400 mb-2 uppercase tracking-wider">Completion Proof Images</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {complaint.completionProofImages.map((img, i) => (
                <a key={i} href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt="Proof" className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Admin notes */}
        {complaint.adminNotes && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgb(99,102,241)' }}>Admin Notes</p>
            <p className="text-sm">{complaint.adminNotes}</p>
          </div>
        )}

        {/* Resolution notes */}
        {complaint.resolutionNotes && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#22c55e' }}>Resolution Notes</p>
            <p className="text-sm">{complaint.resolutionNotes}</p>
          </div>
        )}

        {/* Verification notes */}
        {complaint.verificationNotes && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#3b82f6' }}>Verification Notes</p>
            <p className="text-sm">{complaint.verificationNotes}</p>
          </div>
        )}

        {/* Rating section */}
        {canRate && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#d97706' }}>Rate your experience</p>
            {!showRating ? (
              <button onClick={() => setShowRating(true)} className="btn btn-sm" style={{ background: '#f59e0b', color: 'white' }}>
                <Star size={14} /> Leave a Rating
              </button>
            ) : (
              <div>
                <div className="flex gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star size={24} fill={n <= rating ? '#f59e0b' : 'none'} style={{ color: '#f59e0b' }} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience (optional)..."
                  className="input resize-none mb-2"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => rateMutation.mutate({ score: rating, feedback })}
                    disabled={!rating || rateMutation.isPending}
                    className="btn btn-sm"
                    style={{ background: '#f59e0b', color: 'white' }}
                  >
                    Submit Rating
                  </button>
                  <button onClick={() => setShowRating(false)} className="btn btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing rating */}
        {complaint.rating?.score && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={16} fill={n <= complaint.rating.score ? '#f59e0b' : 'none'} style={{ color: '#f59e0b' }} />
              ))}
            </div>
            <span className="text-sm text-muted">{complaint.rating.feedback || 'No feedback provided'}</span>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status Timeline */}
        <motion.div className="card p-6 lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={16} style={{ color: 'rgb(var(--color-primary))' }} /> Status History
          </h3>
          <StatusTimeline timeline={complaint.timeline} currentStatus={complaint.status} />
        </motion.div>

        {/* Comments */}
        <motion.div className="card p-6 lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <CommentThread
            complaintId={id}
            comments={commentsData?.comments || []}
            isLoading={commentsLoading}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
