import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Zap, Mail, Lock, User, UserPlus, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/services';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null); // success state
  const [resendLoading, setResendLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;
    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 4) return { score, label: 'Good', color: '#3b82f6' };
    return { score, label: 'Strong', color: '#22c55e' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
      // Show success state — don't redirect immediately, show email instructions
      setRegisteredEmail(data.email);
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendLoading(true);
    try {
      await authService.resendVerification(registeredEmail);
      toast.success('Verification email resent! Please check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Could not resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Success state: show after registration
  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(var(--bg-base))' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card w-full max-w-md p-10 text-center"
        >
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)' }}>
            <CheckCircle size={40} style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Created! 🎉</h1>
          <p className="text-muted text-sm mb-6">
            We've sent a verification email to:
          </p>
          <div className="rounded-xl p-3 mb-6" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="font-semibold text-sm" style={{ color: 'rgb(99,102,241)' }}>
              📧 {registeredEmail}
            </p>
          </div>
          <p className="text-sm text-muted mb-6">
            Click the verification link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="btn btn-secondary w-full"
            >
              {resendLoading ? <><RefreshCw size={15} className="animate-spin" /> Sending…</> : <><RefreshCw size={15} /> Resend Verification Email</>}
            </button>
            <Link to="/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(var(--bg-base))' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">ComplaintEase</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted text-sm">
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'rgb(var(--color-primary))' }} className="font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="form-group">
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="form-group">
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        background: i <= strength.score ? strength.color : 'rgb(var(--border-r), var(--border-g), var(--border-b))',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strength.label} password</p>
              </div>
            )}
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Repeat your password"
                className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
          </div>

          <p className="text-xs text-muted">
            By creating an account, you agree to our{' '}
            <span style={{ color: 'rgb(var(--color-primary))' }} className="cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span style={{ color: 'rgb(var(--color-primary))' }} className="cursor-pointer">Privacy Policy</span>.
          </p>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full btn-lg">
            {isLoading ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
