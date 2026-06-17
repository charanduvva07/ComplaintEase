import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layout (always loaded – needed immediately)
import DashboardLayout from './components/layout/DashboardLayout';

// Code-split all page components
const LandingPage         = lazy(() => import('./pages/LandingPage'));
const LoginPage           = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage        = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage  = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('./pages/auth/ResetPasswordPage'));

const UserDashboard       = lazy(() => import('./pages/user/UserDashboard'));
const SubmitComplaint     = lazy(() => import('./pages/user/SubmitComplaint'));
const ComplaintDetail     = lazy(() => import('./pages/user/ComplaintDetail'));
const MyComplaints        = lazy(() => import('./pages/user/MyComplaints'));
const ProfilePage         = lazy(() => import('./pages/user/ProfilePage'));

const StaffDashboard      = lazy(() => import('./pages/staff/StaffDashboard'));
const StaffComplaints     = lazy(() => import('./pages/staff/StaffComplaints'));
const StaffComplaintDetail = lazy(() => import('./pages/staff/StaffComplaintDetail'));

const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminComplaints     = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminUsers          = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics      = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminReports        = lazy(() => import('./pages/admin/AdminReports'));
const AdminDepartments    = lazy(() => import('./pages/admin/AdminDepartments'));
const AdminAuditLogs      = lazy(() => import('./pages/admin/AdminAuditLogs'));

// ─── Query Client ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime:    1000 * 60 * 10,       // 10 minutes  
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Toast styles (themed) ─────────────────────────────────────────────
const toastStyles = {
  style: {
    background: 'var(--toast-bg, #1e2738)',
    color: '#f1f5f9',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    padding: '12px 16px',
  },
  success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
  error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
  loading: { iconTheme: { primary: '#6366f1', secondary: 'white' } },
  duration: 4000,
};

// ─── Global page loader ────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center flex-col gap-4"
    style={{ background: 'rgb(var(--bg-base))' }}>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-bg">
      <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <p className="text-sm text-muted">Loading...</p>
  </div>
);

// ─── 404 Page ─────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center flex-col gap-6 text-center px-4"
    style={{ background: 'rgb(var(--bg-base))' }}>
    <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl"
      style={{ background: 'rgba(99,102,241,0.1)' }}>
      🔍
    </div>
    <div>
      <h1 className="text-6xl font-black gradient-text mb-3">404</h1>
      <p className="text-xl font-semibold mb-2">Page Not Found</p>
      <p className="text-muted text-sm max-w-xs mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
    <div className="flex gap-3">
      <a href="/" className="btn btn-primary btn-lg">← Go Home</a>
      <a href="/dashboard" className="btn btn-secondary btn-lg">Dashboard</a>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Toaster position="top-right" toastOptions={toastStyles} />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/"                       element={<LandingPage />} />
                  <Route path="/login"                  element={<LoginPage />} />
                  <Route path="/register"               element={<RegisterPage />} />
                  <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token"  element={<ResetPasswordPage />} />

                  {/* User Routes */}
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard"            element={<UserDashboard />} />
                    <Route path="/complaints"            element={<MyComplaints />} />
                    <Route path="/complaints/new"        element={<SubmitComplaint />} />
                    <Route path="/complaints/:id"        element={<ComplaintDetail />} />
                    <Route path="/profile"              element={<ProfilePage />} />
                  </Route>

                  {/* Staff Routes */}
                  <Route element={<DashboardLayout requireStaff={true} />}>
                    <Route path="/staff"                element={<StaffDashboard />} />
                    <Route path="/staff/complaints"     element={<StaffComplaints />} />
                    <Route path="/staff/complaints/:id" element={<StaffComplaintDetail />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<DashboardLayout requireAdmin={true} />}>
                    <Route path="/admin"                element={<AdminDashboard />} />
                    <Route path="/admin/complaints"     element={<AdminComplaints />} />
                    <Route path="/admin/users"          element={<AdminUsers />} />
                    <Route path="/admin/analytics"      element={<AdminAnalytics />} />
                    <Route path="/admin/reports"        element={<AdminReports />} />
                    <Route path="/admin/departments"    element={<AdminDepartments />} />
                    <Route path="/admin/audit-logs"     element={<AdminAuditLogs />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
