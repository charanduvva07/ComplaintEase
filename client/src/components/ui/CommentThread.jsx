import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, MessageSquare, Reply, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintService } from '../../services/services';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { timeAgo, getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CommentBubble = ({ comment, onReply, currentUserId }) => {
  const isOwn = comment.author?._id === currentUserId;
  const isAdmin = ['admin', 'staff'].includes(comment.author?.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: getAvatarColor(comment.author?.name) }}
      >
        {comment.author?.profilePic?.url ? (
          <img src={comment.author.profilePic.url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          getInitials(comment.author?.name || '?')
        )}
      </div>

      <div className={`flex-1 max-w-lg ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Author */}
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold">{comment.author?.name}</span>
          {isAdmin && (
            <span
              className="badge text-xs"
              style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}
            >
              {comment.author.role}
            </span>
          )}
          <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
        </div>

        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            background: isOwn
              ? 'rgba(99,102,241,0.12)'
              : isAdmin
              ? 'rgba(16,185,129,0.08)'
              : 'rgb(var(--bg-hover))',
            border: isAdmin
              ? '1px solid rgba(16,185,129,0.2)'
              : '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)',
            color: 'rgb(var(--text-primary))',
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          {comment.content}

          {/* Attachments */}
          {comment.attachments?.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs underline"
                  style={{ color: 'rgb(99,102,241)' }}
                >
                  <Paperclip size={10} /> {att.filename}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Reply button */}
        <button
          onClick={() => onReply(comment)}
          className="flex items-center gap-1 text-xs text-muted mt-1 hover:text-primary transition-colors"
        >
          <Reply size={11} /> Reply
        </button>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 ml-4 space-y-2 border-l-2 pl-4" style={{ borderColor: 'rgb(var(--border-r), var(--border-g), var(--border-b))' }}>
            {comment.replies.map((reply) => (
              <CommentBubble key={reply._id} comment={reply} onReply={onReply} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CommentThread = ({ complaintId, comments = [], isLoading }) => {
  const { user } = useAuth();
  const { emitTyping } = useSocket();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const bottomRef = useRef(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const content = watch('content', '');

  const addCommentMutation = useMutation({
    mutationFn: (formData) => complaintService.addComment(complaintId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', complaintId]);
      reset();
      setReplyTo(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: (err) => toast.error(err.message || 'Failed to send comment'),
  });

  const handleContentChange = () => {
    emitTyping(complaintId, true);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => emitTyping(complaintId, false), 2000));
  };

  const onSubmit = (data) => {
    if (!data.content?.trim()) return;
    const formData = new FormData();
    formData.append('content', data.content.trim());
    if (replyTo) formData.append('parentId', replyTo._id);
    addCommentMutation.mutate(formData);
  };

  useEffect(() => {
    if (comments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-16 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={18} style={{ color: 'rgb(var(--color-primary))' }} />
        <h3 className="font-semibold">Discussion ({comments.length})</h3>
      </div>

      {/* Messages */}
      <div className="space-y-4 min-h-[100px]">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-2" />
            <p className="text-sm text-muted">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentBubble
              key={comment._id}
              comment={comment}
              onReply={setReplyTo}
              currentUserId={user?._id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-4">
        {replyTo && (
          <div
            className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <span style={{ color: 'rgb(var(--text-secondary))' }}>
              Replying to <strong>{replyTo.author?.name}</strong>
            </span>
            <button onClick={() => setReplyTo(null)} className="btn btn-ghost btn-icon" style={{ padding: '2px' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: getAvatarColor(user?.name) }}
          >
            {getInitials(user?.name || '?')}
          </div>

          <div className="flex-1 flex gap-2">
            <textarea
              {...register('content', { required: true })}
              onChange={handleContentChange}
              placeholder="Write a message..."
              rows={2}
              className="input flex-1 resize-none"
              style={{ minHeight: '60px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
            <button
              type="submit"
              disabled={!content?.trim() || addCommentMutation.isPending}
              className="btn btn-primary btn-icon h-10 w-10 self-end"
            >
              <Send size={16} />
            </button>
          </div>
        </form>

        <p className="text-xs text-muted mt-2 ml-11">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default CommentThread;
