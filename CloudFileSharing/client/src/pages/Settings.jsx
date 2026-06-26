import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Bell, Shield, Trash2, Eye, ShieldCheck, Key } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await api.delete('/users/account', { data: { password: deletePassword } });
      toast.success('Account deactivated.');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const TABS = [
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Privacy & Sessions', icon: Shield },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <motion.div style={{ marginBottom: 'var(--gap-lg)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-page-title" style={{ marginBottom: '8px' }}>Preferences</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Customize your cloud layout, notification webhooks, and storage settings.</p>
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
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? (id === 'danger' ? 'var(--error)' : 'var(--primary)') : 'var(--text-secondary)',
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
            
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                className="card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  {isDark ? <Moon size={20} style={{ color: 'var(--primary)' }} /> : <Sun size={20} style={{ color: 'var(--warning)' }} />}
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Appearance</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Dark Theme</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Toggle between dark navy and light interface themes.</p>
                  </div>
                  
                  {/* Switch */}
                  <button
                    onClick={toggleTheme}
                    style={{
                      width: '48px', height: '26px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                      background: isDark ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s', position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px',
                      left: isDark ? '25px' : '3px', transition: 'left 0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                className="card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <Bell size={20} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Notification Alerts</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { id: 'notif-email', label: 'Email Notifications', desc: 'Receive email alerts for shared file downloads and activities.' },
                    { id: 'notif-upload', label: 'Upload Notifications', desc: 'Notify via system popup when background file uploads finish.' }
                  ].map(({ id, label, desc }) => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{label}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Security/Sessions Tab */}
            {activeTab === 'security' && (
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
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Privacy & Security</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Two-Factor Authentication</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Secure login using an authenticator app code.</p>
                    </div>
                    <span className="badge badge-warning">Coming Soon</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Active Login Sessions</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your browser sessions and signed-in devices.</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-button)', height: '36px' }}>View sessions</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                className="card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <Key size={20} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Developer API Keys</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Integrate CloudVault SDK</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: 1.6 }}>Generate private endpoints and API key tokens to interact with your secure cloud vaults programmatically.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-button)', height: '38px', marginTop: '8px' }}>Generate API Key</button>
                </div>
              </motion.div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <motion.div
                key="danger"
                className="card"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                  <Trash2 size={20} style={{ color: 'var(--error)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--error)' }}>Danger Zone</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Delete CloudVault Account</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>Permanently deactivates your subscription, credentials, keys, and deletes all hosted files in your storage buckets.</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(true)} style={{ borderRadius: 'var(--radius-button)', height: '36px' }}>
                    Deactivate
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Delete confirm modal */}
      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Deactivate Account?" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            This will **permanently delete** your CloudVault account, storage profile, and all shared links. Enter password to confirm deactivation.
          </p>
          <input
            type="password"
            className="input"
            placeholder="Account password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting || !deletePassword} style={{ height: '40px', borderRadius: 'var(--radius-button)' }}>
              {deleting ? 'Deactivating...' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
