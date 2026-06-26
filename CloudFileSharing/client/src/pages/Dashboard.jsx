import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Files, HardDrive, Share2, Clock, Upload, FolderPlus, Star, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { fileService } from '../services/fileService';
import api from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import { StoragePieChart, UploadTrendChart } from '../components/dashboard/StorageChart';
import { SkeletonCard } from '../components/ui/index.jsx';
import FileCard from '../components/files/FileCard';
import FilePreview from '../components/files/FilePreview';
import ShareModal from '../components/sharing/ShareModal';
import { formatBytes, formatDate } from '../utils/formatters';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { user } = useAuth();
  const { openUpload } = useOutletContext() || {};
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [recentRes, storageRes] = await Promise.all([
          fileService.getRecentFiles(),
          api.get('/users/storage-stats'),
        ]);
        setRecentFiles(recentRes.data.files || []);
        setStorageStats(storageRes.data.stats);
        setStats({
          totalFiles: storageRes.data.stats.totalFiles,
          storageUsed: user?.storageUsed || 0,
          storageLimit: user?.storageLimit || 1,
          trashFiles: storageRes.data.stats.trashFiles,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const storagePercent = stats
    ? Math.round((stats.storageUsed / stats.storageLimit) * 100)
    : 0;

  const STAT_CARDS = [
    {
      title: 'Total Files',
      value: stats?.totalFiles ?? '–',
      subtitle: 'Active files',
      icon: Files,
      gradient: 'linear-gradient(135deg, #7C3AED, #6366F1)',
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats?.storageUsed || 0),
      subtitle: `${storagePercent}% of ${formatBytes(stats?.storageLimit || 0)}`,
      icon: HardDrive,
      gradient: 'linear-gradient(135deg, #06B6D4, #2DD4BF)',
    },
    {
      title: 'In Trash',
      value: stats?.trashFiles ?? '–',
      subtitle: 'Will auto-delete in 30 days',
      icon: Clock,
      gradient: 'linear-gradient(135deg, #EF4444, #EC4899)',
    },
    {
      title: 'Recent Uploads',
      value: recentFiles.length,
      subtitle: 'Last 10 files',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #10B981, #2DD4BF)',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <motion.div
        style={{ marginBottom: 'var(--gap-lg)' }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-page-title" style={{ marginBottom: '8px' }}>
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Here's what's happening with your cloud storage environment.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)'
      }}>
        {loading
          ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
          : STAT_CARDS.map((card, i) => <StatsCard key={card.title} {...card} index={i} />)
        }
      </div>

      {/* Charts + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>
        {/* Storage breakdown */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 style={{
            fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '24px',
          }}>
            Storage Breakdown
          </h2>
          <StoragePieChart data={storageStats?.fileTypeStats || []} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 style={{
            fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '24px',
          }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Upload Files', icon: Upload, gradient: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', action: openUpload },
              { label: 'New Folder', icon: FolderPlus, gradient: 'linear-gradient(135deg, #34D399, #10B981)', action: () => {} },
              { label: 'View Favorites', icon: Star, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', action: () => {} },
              { label: 'Shared with Me', icon: Share2, gradient: 'linear-gradient(135deg, #06B6D4, #2DD4BF)', action: () => {} },
            ].map(({ label, icon: Icon, gradient, action }) => (
              <motion.button
                key={label}
                onClick={action}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: '16px', padding: '0 20px', borderRadius: 'var(--radius-button)', height: '48px' }}
                whileHover={{ x: 6, borderColor: 'rgba(124, 92, 255, 0.2)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color="white" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 style={{
            fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '24px',
          }}>
            Recent Files
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
            {recentFiles.slice(0, 6).map((file) => (
              <FileCard
                key={file._id}
                file={file}
                onPreview={setPreviewFile}
                onShare={setShareFile}
                onToggleFavorite={async (id) => {
                  const { data } = await fileService.toggleFavorite(id);
                  setRecentFiles(prev => prev.map(f => f._id === id ? { ...f, isFavorite: data.isFavorite } : f));
                }}
                onDelete={async (id) => {
                  await fileService.deleteFile(id);
                  setRecentFiles(prev => prev.filter(f => f._id !== id));
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)}
        onToggleFavorite={async (id) => {
          const { data } = await fileService.toggleFavorite(id);
          setRecentFiles(prev => prev.map(f => f._id === id ? { ...f, isFavorite: data.isFavorite } : f));
        }}
        onShare={setShareFile} />
      <ShareModal file={shareFile} isOpen={!!shareFile} onClose={() => setShareFile(null)} />
    </div>
  );
};

export default Dashboard;
