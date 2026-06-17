import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Shield, Zap, BarChart3, Bell,
  Users, FileText, Star, ChevronDown, Play, Globe,
  MessageSquare, Clock, TrendingUp, Award, Mail, Phone
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// Counter animation
const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const step = end / (duration * 60);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Fade in section
const FadeIn = ({ children, delay = 0, direction = 'up' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
      x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

const features = [
  { icon: FileText, title: 'Easy Complaint Submission', desc: 'Submit complaints with images, documents, and detailed descriptions in seconds.', color: '#6366f1' },
  { icon: BarChart3, title: 'Real-Time Tracking', desc: 'Monitor complaint status with live updates and detailed activity timelines.', color: '#8b5cf6' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Receive instant email and in-app notifications for every status change.', color: '#ec4899' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT authentication, rate limiting, and role-based access control built-in.', color: '#10b981' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Powerful admin analytics with charts, reports, and performance metrics.', color: '#3b82f6' },
  { icon: MessageSquare, title: 'Two-Way Communication', desc: 'Threaded comments allow direct communication between users and admins.', color: '#f59e0b' },
];

const steps = [
  { num: '01', title: 'Submit a Complaint', desc: 'Fill out a simple form, attach photos, select category and location.' },
  { num: '02', title: 'Instant Notification', desc: 'You receive immediate confirmation and the relevant department is notified.' },
  { num: '03', title: 'Track Progress', desc: 'Monitor real-time status updates as the team works on your complaint.' },
  { num: '04', title: 'Get Resolution', desc: 'Receive notification when resolved and rate your experience.' },
];

const testimonials = [
  { name: 'Sarah Mitchell', role: 'City Administrator', org: 'Metro Municipality', rating: 5, text: 'ComplaintEase transformed how we handle citizen complaints. Resolution time dropped by 65% in just 3 months.' },
  { name: 'Dr. Raj Kumar', role: 'Department Head', org: 'State University', rating: 5, text: 'Outstanding platform. Students can now track their academic issues transparently. Highly recommend!' },
  { name: 'Jennifer Walsh', role: 'Operations Manager', org: 'Tech Corp', rating: 5, text: 'The analytics dashboard gives us incredible insights. We can now spot and fix issues proactively.' },
];

const faqs = [
  { q: 'Is ComplaintEase free to use?', a: 'We offer a free tier for small organizations. Enterprise plans with advanced features are available for larger deployments.' },
  { q: 'Can I upload photos with my complaint?', a: 'Yes! You can attach up to 10 images and documents (PDF, DOC) per complaint, powered by Cloudinary.' },
  { q: 'How long does it take to resolve a complaint?', a: 'Resolution time varies by category and priority. Critical issues are typically addressed within 24 hours.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use JWT authentication, bcrypt password hashing, rate limiting, and MongoDB sanitization.' },
  { q: 'Can I export my complaint data?', a: 'Yes, admins can export complaints as CSV or generate detailed PDF reports with analytics.' },
];

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg-base))' }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: isNavScrolled ? 'rgba(var(--bg-card), 0.95)' : 'transparent',
          backdropFilter: isNavScrolled ? 'blur(20px)' : 'none',
          borderBottom: isNavScrolled ? '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">ComplaintEase</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {['Features', 'How It Works', 'Testimonials', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="btn btn-ghost btn-icon">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden" id="hero">
        {/* Background gradient blobs */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #6366f1, #8b5cf6)' }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #10b981, #3b82f6)' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
                style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <Zap size={14} /> Trusted by 500+ Organizations
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              Complaint Management{' '}
              <span className="gradient-text">Made Simple</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              A professional SaaS platform for municipalities, universities, and enterprises. Submit, track, and resolve complaints with AI-powered categorization and real-time updates.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register" className="btn btn-primary btn-lg">
                Start for Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                View Demo <Play size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-6 mt-10 text-sm text-muted flex-wrap"
            >
              {['No credit card required', 'Free 14-day trial', 'GDPR Compliant'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: '#22c55e' }} /> {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Dashboard Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
                border: '1px solid rgba(99,102,241,0.15)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(var(--bg-card), 0.5)', borderBottom: '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)' }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                <span className="ml-2 text-xs text-muted">ComplaintEase Dashboard</span>
              </div>

              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Complaints', value: '1,247', color: '#6366f1', icon: FileText },
                  { label: 'Resolved', value: '1,089', color: '#22c55e', icon: CheckCircle },
                  { label: 'In Progress', value: '112', color: '#3b82f6', icon: Clock },
                  { label: 'Resolution Rate', value: '87%', color: '#f59e0b', icon: TrendingUp },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(var(--bg-card), 0.6)' }}
                  >
                    <stat.icon size={20} style={{ color: stat.color }} className="mb-2" />
                    <p className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                <div className="rounded-xl p-4" style={{ background: 'rgba(var(--bg-card), 0.6)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Recent Complaints</span>
                    <span className="text-xs text-muted">Live Updates</span>
                  </div>
                  {[
                    { id: 'CE-01052', title: 'Water supply disruption in Block A', status: 'In Progress', priority: 'Critical' },
                    { id: 'CE-01053', title: 'Street lights non-functional in Sector 4', status: 'Assigned', priority: 'High' },
                    { id: 'CE-01054', title: 'Internet connectivity issues in library', status: 'Resolved', priority: 'Medium' },
                  ].map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.3)' }}
                    >
                      <div>
                        <span className="text-xs font-mono text-muted mr-2">{c.id}</span>
                        <span className="text-sm">{c.title}</span>
                      </div>
                      <span
                        className="badge text-xs"
                        style={{
                          background: c.status === 'Resolved' ? 'rgba(34,197,94,0.1)' : c.status === 'In Progress' ? 'rgba(59,130,246,0.1)' : 'rgba(99,102,241,0.1)',
                          color: c.status === 'Resolved' ? '#22c55e' : c.status === 'In Progress' ? '#3b82f6' : '#6366f1',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16" style={{ background: 'rgba(99,102,241,0.04)', borderTop: '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)', borderBottom: '1px solid rgba(var(--border-r), var(--border-g), var(--border-b), 0.5)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: '+', label: 'Organizations' },
              { value: 50000, suffix: '+', label: 'Complaints Resolved' },
              { value: 87, suffix: '%', label: 'Resolution Rate' },
              { value: 24, suffix: 'hrs', label: 'Avg Resolution Time' },
            ].map((stat) => (
              <FadeIn key={stat.label}>
                <p
                  className="text-4xl sm:text-5xl font-bold gradient-text"
                >
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted mt-2">{stat.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Everything you need to{' '}
                <span className="gradient-text">manage complaints</span>
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                A complete suite of tools for both users and administrators.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.1}>
                <motion.div
                  className="card p-6"
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${feature.color}15` }}
                  >
                    <feature.icon size={24} style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ background: 'rgba(99,102,241,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How <span className="gradient-text">It Works</span>
              </h2>
              <p className="text-muted text-lg">Simple 4-step process from complaint to resolution</p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.15}>
                <div className="relative text-center">
                  {i < steps.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5"
                      style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)' }}
                    />
                  )}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: 'rgb(99,102,241)',
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Loved by <span className="gradient-text">Organizations</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="card p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={16} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted">{t.role}, {t.org}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24" style={{ background: 'rgba(99,102,241,0.03)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 0.05}>
                <div className="card overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }}>
                      <ChevronDown size={18} style={{ color: 'rgb(var(--text-muted))' }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p
                          className="px-6 pb-4 text-sm leading-relaxed text-muted"
                          style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
                        >
                          <br />{faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <div
              className="rounded-3xl p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to <span className="gradient-text">Get Started?</span>
              </h2>
              <p className="text-muted mb-8 text-lg">
                Join hundreds of organizations using ComplaintEase to manage and resolve complaints efficiently.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12"
        style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-bold gradient-text">ComplaintEase</span>
              </div>
              <p className="text-sm text-muted">Advanced complaint management for modern organizations.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Security', 'Integrations'].map((item) => (
                  <p key={item} className="text-sm text-muted cursor-pointer hover:text-primary">{item}</p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <div className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <p key={item} className="text-sm text-muted cursor-pointer hover:text-primary">{item}</p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted flex items-center gap-2"><Mail size={13} /> support@complaintease.com</p>
                <p className="text-sm text-muted flex items-center gap-2"><Phone size={13} /> +1-555-0100</p>
                <p className="text-sm text-muted flex items-center gap-2"><Globe size={13} /> www.complaintease.com</p>
              </div>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4"
            style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
          >
            <p className="text-sm text-muted">© 2024 ComplaintEase. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <span key={item} className="text-xs text-muted cursor-pointer hover:text-primary">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
