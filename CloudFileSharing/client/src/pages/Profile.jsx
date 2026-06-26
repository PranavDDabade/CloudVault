import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Save, Lock, Eye, EyeOff, HardDrive, User, Mail, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatBytes } from '../utils/formatters';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const fileRef = useRef(null);

  const { register: profileReg, handleSubmit: profileSubmit } = useForm({
    defaultValues: { name: user?.name || '' },
  });
  const { register: passReg, handleSubmit: passSubmit, reset: resetPass, watch } = useForm();
  const newPassword = watch('newPassword');

  const onProfileSave = async (data) => {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', data);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordChange = async (data) => {
    setSaving(true);
    try {
      await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully!');
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar: res.data.avatar });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar.');
    }
  };

  const storagePercent = user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0;

  const TABS = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'storage', label: 'Storage Breakdown', icon: HardDrive },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <motion.div style={{ marginBottom: 'var(--gap-lg)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-page-title" style={{ marginBottom: '8px' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Configure your personal preferences, details, and security parameters.</p>
      </motion.div>

      {/* Sidebar Layout for Settings pages */}
      <div style={{ display: 'flex', gap: 'var(--gap-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Local sidebar navigation */}
        <div style={{
          width: '240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)',
                }}
                className={isActive ? '' : 'hover:text-white'}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <motion.div
                key="profile"
                className="card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Avatar upload */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px',
                  paddingBottom: '32px', borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      padding: '4px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))'
                    }}>
                      <div style={{ borderRadius: '50%', border: '4px solid var(--surface)', overflow: 'hidden', display: 'flex' }}>
                        <Avatar src={user?.avatar} name={user?.name} size={80} />
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileRef.current?.click()}
                      style={{
                        position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px',
                        borderRadius: '50%', background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                        border: '3px solid var(--surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      <Camera size={14} color="white" />
                    </motion.button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{user?.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{user?.email}</p>
                    <span className="badge badge-primary">
                      {user?.plan || 'Free'} Plan
                    </span>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={profileSubmit(onProfileSave)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input className="input" style={{ paddingLeft: '48px' }} {...profileReg('name')} placeholder="Your name" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input className="input" style={{ paddingLeft: '48px', opacity: 0.6 }} value={user?.email || ''} disabled />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email address cannot be changed.</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 'var(--radius-button)' }}>
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security Tab */}
            {tab === 'security' && (
              <motion.div
                key="security"
                className="card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <Shield size={20} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Change Password</h2>
                </div>

                <form onSubmit={passSubmit(onPasswordChange)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { name: 'currentPassword', label: 'Current Password', show: showCurrentPass, toggle: () => setShowCurrentPass(!showCurrentPass) },
                    { name: 'newPassword', label: 'New Password', show: showNewPass, toggle: () => setShowNewPass(!showNewPass), minLen: 8 },
                    { name: 'confirmPassword', label: 'Confirm Password', show: false, validate: v => v === newPassword || 'Passwords do not match' },
                  ].map(({ name, label, show, toggle, minLen, validate }) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type={show ? 'text' : 'password'} className="input" style={{ paddingLeft: '48px', paddingRight: toggle ? '48px' : '16px' }}
                          {...passReg(name, { required: `${label} is required`, ...(minLen ? { minLength: { value: minLen, message: `Min ${minLen} characters` } } : {}), ...(validate ? { validate } : {}) })} />
                        {toggle && (
                          <button type="button" onClick={toggle} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            {show ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 'var(--radius-button)' }}>
                      <Lock size={16} /> {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Storage Tab */}
            {tab === 'storage' && (
              <motion.div
                key="storage"
                className="card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <HardDrive size={20} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Storage Allocation</h2>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 600 }}>
                      {formatBytes(user?.storageUsed || 0)} Used
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      of {formatBytes(user?.storageLimit || 0)} total ({storagePercent}%)
                    </span>
                  </div>
                  <div className="storage-bar" style={{ height: '10px' }}>
                    <div className={`storage-bar-fill ${storagePercent >= 80 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(storagePercent, 100)}%` }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Tier Plan', value: `${user?.plan || 'Free'} Tier`, icon: User, color: 'var(--primary)' },
                    { label: 'Volume Limit', value: formatBytes(user?.storageLimit || 0), icon: HardDrive, color: 'var(--success)' },
                    { label: 'Space Available', value: formatBytes((user?.storageLimit || 0) - (user?.storageUsed || 0)), icon: Shield, color: '#60A5FA' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Icon size={14} style={{ color }} />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
                      </div>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Profile;
