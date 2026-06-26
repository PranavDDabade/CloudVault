import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, HardDrive, Trash2, FileText, Star, Share2,
  FolderOpen, Download, Eye, RefreshCw, TrendingUp,
  Upload, Clock, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatDate, formatCount } from '../utils/formatters';
import { StoragePieChart, UploadTrendChart, StorageTypeBar, TopFilesBarChart } from '../components/dashboard/StorageChart';
import { SkeletonCard } from '../components/ui/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

// â”€â”€ Activity icon + color map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ACTION_META = {
  upload:          { icon: Upload,    color: '#34D399', label: 'Uploaded' },
  download:        { icon: Download,  color: '#06B6D4', label: 'Downloaded' },
  delete:          { icon: Trash2,    color: '#EF4444', label: 'Moved to Trash' },
  restore:         { icon: RefreshCw, color: '#F59E0B', label: 'Restored' },
  permanent_delete:{ icon: Trash2,    color: '#DC2626', label: 'Deleted Forever' },
  rename:          { icon: FileText,  color: '#8B5CF6', label: 'Renamed' },
  move:            { icon: FolderOpen,color: '#7C5CFF', label: 'Moved' },
  copy:            { icon: FileText,  color: '#06B6D4', label: 'Duplicated' },
  share:           { icon: Share2,    color: '#3B82F6', label: 'Shared' },
  favorite:        { icon: Star,      color: '#F59E0B', label: 'Starred' },
  create_folder:   { icon: FolderOpen,color: '#34D399', label: 'Folder Created' },
  login:           { icon: Activity,  color: '#94A3B8', label: 'Logged In' },
};

// â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatCard = ({ label, value, icon: Icon, color, bg, delay = 0, sub }) => (
  <motion.div
    className="card"
    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
    <div>
      <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  </motion.div>
);

