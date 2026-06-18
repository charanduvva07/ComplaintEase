import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Zap, Mail, Lock, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/services';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null); // show resend banner
  const [resendLoading, setResendLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setUnverifiedEmail(null);
    try {
      const result = await login(data);
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate(result.user.role === 'admin' ? '/admin' : result.user.role === 'staff' ? '/staff' : '/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      // Detect email-not-verified errors and show the resend banner
      if (msg.toLowerCase().includes('verif') || msg.toLowerCase().includes('not verified')) {
        setUnverifiedEmail(data.email);
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      await authService.resendVerification(unverifiedEmail);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Could not resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'rgb(var(--bg-base))' }}
    >
      {/* Left side – decorative */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: '#6366f1' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: '#8b5cf6' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Zap size={20} />
            </div>
            <span className="font-bold text-xl">ComplaintEase</span>
          </div>

          <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-indigo-200 mb-10 text-lg leading-relaxed">
            Manage complaints efficiently with our advanced tracking and resolution platform.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📋', text: 'Track all your complaints in one place' },
              { icon: '🔔', text: 'Real-time notifications and updates' },
              { icon: '📊', text: 'Advanced analytics and reporting' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-indigo-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side – form */}
      <div className="flex-1 lg:max-w-lg flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">ComplaintEase</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign in to your account</h1>
            <p className="text-muted text-sm">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'rgb(var(--color-primary))' }} className="font-medium hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="form-group">
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'rgb(var(--color-primary))' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 rounded"
                style={{ accentColor: 'rgb(var(--color-primary))' }}
              />
              <label htmlFor="rememberMe" className="text-sm text-muted cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full btn-lg">
              {isLoading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          {/* Unverified email banner */}
          {unverifiedEmail && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl p-4"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: '#f59e0b' }}>
                ⚠️ Email not verified
              </p>
              <p className="text-xs text-muted mb-3">
                Your account exists but email hasn't been verified. Check your inbox or resend the email.
              </p>
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="btn btn-sm w-full text-xs"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                {resendLoading ? <><RefreshCw size={12} className="animate-spin" /> Sending…</> : <><RefreshCw size={12} /> Resend Verification Email</>}
              </button>
            </motion.div>
          )}

          {/* Demo credentials */}
          <div
            className="mt-6 rounded-xl p-4 text-sm"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <p className="font-medium mb-2" style={{ color: 'rgb(99,102,241)' }}>Demo Credentials:</p>
            <div className="space-y-1 text-muted">
              <p>👑 Admin: admin@complaintease.com / Admin@123456</p>
              <p>🔧 Staff: john.staff@complaintease.com / Staff@123456</p>
              <p>👤 User: bob.wilson@gmail.com / User@123456</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
