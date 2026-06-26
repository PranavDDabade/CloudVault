import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, List, FolderPlus, Upload, FolderOpen } from 'lucide-react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useFiles } from '../hooks/useFiles';
import { useDebounceValue } from '../hooks/useDebounce';
import FileCard from '../components/files/FileCard';
import FileList from '../components/files/FileList';
import FilePreview from '../components/files/FilePreview';
import ShareModal from '../components/sharing/ShareModal';
import Modal from '../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../components/ui/index.jsx';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { FILE_TYPE_FILTERS } from '../utils/fileIcons';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { label: 'Newest First', value: '-createdAt' },
  { label: 'Oldest First', value: 'createdAt' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Name Z-A', value: '-name' },
  { label: 'Largest Size', value: '-size' },
  { label: 'Smallest Size', value: 'size' },
];

const MyFiles = () => {
  const { searchQuery, openUpload } = useOutletContext() || {};
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const location = useLocation();

  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [renameFile, setRenameFile] = useState(null);
  const [newName, setNewName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    if (location.state?.openNewFolder) {
      setShowNewFolder(true);
      // Clear location state to prevent re-opening on page reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [sort, setSort] = useState('-createdAt');

  const { files, loading, deleteFile, toggleFavorite, renameFile: doRename, addFiles } = useFiles({
    folderId: currentFolder || 'root',
    fileType: filterType,
    sort,
    search: debouncedSearch,
  });

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim() || !renameFile) return;
    await doRename(renameFile._id, newName);
    setRenameFile(null);
    setNewName('');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await folderService.createFolder({ name: newFolderName, parentId: currentFolder });
      setShowNewFolder(false);
      setNewFolderName('');
      toast.success('Folder created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await fileService.duplicateFile(id);
      addFiles([data.file]);
      toast.success('File duplicated!');
    } catch {
      toast.error('Duplication failed.');
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--gap-lg)', flexWrap: 'wrap', gap: '16px' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-page-title" style={{ marginBottom: '4px' }}>My Files</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {files.length} file{files.length !== 1 ? 's' : ''} stored safely
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary btn-sm"
            onClick={() => setShowNewFolder(true)}
            style={{ borderRadius: 'var(--radius-button)', height: '40px', padding: '0 16px' }}
          >
            <FolderPlus size={16} /> New Folder
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-sm"
            onClick={openUpload}
            style={{ borderRadius: 'var(--radius-button)', height: '40px', padding: '0 16px' }}
          >
            <Upload size={16} /> Upload
          </motion.button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 'var(--gap-lg)', flexWrap: 'wrap' }}
      >
        {/* File type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input"
          style={{ width: 'auto', height: '40px', fontSize: '14px', paddingRight: '36px', borderRadius: '12px' }}
        >
          {FILE_TYPE_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input"
          style={{ width: 'auto', height: '40px', fontSize: '14px', borderRadius: '12px' }}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Toggle grid/list */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          {[{ mode: 'grid', Icon: Grid3x3 }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === mode ? 'var(--surface)' : 'transparent',
                color: viewMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Files */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={debouncedSearch ? 'No files found' : 'No files yet'}
          description={debouncedSearch ? `We couldn't find any files matching "${debouncedSearch}"` : 'Your vault is empty. Upload a file to get started.'}
          action={
            <motion.button
              className="btn btn-primary"
              onClick={openUpload}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              <Upload size={16} /> Upload your first file
            </motion.button>
          }
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}
        >
          <AnimatePresence>
            {files.map(file => (
              <FileCard
                key={file._id}
                file={file}
                selected={selectedIds.includes(file._id)}
                onSelect={handleSelect}
                onPreview={setPreviewFile}
                onShare={setShareFile}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteFile}
                onRename={(f) => { setRenameFile(f); setNewName(f.name); }}
                onDuplicate={handleDuplicate}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="table-container">
          <FileList
            files={files}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onPreview={setPreviewFile}
            onShare={setShareFile}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteFile}
            onRename={(f) => { setRenameFile(f); setNewName(f.name); }}
            onDuplicate={handleDuplicate}
          />
        </div>
      )}

      {/* Rename Modal */}
      <Modal isOpen={!!renameFile} onClose={() => setRenameFile(null)} title="Rename File" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input"
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
            placeholder="File name"
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setRenameFile(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRenameSubmit} style={{ height: '40px', borderRadius: 'var(--radius-button)' }}>Rename</button>
          </div>
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal isOpen={showNewFolder} onClose={() => setShowNewFolder(false)} title="Create Folder" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="input"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Folder name"
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowNewFolder(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateFolder} style={{ height: '40px', borderRadius: 'var(--radius-button)' }}>Create</button>
          </div>
        </div>
      </Modal>

      {/* Preview & Share */}
      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)}
        onToggleFavorite={toggleFavorite} onShare={setShareFile} />
      <ShareModal file={shareFile} isOpen={!!shareFile} onClose={() => setShareFile(null)} />
    </div>
  );
};

export default MyFiles;
