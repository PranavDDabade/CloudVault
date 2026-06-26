import { useState, useEffect } from 'react';
import { Folder, ArrowLeft, FolderPlus, Home } from 'lucide-react';
import Modal from '../ui/Modal';
import { folderService } from '../../services/folderService';
import toast from 'react-hot-toast';

const MoveModal = ({ isOpen, onClose, item, onMove }) => {
  const [currentFolderId, setCurrentFolderId] = useState(null); // null is root
  const [folders, setFolders] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentFolderId(null);
      loadFolders(null);
    }
  }, [isOpen]);

  const loadFolders = async (folderId) => {
    setLoading(true);
    try {
      if (folderId) {
        const { data } = await folderService.getFolder(folderId);
        // Exclude the item itself and any of its children if it's a folder
        const filtered = (data.subfolders || []).filter(f => {
          if (item && item.isFolder) {
            if (f._id === item._id) return false;
            // Check if f has item._id in its path
            const isChildOfItem = f.path && f.path.some(p => p.id === item._id);
            if (isChildOfItem) return false;
          }
          return true;
        });
        setFolders(filtered);
        setBreadcrumbs([
          ...(data.folder.path || []),
          { id: data.folder._id, name: data.folder.name }
        ]);
      } else {
        const { data } = await folderService.getFolders({ parentId: 'root' });
        // Exclude the item itself
        const filtered = (data.folders || []).filter(f => {
          if (item && item.isFolder && f._id === item._id) return false;
          return true;
        });
        setFolders(filtered);
        setBreadcrumbs([]);
      }
    } catch (err) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (folderId) => {
    setCurrentFolderId(folderId);
    loadFolders(folderId);
  };

  const handleMoveSubmit = async () => {
    setMoving(true);
    try {
      await onMove(item, currentFolderId);
      toast.success('Moved successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Move failed');
    } finally {
      setMoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Move "${item?.name}" to...`} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Navigation path / Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          borderRadius: '8px',
          fontSize: '13px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => handleNavigate(null)}
            style={{
              background: 'none',
              border: 'none',
              color: currentFolderId === null ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Home size={14} /> My Files
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <span>/</span>
              <button
                onClick={() => handleNavigate(crumb.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentFolderId === crumb.id ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Folders List */}
        <div style={{
          maxHeight: '260px',
          minHeight: '160px',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          background: 'var(--surface)'
        }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading folders...</div>
          ) : folders.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>No subfolders here</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This folder has no subfolders created yet.</p>
            </div>
          ) : (
            <div>
              {folders.map(folder => (
                <button
                  key={folder._id}
                  onClick={() => handleNavigate(folder._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                  className="hover-row"
                >
                  <Folder size={18} style={{ color: folder.color || 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {folder.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={moving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleMoveSubmit}
            disabled={moving || loading}
            style={{ height: '40px', borderRadius: 'var(--radius-button)' }}
          >
            {moving ? 'Moving...' : `Move to ${currentFolderId ? 'Current Folder' : 'Root'}`}
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default MoveModal;
