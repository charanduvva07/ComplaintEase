import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, PlusCircle, User, Bell,
  BarChart3, Users, Settings, Building2, ClipboardList,
  FileBarChart, X, ChevronRight, Zap, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/complaints/new', icon: PlusCircle, label: 'New Complaint' },
  { to: '/complaints', icon: FileText, label: 'My Complaints' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/complaints', icon: ClipboardList, label: 'Complaints' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/audit-logs', icon: Activity, label: 'Audit Logs' },
];

const staffLinks = [
  { to: '/staff', icon: LayoutDashboard, label: 'Staff Dashboard', end: true },
  { to: '/staff/complaints', icon: ClipboardList, label: 'My Assignments' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const isStaffOnly = user?.role === 'staff';

  let links = userLinks;
  if (isAdmin) {
    links = [...adminLinks, { divider: true }, ...userLinks.slice(2)];
  } else if (isStaffOnly) {
    links = [...staffLinks, { divider: true }, ...userLinks.slice(2)];
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center justify-between p-4 mb-2"
        style={{ borderBottom: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(139,92,246))' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-base gradient-text">ComplaintEase</span>
            <p className="text-xs text-muted">
              {isAdmin ? 'Admin Panel' : isStaffOnly ? 'Staff Portal' : 'User Portal'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-icon lg:hidden">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar">
        <div className="space-y-1">
          {links.map((link, idx) => {
            if (link.divider) {
              return (
                <div key={idx} className="my-3 px-1">
                  <hr className="divider" />
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-3 mb-1 px-2">User</p>
                </div>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon size={18} className="flex-shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    {isActive && <ChevronRight size={14} />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User card at bottom */}
      {user && (
        <div className="p-3" style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgb(var(--bg-hover))' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(139,92,246))' }}
            >
              {user.profilePic?.url ? (
                <img src={user.profilePic.url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
        style={{
          background: 'rgb(var(--bg-card))',
          borderRight: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden flex flex-col"
              style={{ background: 'rgb(var(--bg-card))' }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