// â”€â”€ Section Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SectionHeader = ({ icon: Icon, title, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={15} style={{ color }} />
    </div>
    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
  </div>
);

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StorageAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/files/stats');
      setStats(data.stats);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const totalLimit   = user?.storageLimit || 0;
  const totalUsed    = user?.storageUsed  || 0;
  const freeSpace    = Math.max(totalLimit - totalUsed, 0);
  const storagePercent = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;
  const barColor = storagePercent > 90 ? 'var(--error)' : storagePercent > 70 ? 'var(--warning)' : 'var(--primary)';

  const maxTypeSize = stats?.fileTypes?.length ? Math.max(...stats.fileTypes.map(t => t.totalSize)) : 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* â”€â”€ Page Header â”€â”€ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--gap-lg)', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-page-title">Storage Analytics</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
              Detailed breakdown of your cloud vault
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="btn btn-secondary btn-sm"
          style={{ height: '38px', borderRadius: 'var(--radius-button)', gap: '8px' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spinSlow 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshingâ€¦' : 'Refresh'}
        </motion.button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* â”€â”€ Row 1: 6 Stat Cards â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>
            <StatCard label="Storage Used"   value={formatBytes(totalUsed)}          icon={HardDrive}  color="#3B82F6" bg="rgba(59,130,246,0.1)"   delay={0}    sub={`of ${formatBytes(totalLimit)}`} />
            <StatCard label="Free Space"     value={formatBytes(freeSpace)}          icon={HardDrive}  color="#34D399" bg="rgba(52,211,153,0.1)"   delay={0.04} />
            <StatCard label="Total Files"    value={String(stats?.totalFiles ?? 0)}  icon={FileText}   color="#06B6D4" bg="rgba(6,182,212,0.1)"    delay={0.08} sub={`${stats?.folderCount ?? 0} folder${stats?.folderCount !== 1 ? 's' : ''}`} />
            <StatCard label="In Trash"       value={String(stats?.trashCount ?? 0)} icon={Trash2}     color="#EF4444" bg="rgba(239,68,68,0.1)"    delay={0.12} />
            <StatCard label="Favorites"      value={String(stats?.favoritesCount ?? 0)} icon={Star}   color="#F59E0B" bg="rgba(245,158,11,0.1)"   delay={0.16} />
            <StatCard label="Total Downloads" value={formatCount(stats?.totalDownloads ?? 0)} icon={Download} color="#8B5CF6" bg="rgba(139,92,246,0.1)" delay={0.2} sub={`${formatCount(stats?.totalViews ?? 0)} views`} />
          </div>

          {/* â”€â”€ Storage Quota Bar â”€â”€ */}
          <motion.div className="card" style={{ marginBottom: 'var(--gap-lg)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <SectionHeader icon={HardDrive} title="Storage Quota" color="#3B82F6" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatBytes(totalUsed)} used of {formatBytes(totalLimit)}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: barColor }}>{Math.round(storagePercent)}%</span>
            </div>
            <div style={{ height: '10px', borderRadius: '6px', background: 'var(--surface-3)', overflow: 'hidden', marginBottom: '8px' }}>
              <motion.div
                style={{ height: '100%', borderRadius: '6px', background: `linear-gradient(90deg, var(--primary), ${barColor})` }}
                initial={{ width: 0 }}
                animate={{ width: `${storagePercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Free: {formatBytes(freeSpace)}</span>
              {storagePercent > 80 && (
                <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>
                  âš  Running low on space
                </span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Plan: {user?.plan || 'free'}</span>
            </div>
          </motion.div>

          {/* â”€â”€ Row 2: Upload Trend + Type Distribution â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>

            {/* Upload Trend Chart */}
            <motion.div className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
              <SectionHeader icon={TrendingUp} title="Upload Activity â€” Last 30 Days" color="var(--primary)" />
              <UploadTrendChart data={stats?.uploadTrend || []} />
            </motion.div>

            {/* Donut chart */}
            <motion.div className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <SectionHeader icon={BarChart3} title="Distribution by Type" color="#06B6D4" />
              <StoragePieChart data={stats?.fileTypes || []} />
            </motion.div>
          </div>

          {/* â”€â”€ Row 3: Type Breakdown Bar List â”€â”€ */}
          <motion.div className="card" style={{ marginBottom: 'var(--gap-lg)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <SectionHeader icon={FileText} title="Storage Breakdown by File Type" color="#34D399" />
            {stats?.fileTypes?.length > 0 ? (
              stats.fileTypes.map(t => (
                <StorageTypeBar
                  key={t._id || 'other'}
                  type={t._id || 'other'}
                  totalSize={t.totalSize}
                  count={t.count}
                  maxSize={maxTypeSize}
                />
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '32px' }}>
                No file data yet. Upload files to see the breakdown.
              </p>
            )}
          </motion.div>

          {/* â”€â”€ Row 4: Top Downloads + Top Viewed â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>

            <motion.div className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <SectionHeader icon={Download} title="Most Downloaded Files" color="#8B5CF6" />
              <TopFilesBarChart
                data={stats?.topDownloaded || []}
                dataKey="downloadCount"
                label="downloads"
                color="#8B5CF6"
              />
              {(!stats?.topDownloaded?.length) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
                  Download files to see them ranked here.
                </p>
              )}
            </motion.div>

            <motion.div className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
              <SectionHeader icon={Eye} title="Most Viewed Files" color="#06B6D4" />
              <TopFilesBarChart
                data={stats?.topViewed || []}
                dataKey="viewCount"
                label="views"
                color="#06B6D4"
              />
              {(!stats?.topViewed?.length) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
                  Preview files to see them ranked here.
                </p>
              )}
            </motion.div>
          </div>

          {/* â”€â”€ Row 5: Recent Activity Timeline â”€â”€ */}
          <motion.div className="card"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
            <SectionHeader icon={Clock} title="Recent Activity" color="#F59E0B" />

            {stats?.recentActivity?.length > 0 ? (
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                {/* Vertical timeline line */}
                <div style={{ position: 'absolute', left: '8px', top: '6px', bottom: '6px', width: '2px', background: 'var(--border)', borderRadius: '2px' }} />

                {stats.recentActivity.map((log, i) => {
                  const meta = ACTION_META[log.action] || { icon: Activity, color: '#94A3B8', label: log.action };
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.46 + i * 0.04 }}
                      style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px', position: 'relative' }}
                    >
                      {/* Dot on timeline */}
                      <div style={{
                        position: 'absolute', left: '-20px', top: '4px',
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: meta.color, border: '2px solid var(--bg)',
                        flexShrink: 0, zIndex: 1,
                      }} />

                      {/* Icon badge */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} style={{ color: meta.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                          {meta.label}
                          {log.resourceName && (
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> â€” {log.resourceName}</span>
                          )}
                        </p>
                        {log.description && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{log.description}</p>
                        )}
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(log.createdAt)}</p>
                      </div>

                      {/* Resource type badge */}
                      {log.resourceType && (
                        <span className="badge badge-primary" style={{ fontSize: '10px', height: '20px', flexShrink: 0, textTransform: 'capitalize' }}>
                          {log.resourceType}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <Activity size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p>No recent activity recorded yet.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};


export default StorageAnalytics;

