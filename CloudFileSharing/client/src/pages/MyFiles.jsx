import { useState, useEffect, useCallback, Suspense, lazy, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, List, FolderPlus, Upload, FolderOpen, Home, ChevronRight } from 'lucide-react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useFiles } from '../hooks/useFiles';
import { useDebounceValue } from '../hooks/useDebounce';
import FileCard from '../components/files/FileCard';
import FileList from '../components/files/FileList';
import FolderCard from '../components/files/FolderCard';
const FilePreview = lazy(() => import('../components/files/FilePreview'));
const MoveModal = lazy(() => import('../components/files/MoveModal'));
const ShareModal = lazy(() => import('../components/sharing/ShareModal'));
import Modal from '../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../components/ui/index.jsx';
const SharedWithMeTab = lazy(() => import('../components/files/SharedWithMeTab'));
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
  const { searchQuery, openUpload, currentFolder, setCurrentFolder, uploadSuccessTrigger } = useOutletContext() || {};
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const location = useLocation();

  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('my-files');
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [highlightedFileId, setHighlightedFileId] = useState(null);
  
  // Refactored renameItem state to handle both files and folders
  const [renameItem, setRenameItem] = useState(null);
  const [newName, setNewName] = useState('');
  
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Folder states
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  // Move modal state
  const [moveItem, setMoveItem] = useState(null);

  useEffect(() => {
    if (location.state?.openNewFolder) {
      setShowNewFolder(true);
      // Clear location state to prevent re-opening on page reload
      window.history.replaceState({}, document.title);
    }
    if (location.state?.previewFile) {
      setPreviewFile(location.state.previewFile);
      setHighlightedFileId(location.state.previewFile._id);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (!highlightedFileId) return;
    const handler = (e) => {
      if (e.target.closest('.modal-content') || e.target.closest('.file-preview-overlay')) return;
      if (e.target.closest(`[data-file-id="${highlightedFileId}"]`)) return;
      setHighlightedFileId(null);
    };
    const timer = setTimeout(() => document.addEventListener('click', handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [highlightedFileId]);

  const [filterType, setFilterType] = useState('');
  const [sort, setSort] = useState('-createdAt');

  const { files, loading: filesLoading, deleteFile, toggleFavorite, renameFile: doRenameFile, addFiles, fetchFiles } = useFiles({
    folderId: currentFolder || 'root',
    fileType: filterType,
    sort,
    search: debouncedSearch,
  });

  // Fetch folders and breadcrumbs
  const fetchFolders = async () => {
    setFoldersLoading(true);
    try {
      if (debouncedSearch) {
        // Global search results
        const { data } = await folderService.getFolders({ search: debouncedSearch });
        setFolders(data.folders || []);
        setBreadcrumbs([]);
      } else {
        if (currentFolder) {
          const { data } = await folderService.getFolder(currentFolder);
          setFolders(data.subfolders || []);
          setBreadcrumbs([
            ...(data.folder.path || []),
            { id: data.folder._id, name: data.folder.name }
          ]);
        } else {
          const { data } = await folderService.getFolders({ parentId: 'root' });
          setFolders(data.folders || []);
          setBreadcrumbs([]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load folders');
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [currentFolder, debouncedSearch, uploadSuccessTrigger]);

  useEffect(() => {
    fetchFiles();
  }, [uploadSuccessTrigger]);

  const handleSelect = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleRenameSubmit = async () => {
    if (!newName.trim() || !renameItem) return;
    try {
      if (renameItem.isFolder) {
        const { data } = await folderService.updateFolder(renameItem._id, { name: newName });
        setFolders(prev => prev.map(f => f._id === renameItem._id ? { ...f, name: data.folder.name } : f));
        toast.success('Folder renamed');
      } else {
        await doRenameFile(renameItem._id, newName);
      }
      setRenameItem(null);
      setNewName('');
    } catch {
      toast.error('Failed to rename');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { data } = await folderService.createFolder({ name: newFolderName, parentId: currentFolder });
      setShowNewFolder(false);
      setNewFolderName('');
      toast.success('Folder created!');
      setFolders(prev => [...prev, data.folder].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleToggleFavoriteFolder = useCallback(async (id, isFavorite) => {
    try {
      const { data } = await folderService.updateFolder(id, { isFavorite });
      setFolders(prev => prev.map(f => f._id === id ? { ...f, isFavorite: data.folder.isFavorite } : f));
      toast.success(data.folder.isFavorite ? 'Folder added to favorites' : 'Folder removed from favorites');
    } catch {
      toast.error('Failed to update favorite');
    }
  }, []);

  const handleDeleteFolder = useCallback(async (id) => {
    try {
      await folderService.deleteFolder(id);
      setFolders(prev => prev.filter(f => f._id !== id));
      toast.success('Folder moved to trash.');
    } catch {
      toast.error('Failed to delete folder');
    }
  }, []);

  const handleMoveItem = useCallback(async (item, destFolderId) => {
    try {
      if (item.isFolder) {
        await folderService.updateFolder(item._id, { parentId: destFolderId });
        setFolders(prev => prev.filter(f => f._id !== item._id));
      } else {
        await fileService.updateFile(item._id, { folderId: destFolderId });
        fetchFiles();
      }
    } catch (err) {
      throw err;
    }
  }, [fetchFiles]);

  const handleDuplicate = useCallback(async (id) => {
    try {
      const { data } = await fileService.duplicateFile(id);
      addFiles([data.file]);
      toast.success('File duplicated!');
    } catch {
      toast.error('Duplication failed.');
    }
  }, [addFiles]);

  const handleRenameFolder = useCallback((f) => {
    setRenameItem({ ...f, isFolder: true });
    setNewName(f.name);
  }, []);

  const handleRenameFile = useCallback((f) => {
    setRenameItem(f);
    setNewName(f.name);
  }, []);

  const totalItemsCount = folders.length + files.length;
  const isLoading = foldersLoading || filesLoading;

  return (
    <div>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--gap-lg)', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="text-page-title" style={{ marginBottom: '4px' }}>My Files</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} stored safely
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
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: 'var(--gap-lg)', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('my-files')} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === 'my-files' ? 'var(--surface)' : 'transparent', color: activeTab === 'my-files' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>My Files</button>
        <button onClick={() => setActiveTab('shared-with-me')} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === 'shared-with-me' ? 'var(--surface)' : 'transparent', color: activeTab === 'shared-with-me' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Shared with me</button>
      </div>

      {activeTab === 'shared-with-me' ? (
        <Suspense fallback={<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>{[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}</div>}>
          <SharedWithMeTab />
        </Suspense>
      ) : (
        <>
          {/* Breadcrumbs Navigation */}
          <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '24px',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setCurrentFolder(null)}
          style={{
            background: 'none',
            border: 'none',
            color: currentFolder === null ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Home size={15} /> My Files
        </button>
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            <button
              onClick={() => setCurrentFolder(crumb.id)}
              style={{
                background: 'none',
                border: 'none',
                color: currentFolder === crumb.id ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

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
          onChange={(e) => startTransition(() => setFilterType(e.target.value))}
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
          onChange={(e) => startTransition(() => setSort(e.target.value))}
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
              onClick={() => startTransition(() => setViewMode(mode))}
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

      {/* Folders and Files Display */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : totalItemsCount === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={debouncedSearch ? 'No items found' : 'No items yet'}
          description={debouncedSearch ? `We couldn't find any items matching "${debouncedSearch}"` : 'Your vault is empty. Upload a file or create a folder to get started.'}
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Folders Grid (Only shown when not filtering by specific file type) */}
          {folders.length > 0 && !filterType && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Folders</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
                {folders.map(folder => (
                  <FolderCard
                    key={folder._id}
                    folder={folder}
                    onOpen={setCurrentFolder}
                    onDelete={handleDeleteFolder}
                    onRename={handleRenameFolder}
                    onMove={setMoveItem}
                    onToggleFavorite={handleToggleFavoriteFolder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files Grid/List */}
          {files.length > 0 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Files</h2>
              {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-grid)' }}>
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
                      onRename={handleRenameFile}
                      onDuplicate={handleDuplicate}
                      onMove={setMoveItem}
                      highlighted={highlightedFileId === file._id}
                    />
                  ))}
                </div>
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
                    onRename={handleRenameFile}
                    onDuplicate={handleDuplicate}
                    onMove={setMoveItem}
                    highlightedFileId={highlightedFileId}
                  />
                </div>
              )}
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

      {/* Move Destination Modal */}
      {!!moveItem && (
        <Suspense fallback={null}>
          <MoveModal
            isOpen={!!moveItem}
            onClose={() => setMoveItem(null)}
            item={moveItem}
            onMove={handleMoveItem}
          />
        </Suspense>
      )}

      {/* Preview & Share */}
      {!!previewFile && (
        <Suspense fallback={null}>
          <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)}
            onToggleFavorite={toggleFavorite} onShare={setShareFile} />
        </Suspense>
      )}
      {!!shareFile && (
        <Suspense fallback={null}>
          <ShareModal file={shareFile} isOpen={!!shareFile} onClose={() => setShareFile(null)} />
        </Suspense>
      )}
      </>
      )}
    </div>
  );
};

export default MyFiles;
