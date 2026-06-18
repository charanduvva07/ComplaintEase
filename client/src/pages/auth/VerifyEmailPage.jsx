import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Mail, Zap, RefreshCw } from 'lucide-react';
import { authService } from '../../services/services';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please use the link from your email.');
      return;
    }

    const verify = async () => {
      try {
        const data = await authService.verifyEmail(token);
        // If the backend returned a token, log the user in automatically
        if (data.token) {
          localStorage.setItem('ce_token', data.token);
          localStorage.setItem('ce_user', JSON.stringify(data.user));
          if (typeof updateUser === 'function') updateUser(data.user);
        }
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        // Auto-redirect to login/dashboard after 4 seconds
        setTimeout(() => {
          navigate(data.token ? '/dashboard' : '/login');
        }, 4000);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'This verification link is invalid or has expired. Please request a new one.');
      }    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      await authService.resendVerification(resendEmail);
      setResendSent(true);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'rgb(var(--bg-base))' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-full max-w-md p-10 text-center"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">ComplaintEase</span>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.1)' }}
            >
              <Loader size={36} style={{ color: 'rgb(99,102,241)' }} className="animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Verifying your email…</h1>
            <p className="text-muted text-sm">Please wait while we confirm your email address.</p>
          </motion.div>
        )}

        {/* Success */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <CheckCircle size={40} style={{ color: '#22c55e' }} />
            </div>
            <h1 className="text-2xl font-bold">Email Verified! 🎉</h1>
            <p className="text-muted text-sm">{message}</p>
            <p className="text-xs text-muted">Redirecting you automatically…</p>
            <div className="flex flex-col gap-3 w-full mt-4">
              <Link to="/dashboard" className="btn btn-primary w-full">
                Go to Dashboard
              </Link>
              <Link to="/login" className="btn btn-secondary w-full">
                Sign In
              </Link>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <XCircle size={40} style={{ color: '#ef4444' }} />
            </div>
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-muted text-sm">{message}</p>

            {/* Resend form */}
            {!resendSent ? (
              <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
                >
                  <p className="font-medium text-sm mb-3" style={{ color: 'rgb(99,102,241)' }}>
                    Request a new verification link
                  </p>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="input pl-9 text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="btn btn-primary w-full mt-3 text-sm"
                  >
                    {resendLoading ? (
                      <><Loader size={14} className="animate-spin" /> Sending…</>
                    ) : (
                      <><RefreshCw size={14} /> Resend Verification Email</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="w-full rounded-xl p-4 text-center"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                  ✅ New verification email sent! Check your inbox.
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Link to="/login" className="btn btn-secondary flex-1">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-ghost flex-1">
                Register
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;

