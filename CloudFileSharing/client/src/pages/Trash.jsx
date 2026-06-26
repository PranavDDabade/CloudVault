import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, Trash as TrashIcon, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { EmptyState, SkeletonRow } from '../components/ui/index.jsx';
import Modal from '../components/ui/Modal';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import toast from 'react-hot-toast';

const Trash = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await fileService.getTrash();
      setItems(data.files || []); // Unified payload returned under 'files' property
    } catch {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item) => {
    try {
      if (item.isFolder) {
        await folderService.restoreFolder(item._id);
      } else {
        await fileService.restoreFile(item._id);
      }
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success(`${item.isFolder ? 'Folder' : 'File'} restored!`);
    } catch {
      toast.error('Restore failed.');
    }
  };

  const handlePermanentDelete = async (item) => {
    try {
      if (item.isFolder) {
        await folderService.permanentDeleteFolder(item._id);
      } else {
        await fileService.permanentDelete(item._id);
      }
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success(`${item.isFolder ? 'Folder' : 'File'} permanently deleted.`);
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await fileService.emptyTrash();
      setItems([]);
      setShowEmptyConfirm(false);
      toast.success('Trash emptied!');
    } catch {
      toast.error('Failed to empty trash.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--gap-lg)', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} style={{ color: 'var(--error)' }} />
            </div>
            <h1 className="text-page-title">Trash</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Items are automatically deleted permanently after 30 days
          </p>
        </div>
        {items.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => setShowEmptyConfirm(true)} style={{ borderRadius: 'var(--radius-button)', height: '40px' }}>
            <TrashIcon size={14} /> Empty Trash
          </button>
        )}
      </div>

      {/* Warning banner */}
      {items.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '16px', marginBottom: 'var(--gap-lg)',
          }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)', marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '14px', color: 'var(--warning)', lineHeight: 1.5 }}>
            Items in the trash will be permanently deleted after 30 days. Click 'Restore' to recover items.
          </p>
        </motion.div>
      )}

      {loading ? (
        <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Trash2} title="Trash is empty" description="Deleted items will appear here" />
      ) : (
        <div className="table-container">
          <AnimatePresence>
            {items.map((item, idx) => {
              const isFolder = item.isFolder;
              const fileIcon = isFolder
                ? { bg: 'rgba(124, 92, 255, 0.1)', color: item.color || 'var(--primary)' }
                : getFileIcon(item);
              
              const LIcon = isFolder
                ? LucideIcons.Folder
                : (LucideIcons[fileIcon.icon.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')] || LucideIcons.File);

              return (
                <motion.div key={item._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="table-row"
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: fileIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LIcon size={20} style={{ color: fileIcon.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, marginLeft: '16px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {!isFolder && `${formatBytes(item.size)} · `}Deleted {formatDate(item.deletedAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
                    <button onClick={() => handleRestore(item)}
                      className="btn btn-secondary btn-sm" style={{ height: '36px', fontSize: '13px', borderRadius: 'var(--radius-button)' }}>
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button onClick={() => handlePermanentDelete(item)}
                      className="btn btn-danger btn-sm" style={{ height: '36px', fontSize: '13px', borderRadius: 'var(--radius-button)' }}>
                      <TrashIcon size={14} /> Delete Forever
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm empty trash modal */}
      <Modal isOpen={showEmptyConfirm} onClose={() => setShowEmptyConfirm(false)} title="Empty Trash?" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            This will permanently delete all <strong>{items.length} item(s)</strong> in your trash. This action is irreversible.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowEmptyConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleEmptyTrash} style={{ height: '40px', borderRadius: 'var(--radius-button)' }}>
              <TrashIcon size={14} /> Yes, Empty Trash
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trash;
