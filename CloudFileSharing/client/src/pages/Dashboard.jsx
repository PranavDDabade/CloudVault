import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import {
  Files, HardDrive, Share2, Clock, Upload, FolderPlus, Star, TrendingUp, Folder
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import api from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import { StoragePieChart, UploadTrendChart } from '../components/dashboard/StorageChart';
import { SkeletonCard } from '../components/ui/index.jsx';
import FileCard from '../components/files/FileCard';
import FolderCard from '../components/files/FolderCard';
const FilePreview = lazy(() => import('../components/files/FilePreview'));
const ShareModal = lazy(() => import('../components/sharing/ShareModal'));
import Modal from '../components/ui/Modal';
import { formatBytes, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openUpload } = useOutletContext() || {};
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  
  // Dashboard Rename Modal support
  const [renameItem, setRenameItem] = useState(null);
  const [newName, setNewName] = useState('');

  const load = async () => {
    try {
      const [recentRes, storageRes, recentFoldersRes] = await Promise.all([
        fileService.getRecentFiles(),
        api.get('/users/storage-stats'),
        folderService.getFolders({ limit: 4, sort: '-createdAt' }),
      ]);
      setRecentFiles(recentRes.data.files || []);
      setRecentFolders(recentFoldersRes.data.folders || []);
      setStorageStats(storageRes.data.stats);
      setStats({
        totalFiles: storageRes.data.stats.totalFiles,
        storageUsed: user?.storageUsed || 0,
        storageLimit: user?.storageLimit || 1,
        trashFiles: storageRes.data.stats.trashFiles,
        totalFolders: storageRes.data.stats.totalFolders || 0,
        trashFolders: storageRes.data.stats.trashFolders || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleRenameSubmit = async () => {
    if (!newName.trim() || !renameItem) return;
    try {
      if (renameItem.isFolder) {
        await folderService.updateFolder(renameItem._id, { name: newName });
        setRecentFolders(prev => prev.map(f => f._id === renameItem._id ? { ...f, name: newName } : f));
      } else {
        await fileService.updateFile(renameItem._id, { name: newName });
        setRecentFiles(prev => prev.map(f => f._id === renameItem._id ? { ...f, name: newName } : f));
      }
      setRenameItem(null);
      setNewName('');
      toast.success('Renamed successfully');
    } catch {
      toast.error('Rename failed');
    }
  };

  const storagePercent = stats
    ? Math.round((stats.storageUsed / stats.storageLimit) * 100)
    : 0;

  const handleDeleteFolder = useCallback(async (id) => {
    await folderService.deleteFolder(id);
    setRecentFolders(prev => prev.filter(f => f._id !== id));
  }, []);

  const handleRenameFolder = useCallback((f) => {
    setRenameItem({ ...f, isFolder: true });
    setNewName(f.name);
  }, []);

  const handleToggleFavFolder = useCallback(async (id, isFavorite) => {
    await folderService.updateFolder(id, { isFavorite });
    setRecentFolders(prev => prev.map(f => f._id === id ? { ...f, isFavorite } : f));
  }, []);

  const handleOpenFolder = useCallback((id) => navigate('/dashboard/files'), [navigate]);

  const handleToggleFavFile = useCallback(async (id) => {
    const { data } = await fileService.toggleFavorite(id);
    setRecentFiles(prev => prev.map(f => f._id === id ? { ...f, isFavorite: data.isFavorite } : f));
  }, []);

  const handleDeleteFile = useCallback(async (id) => {
    await fileService.deleteFile(id);
    setRecentFiles(prev => prev.filter(f => f._id !== id));
  }, []);

  const handleRenameFile = useCallback((f) => {
    setRenameItem(f);
    setNewName(f.name);
  }, []);

  const STAT_CARDS = [
    {
      title: 'Total Files',
      value: stats?.totalFiles ?? '–',
      subtitle: 'Active files',
      icon: Files,
      gradient: 'linear-gradient(135deg, #7C3AED, #6366F1)',
    },
    {
      title: 'Total Folders',
      value: stats?.totalFolders ?? '–',
      subtitle: 'Active folders',
      icon: Folder,
      gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
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
      value: (stats?.trashFiles ?? 0) + (stats?.trashFolders ?? 0),
      subtitle: 'Files and folders',
      icon: Clock,
      gradient: 'linear-gradient(135deg, #EF4444, #F59E0B)',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 className="text-page-title" style={{ marginBottom: '8px' }}>
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Here's what's happening with your cloud storage environment.
        </p>
      </div>

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-lg)' }}>
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
              { label: 'New Folder', icon: FolderPlus, gradient: 'linear-gradient(135deg, #34D399, #10B981)', action: () => navigate('/dashboard/files', { state: { openNewFolder: true } }) },
              { label: 'View Favorites', icon: Star, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', action: () => navigate('/dashboard/favorites') },
              { label: 'Shared with Me', icon: Share2, gradient: 'linear-gradient(135deg, #06B6D4, #2DD4BF)', action: () => navigate('/dashboard/shared') },
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

      {/* Recent Folders */}
      {recentFolders.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ marginBottom: 'var(--gap-lg)' }}
        >
          <h2 style={{
            fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '24px',
          }}>
            Recent Folders
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
            {recentFolders.map((folder) => (
              <FolderCard
                key={folder._id}
                folder={folder}
                onOpen={handleOpenFolder}
                onDelete={handleDeleteFolder}
                onRename={handleRenameFolder}
                onToggleFavorite={handleToggleFavFolder}
              />
            ))}
          </div>
        </motion.div>
      )}

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
                onToggleFavorite={handleToggleFavFile}
                onDelete={handleDeleteFile}
                onRename={handleRenameFile}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Rename Modal */}
      <Modal isOpen={!!renameItem} onClose={() => setRenameItem(null)} title={renameItem?.isFolder ? "Rename Folder" : "Rename File"} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input"
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
            placeholder="Name"
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setRenameItem(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRenameSubmit} style={{ height: '40px', borderRadius: 'var(--radius-button)' }}>Rename</button>
          </div>
        </div>
      </Modal>

      {/* Modals */}
      {!!previewFile && (
        <Suspense fallback={null}>
          <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)}
            onToggleFavorite={async (id) => {
              const { data } = await fileService.toggleFavorite(id);
              setRecentFiles(prev => prev.map(f => f._id === id ? { ...f, isFavorite: data.isFavorite } : f));
            }}
            onShare={setShareFile} />
        </Suspense>
      )}
      {!!shareFile && (
        <Suspense fallback={null}>
          <ShareModal file={shareFile} isOpen={!!shareFile} onClose={() => setShareFile(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default Dashboard;
