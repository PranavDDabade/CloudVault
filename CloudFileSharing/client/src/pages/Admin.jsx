import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, BarChart2, Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { Avatar, SkeletonRow } from '../components/ui/index.jsx';
import { formatBytes } from '../utils/formatters';
import toast from 'react-hot-toast';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=20'),
        ]);
        setStats(statsRes.data.stats);
        setUsers(usersRes.data.users || []);
      } catch {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !isActive } : u));
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
    } catch {
      toast.error('Action failed');
    }
  };

  const TABS = [
    { id: 'overview', label: 'Platform Overview', icon: BarChart2 },
    { id: 'users', label: 'Manage Users', icon: Users },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <motion.div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--gap-lg)' }}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} style={{ color: 'var(--error)' }} />
        </div>
        <div>
          <h1 className="text-page-title">Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Platform management, user accounts control, and analytics</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', background: 'var(--bg-elevated)',
        padding: '4px', borderRadius: '12px', border: '1px solid var(--border)',
        marginBottom: 'var(--gap-lg)', width: 'fit-content'
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.3s',
              background: tab === id ? 'var(--surface)' : 'transparent',
              color: tab === id ? 'var(--primary)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview */}
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--gap-grid)' }}>
              {[
                { label: 'Total Users', value: stats?.totalUsers || 0, color: 'var(--primary)' },
                { label: 'Active Users', value: stats?.activeUsers || 0, color: 'var(--success)' },
                { label: 'Total Files', value: stats?.totalFiles || 0, color: '#06B6D4' },
                { label: 'Total Shares', value: stats?.totalShares || 0, color: 'var(--warning)' },
                { label: 'New Users (Month)', value: stats?.newUsersThisMonth || 0, color: '#8B5CF6' },
                { label: 'Files This Week', value: stats?.filesThisWeek || 0, color: '#EC4899' },
                { label: 'Storage Used', value: formatBytes(stats?.storage?.totalUsed || 0), color: 'var(--error)' },
              ].map(({ label, value, color }, i) => (
                <motion.div
                  key={label}
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Users table */}
        {tab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ position: 'relative', marginBottom: 'var(--gap-lg)', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: '48px', height: '44px', borderRadius: 'var(--radius-input)' }} placeholder="Search users by name or email..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="table-container">
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 120px', gap: '16px',
                padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '1px',
                background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)'
              }}>
                <div>User</div><div>Email</div><div>Storage</div><div>Role</div><div>Status</div>
              </div>
              {loading ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />) : (
                users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
                  .map((u, idx) => (
                    <motion.div key={u._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 120px', gap: '16px',
                        padding: '16px 24px', borderBottom: '1px solid var(--border)', alignItems: 'center',
                      }}
                      className="table-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar src={u.avatar} name={u.name} size={32} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{u.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{formatBytes(u.storageUsed || 0)}</span>
                      <span className={`badge badge-${u.role === 'admin' ? 'danger' : 'primary'}`} style={{ width: 'fit-content' }}>{u.role}</span>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => toggleUserStatus(u._id, u.isActive)}
                        style={{
                          background: u.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${u.isActive ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
                          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
                          color: u.isActive ? 'var(--success)' : 'var(--error)',
                          width: 'fit-content',
                          height: '32px'
                        }}>
                        {u.isActive ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {u.isActive ? 'Active' : 'Disabled'}
                      </motion.button>
                    </motion.div>
                  ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
