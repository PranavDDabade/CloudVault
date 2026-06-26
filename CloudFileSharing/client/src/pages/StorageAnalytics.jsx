import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, HardDrive, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../utils/formatters';
import { StoragePieChart } from '../components/dashboard/StorageChart';
import { SkeletonCard } from '../components/ui/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const StorageAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await api.get('/files/stats');
        setStats(data.stats);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const totalLimit = user?.storageLimit || 0;
  const totalUsed = user?.storageUsed || 0;
  const storagePercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  
  const totalFiles = stats?.totalFiles || 0;
  const totalTrash = stats?.fileTypes?.find(t => t._id === 'trash')?.count || 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--gap-lg)' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(124, 92, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 className="text-page-title">Storage Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Analyze your cloud storage parameters and metadata breakdown</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Top Cards (Figma style) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>
            {[
              { label: 'Storage Used', value: formatBytes(totalUsed), icon: HardDrive, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
              { label: 'Space Available', value: formatBytes(Math.max(totalLimit - totalUsed, 0)), icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(52,211,153,0.1)' },
              { label: 'Total Files', value: totalFiles.toString(), icon: FileText, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
              { label: 'In Trash', value: totalTrash.toString(), icon: Trash2, color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Storage Quota progress card */}
          <motion.div className="card" style={{ marginBottom: 'var(--gap-lg)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Storage Quota Usage</h2>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{Math.round(storagePercent)}%</span>
            </div>
            <div className="storage-bar" style={{ marginBottom: '12px' }}>
              <div className="storage-bar-fill" style={{ width: `${Math.min(storagePercent, 100)}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatBytes(totalUsed)} used</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatBytes(totalLimit)} total capacity</span>
            </div>
          </motion.div>

          {/* Split Charts & tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--gap-grid)' }}>
            <motion.div className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '24px' }}>Distribution by Type</h2>
              <StoragePieChart data={stats?.fileTypes || []} />
            </motion.div>

            <motion.div className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '24px' }}>File Types Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(stats?.fileTypes || []).map((type, i) => (
                  <div key={type._id || 'other'} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid var(--border)' 
                  }}>
                    <span style={{ fontSize: '14px', color: 'var(--text)', textTransform: 'capitalize', fontWeight: 500 }}>{type._id || 'Other'}</span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{formatBytes(type.totalSize)}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{type.count} files</p>
                    </div>
                  </div>
                ))}
                {(!stats?.fileTypes || stats.fileTypes.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>No file data indexed.</p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default StorageAnalytics;
