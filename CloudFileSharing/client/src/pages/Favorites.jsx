import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import FileCard from '../components/files/FileCard';
import FilePreview from '../components/files/FilePreview';
import ShareModal from '../components/sharing/ShareModal';
import { EmptyState, SkeletonCard } from '../components/ui/index.jsx';
import { fileService } from '../services/fileService';
import toast from 'react-hot-toast';

const Favorites = () => {
  const { openUpload } = useOutletContext() || {};
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fileService.getFiles({ favorites: 'true' });
        setFiles(data.files || []);
      } catch (err) {
        toast.error('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleFavorite = async (id) => {
    const { data } = await fileService.toggleFavorite(id);
    if (!data.isFavorite) {
      setFiles(prev => prev.filter(f => f._id !== id));
      toast.success('Removed from favorites');
    }
  };

  const handleDelete = async (id) => {
    await fileService.deleteFile(id);
    setFiles(prev => prev.filter(f => f._id !== id));
    toast.success('Moved to trash');
  };

  return (
    <div>
      <motion.div style={{ marginBottom: 'var(--gap-lg)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={20} style={{ color: 'var(--warning)' }} fill="var(--warning)" />
          </div>
          <h1 className="text-page-title">Favorites</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {files.length} starred file{files.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          description="Star your most important files to access them quickly from here."
          action={
            <motion.button className="btn btn-primary" onClick={openUpload}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              <Upload size={16} /> Upload a file
            </motion.button>
          }
        />
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
          <AnimatePresence>
            {files.map(file => (
              <FileCard key={file._id} file={file}
                onPreview={setPreviewFile}
                onShare={setShareFile}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)}
        onToggleFavorite={handleToggleFavorite} onShare={setShareFile} />
      <ShareModal file={shareFile} isOpen={!!shareFile} onClose={() => setShareFile(null)} />
    </div>
  );
};

export default Favorites;
