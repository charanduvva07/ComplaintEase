import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Zap, Send } from 'lucide-react';
import { authService } from '../../services/services';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(var(--bg-base))' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: sent ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
          {sent ? <Send size={24} style={{ color: '#22c55e' }} /> : <Mail size={24} style={{ color: 'rgb(99,102,241)' }} />}
        </div>

        {sent ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Check your inbox!</h1>
            <p className="text-muted mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the instructions.
            </p>
            <p className="text-sm text-muted mb-6">Didn't receive the email? Check your spam folder or try again.</p>
            <button onClick={() => setSent(false)} className="btn btn-secondary w-full mb-3">
              Try a different email
            </button>
            <Link to="/login" className="btn btn-primary w-full">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-muted mb-6 text-sm">
              Enter the email address associated with your account and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="form-group">
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <Link to="/login" className="flex items-center justify-center gap-2 mt-4 text-sm text-muted hover:text-primary">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
