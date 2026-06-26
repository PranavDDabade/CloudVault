import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import FileCard from '../components/files/FileCard';
import FilePreview from '../components/files/FilePreview';
import FolderCard from '../components/files/FolderCard';
import MoveModal from '../components/files/MoveModal';
import ShareModal from '../components/sharing/ShareModal';
import Modal from '../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../components/ui/index.jsx';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import toast from 'react-hot-toast';

const Favorites = () => {
  const { openUpload } = useOutletContext() || {};
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [newName, setNewName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        fileService.getFiles({ favorites: 'true' }),
        folderService.getFolders({ favorites: 'true' }),
      ]);
      setFiles(filesRes.data.files || []);
      setFolders(foldersRes.data.folders || []);
    } catch (err) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleFavoriteFile = async (id) => {
    const { data } = await fileService.toggleFavorite(id);
    if (!data.isFavorite) {
      setFiles(prev => prev.filter(f => f._id !== id));
      toast.success('Removed from favorites');
    }
  };

  const handleToggleFavoriteFolder = async (id, isFavorite) => {
    try {
      await folderService.updateFolder(id, { isFavorite });
      setFolders(prev => prev.filter(f => f._id !== id));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleDeleteFile = async (id) => {
    await fileService.deleteFile(id);
    setFiles(prev => prev.filter(f => f._id !== id));
    toast.success('Moved to trash');
  };

  const handleDeleteFolder = async (id) => {
    await folderService.deleteFolder(id);
    setFolders(prev => prev.filter(f => f._id !== id));
    toast.success('Folder moved to trash');
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim() || !renameItem) return;
    try {
      if (renameItem.isFolder) {
        await folderService.updateFolder(renameItem._id, { name: newName });
        setFolders(prev => prev.map(f => f._id === renameItem._id ? { ...f, name: newName } : f));
      } else {
        await fileService.updateFile(renameItem._id, { name: newName });
        setFiles(prev => prev.map(f => f._id === renameItem._id ? { ...f, name: newName } : f));
      }
      setRenameItem(null);
      setNewName('');
      toast.success('Renamed successfully');
    } catch {
      toast.error('Rename failed');
    }
  };

  const handleMoveItem = async (item, destFolderId) => {
    if (item.isFolder) {
      await folderService.updateFolder(item._id, { parentId: destFolderId });
      setFolders(prev => prev.filter(f => f._id !== item._id));
    } else {
      await fileService.updateFile(item._id, { folderId: destFolderId });
      setFiles(prev => prev.filter(f => f._id !== item._id));
    }
  };

  const totalCount = files.length + folders.length;

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
          {totalCount} starred item{totalCount !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          description="Star your most important files or folders to access them quickly from here."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Starred Folders */}
          {folders.length > 0 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Folders</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
                {folders.map(folder => (
                  <FolderCard
                    key={folder._id}
                    folder={folder}
                    onOpen={(id) => toast.success('Open from files page to browse nested contents.')}
                    onDelete={handleDeleteFolder}
                    onRename={(f) => { setRenameItem({ ...f, isFolder: true }); setNewName(f.name); }}
                    onMove={setMoveItem}
                    onToggleFavorite={handleToggleFavoriteFolder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Starred Files */}
          {files.length > 0 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Files</h2>
              <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
                <AnimatePresence>
                  {files.map(file => (
                    <FileCard key={file._id} file={file}
                      onPreview={setPreviewFile}
                      onShare={setShareFile}
                      onToggleFavorite={handleToggleFavoriteFile}
                      onDelete={handleDeleteFile}
                      onRename={(f) => { setRenameItem(f); setNewName(f.name); }}
                      onMove={setMoveItem}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
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

      {/* Move Destination Modal */}
      <MoveModal
        isOpen={!!moveItem}
        onClose={() => setMoveItem(null)}
        item={moveItem}
        onMove={handleMoveItem}
      />

      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)}
        onToggleFavorite={handleToggleFavoriteFile} onShare={setShareFile} />
      <ShareModal file={shareFile} isOpen={!!shareFile} onClose={() => setShareFile(null)} />
    </div>
  );
};

export default Favorites;
