import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Download, Trash2, Share2, Copy, Edit2,
  Eye, FolderInput, MoreVertical, Check,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatBytes, formatDate, truncateFilename } from '../../utils/formatters';
import { getFileIcon } from '../../utils/fileIcons';
import { fileService } from '../../services/fileService';
import toast from 'react-hot-toast';

const FileList = ({
  files, onDelete, onToggleFavorite, onRename,
  onShare, onPreview, onDuplicate, onMove,
  selectedIds = [], onSelect
}) => {
  const [menuFile, setMenuFile] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const positionMenu = (x, y) => {
    const menuWidth = 200;
    const menuHeight = 280;
    let newX = x;
    let newY = y;

    if (x + menuWidth > window.innerWidth) {
      newX = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      newY = window.innerHeight - menuHeight - 10;
    }

    setMenuPos({ x: Math.max(10, newX), y: Math.max(10, newY) });
  };

  const handleDownload = async (file) => {
    try {
      const { data } = await fileService.downloadFile(file._id);
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = file.name;
      a.click();
      toast.success('Download started!');
    } catch { toast.error('Download failed.'); }
  };

  if (!files.length) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 80px 40px',
        gap: '12px', padding: '10px 16px', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        <div />
        <div>Name</div>
        <div>Size</div>
        <div>Modified</div>
        <div>Status</div>
        <div />
      </div>

      {/* Rows */}
      <AnimatePresence>
        {files.map((file, idx) => {
          const fileIcon = getFileIcon(file);
          const isSelected = selectedIds.includes(file._id);
          const LIcon = LucideIcons[fileIcon.icon.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')] || LucideIcons.File;

          return (
            <motion.div
              key={file._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelect?.(file._id)}
              onDoubleClick={() => onPreview?.(file)}
              onContextMenu={(e) => {
                e.preventDefault();
                positionMenu(e.clientX, e.clientY);
                setMenuFile(file);
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 100px 100px 80px 40px',
                gap: '12px', padding: '10px 16px', alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background 0.15s',
                background: isSelected ? 'rgba(79,70,229,0.08)' : 'transparent',
              }}
              className="hover:bg-white/5"
            >
              {/* Icon */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: fileIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LIcon size={18} style={{ color: fileIcon.color }} />
              </div>

              {/* Name */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 500, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {file.extension?.toUpperCase() || 'FILE'}
                </div>
              </div>

              {/* Size */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatBytes(file.size)}
              </div>

              {/* Date */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatDate(file.updatedAt)}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {file.isFavorite && <Star size={13} style={{ color: '#FCD34D' }} fill="#FCD34D" />}
                {file.isShared && <Share2 size={13} style={{ color: '#818CF8' }} />}
              </div>

              {/* Actions */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  positionMenu(e.clientX, e.clientY);
                  setMenuFile(file);
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px' }}
              >
                <MoreVertical size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Context menu */}
      {menuFile && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuFile(null)} />
          <motion.div
            className="context-menu"
            style={{ left: menuPos.x, top: menuPos.y, zIndex: 50 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {[
              { label: 'Preview', icon: Eye, action: () => onPreview?.(menuFile) },
              { label: 'Download', icon: Download, action: () => handleDownload(menuFile) },
              { label: 'Share', icon: Share2, action: () => onShare?.(menuFile) },
              { label: 'Rename', icon: Edit2, action: () => onRename?.(menuFile) },
              { label: 'Duplicate', icon: Copy, action: () => onDuplicate?.(menuFile._id) },
              { label: 'Move', icon: FolderInput, action: () => onMove?.(menuFile) },
            ].map(({ label, icon: Icon, action }) => (
              <button key={label} className="context-menu-item" onClick={() => { action(); setMenuFile(null); }}>
                <Icon size={14} /> {label}
              </button>
            ))}
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
            <button className="context-menu-item danger"
              onClick={() => { onDelete?.(menuFile._id); setMenuFile(null); }}>
              <Trash2 size={14} /> Move to Trash
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default FileList;
