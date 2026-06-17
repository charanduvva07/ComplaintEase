import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Lock, Camera, Eye, EyeOff, Save, Bell } from 'lucide-react';
import { userService } from '../../services/services';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, watch, formState: { errors: pwdErrors } } = useForm();
  const newPwd = watch('newPassword', '');

  const updateProfileMutation = useMutation({
    mutationFn: (formData) => userService.updateProfile(formData),
    onSuccess: (data) => {
      toast.success('Profile updated!');
      updateUser(data.user);
      queryClient.invalidateQueries(['profile']);
    },
    onError: (err) => toast.error(err.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      resetPwd();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onProfileSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('phone', data.phone || '');
    if (fileInputRef.current?.files[0]) {
      formData.append('profilePic', fileInputRef.current.files[0]);
    }
    updateProfileMutation.mutate(formData);
  };

  const onPasswordSubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) return toast.error('Passwords do not match');
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted text-sm">Manage your profile and preferences</p>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'rgb(var(--bg-hover))', width: 'fit-content' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'rgb(var(--bg-card))' : 'transparent',
              color: activeTab === tab.id ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
              boxShadow: activeTab === tab.id ? 'var(--shadow)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div className="card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {previewUrl || user?.profilePic?.url ? (
                  <img
                    src={previewUrl || user.profilePic.url}
                    alt={user?.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: getAvatarColor(user?.name) }}
                  >
                    {getInitials(user?.name || '?')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'rgb(99,102,241)' }}
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted">{user?.email}</p>
                <span
                  className="badge mt-1"
                  style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}
                >
                  {user?.role}
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...regProfile('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                    className={`input pl-10 ${profileErrors.name ? 'input-error' : ''}`}
                    placeholder="Full Name"
                  />
                </div>
                {profileErrors.name && <p className="error-text">{profileErrors.name.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...regProfile('phone')}
                    className="input pl-10"
                    placeholder="+1 555 0100"
                  />
                </div>
              </div>

              <div className="form-group sm:col-span-2">
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={user?.email || ''} disabled className="input pl-10 opacity-60" />
                </div>
                <p className="text-xs text-muted mt-1">Email cannot be changed after registration</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Complaints', value: user?.stats?.totalComplaints || 0 },
                { label: 'Resolved', value: user?.stats?.resolvedComplaints || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl text-center" style={{ background: 'rgb(var(--bg-hover))' }}>
                  <p className="text-2xl font-bold gradient-text">{value}</p>
                  <p className="text-xs text-muted mt-1">{label}</p>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn btn-primary w-full"
            >
              <Save size={16} /> {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div className="card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-4">
            <div className="form-group">
              <label className="label">Current Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  {...regPwd('currentPassword', { required: 'Current password is required' })}
                  type={showCurrentPwd ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdErrors.currentPassword && <p className="error-text">{pwdErrors.currentPassword.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  {...regPwd('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                  type={showNewPwd ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdErrors.newPassword && <p className="error-text">{pwdErrors.newPassword.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  {...regPwd('confirmPassword', {
                    required: true,
                    validate: (val) => val === newPwd || 'Passwords do not match',
                  })}
                  type="password"
                  className="input pl-10"
                />
              </div>
              {pwdErrors.confirmPassword && <p className="error-text">{pwdErrors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={changePasswordMutation.isPending} className="btn btn-primary w-full">
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div className="card p-6 space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-semibold mb-2">Notification Preferences</h2>
          {[
            { label: 'Email Notifications', desc: 'Receive email updates for complaint status changes', key: 'emailNotifications' },
            { label: 'Push Notifications', desc: 'Receive in-app notifications in real-time', key: 'pushNotifications' },
          ].map(({ label, desc, key }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgb(var(--bg-hover))' }}>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted mt-0.5">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={user?.preferences?.[key] ?? true}
                  className="sr-only peer"
                  onChange={async (e) => {
                    await userService.updatePreferences({ [key]: e.target.checked });
                    toast.success('Preference saved');
                  }}
                />
                <div className="w-10 h-6 rounded-full peer peer-checked:bg-indigo-500 transition-all"
                  style={{ background: 'rgb(var(--border-r), var(--border-g), var(--border-b))' }}
                >
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all peer-checked:translate-x-4" />
                </div>
              </label>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
