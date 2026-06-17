import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Sun, Moon, Menu, X, Search, ChevronDown,
  User, Settings, LogOut, Shield, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/services';
import { timeAgo, getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuClick, isSidebarOpen }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { onEvent } = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userService.getNotifications({ limit: 8 }),
    refetchInterval: 60000,
    enabled: !!user,
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  // Listen for real-time notifications
  useEffect(() => {
    const cleanup = onEvent('notification:new', ({ notification }) => {
      refetchNotifs();
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="card flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => toast.dismiss(t.id)}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Bell size={16} style={{ color: 'rgb(99,102,241)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{notification.title}</p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{notification.message}</p>
          </div>
        </motion.div>
      ), { duration: 5000, position: 'top-right' });
    });
    return cleanup;
  }, [onEvent, refetchNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await userService.markAllNotificationsRead();
    queryClient.invalidateQueries(['notifications']);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getNotifIcon = (type) => {
    const icons = {
      complaint_submitted: '📋',
      complaint_assigned: '👤',
      status_changed: '🔄',
      complaint_resolved: '✅',
      new_comment: '💬',
      admin_reply: '🔔',
      system: '⚙️',
    };
    return icons[type] || '🔔';
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 h-16"
      style={{
        background: 'rgba(var(--bg-card), 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-icon lg:hidden"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(139,92,246))' }}>
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">ComplaintEase</span>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn btn-ghost btn-icon" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="btn btn-ghost btn-icon relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
                  style={{ background: 'rgb(239,68,68)' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 card overflow-hidden"
                  style={{ boxShadow: 'var(--shadow-xl)' }}
                >
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}>
                    <h3 className="font-semibold text-sm">Notifications {unreadCount > 0 && `(${unreadCount} new)`}</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs" style={{ color: 'rgb(var(--color-primary))' }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell size={24} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-2" />
                        <p className="text-sm text-muted">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className="flex gap-3 px-4 py-3 cursor-pointer"
                          style={{
                            background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                            borderBottom: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))',
                          }}
                          onClick={() => {
                            if (n.link) navigate(n.link);
                            setShowNotifications(false);
                          }}
                        >
                          <span className="text-lg flex-shrink-0">{getNotifIcon(n.type)}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-muted truncate">{n.message}</p>
                            <p className="text-xs text-muted mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'rgb(99,102,241)' }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-center justify-center py-3 text-sm font-medium"
                    style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))', color: 'rgb(var(--color-primary))' }}
                  >
                    View all notifications
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile dropdown */}
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-2 btn btn-ghost px-2 py-1"
            >
              {user.profilePic?.url ? (
                <img src={user.profilePic.url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: getAvatarColor(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">{user.name}</span>
              <ChevronDown size={14} style={{ color: 'rgb(var(--text-muted))' }} />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 card overflow-hidden"
                  style={{ boxShadow: 'var(--shadow-xl)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}>
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                    <span
                      className="badge mt-1 text-xs"
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        color: 'rgb(99,102,241)',
                      }}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link to="/profile" onClick={() => setShowProfile(false)} className="sidebar-link">
                      <User size={16} /> My Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setShowProfile(false)} className="sidebar-link">
                        <Shield size={16} /> Admin Panel
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setShowProfile(false)} className="sidebar-link">
                      <Settings size={16} /> Settings
                    </Link>
                  </div>

                  <div className="py-1" style={{ borderTop: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}>
                    <button onClick={handleLogout} className="sidebar-link w-full" style={{ color: 'rgb(239,68,68)' }}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
