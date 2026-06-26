import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Download, Trash2, Share2, Copy, Edit2,
  MoreVertical, Eye, FolderInput,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatBytes, formatDate, truncateFilename } from '../../utils/formatters';
import { getFileIcon } from '../../utils/fileIcons';
import { fileService } from '../../services/fileService';
import toast from 'react-hot-toast';

const FileCard = ({ file, onDelete, onToggleFavorite, onRename, onShare, onPreview, onDuplicate, onMove, selected, onSelect }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const fileIcon = getFileIcon(file);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleDownload = async () => {
    try {
      const { data } = await fileService.downloadFile(file._id);
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = file.name;
      a.click();
      toast.success('Download started!');
    } catch {
      toast.error('Download failed.');
    }
  };

  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isPdf = file.mimeType === 'application/pdf';

  return (
    <>
      <motion.div
        className={`file-card ${selected ? 'card-selected' : ''}`}
        onContextMenu={handleContextMenu}
        onClick={() => onSelect?.(file._id)}
        onDoubleClick={() => onPreview?.(file)}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.08)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Thumbnail / Icon */}
        <div style={{
          height: '110px', borderRadius: '12px', marginBottom: '14px',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${fileIcon.bg}, rgba(124,58,237,0.05))`,
          position: 'relative',
          border: '1px solid rgba(124,58,237,0.1)',
        }}>
          {/* Default Icon in the background */}
          {(() => {
            const LIcon = LucideIcons[fileIcon.icon.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')]
              || LucideIcons.File;
            return (
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
                <LIcon size={42} style={{ color: fileIcon.color, filter: `drop-shadow(0 4px 12px ${fileIcon.color}40)` }} />
              </motion.div>
            );
          })()}

          {/* Absolute overlay preview elements */}
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          {isVideo && (
            <video
              src={file.url}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              preload="metadata"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          {isPdf && (
            <iframe
              src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
              scrolling="no"
            />
          )}

          {/* Favorite star */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(file._id); }}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              borderRadius: '8px', padding: '5px',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              color: file.isFavorite ? '#FCD34D' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
          >
            <Star size={14} fill={file.isFavorite ? '#FCD34D' : 'none'} style={{ filter: file.isFavorite ? 'drop-shadow(0 0 8px rgba(252,211,77,0.5))' : 'none' }} />
          </motion.button>

          {/* Shared badge */}
          {file.isShared && (
            <div style={{
              position: 'absolute', top: '8px', left: '8px',
              background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
              borderRadius: '6px',
              padding: '3px 8px', fontSize: '10px', color: 'white', fontWeight: 700,
              boxShadow: '0 2px 10px rgba(124,58,237,0.4)',
            }}>
              Shared
            </div>
          )}
        </div>

        {/* File info */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '15px', fontWeight: 600, color: 'var(--text)',
            marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {truncateFilename(file.name, 25)}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatBytes(file.size)} · {formatDate(file.createdAt)}
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex gap-1">
            <motion.button whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.1)' }} onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="btn btn-ghost btn-sm" style={{ padding: '6px', borderRadius: '6px' }} data-tooltip="Download">
              <Download size={14} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.1)' }} onClick={(e) => { e.stopPropagation(); onShare?.(file); }}
              className="btn btn-ghost btn-sm" style={{ padding: '6px', borderRadius: '6px' }} data-tooltip="Share">
              <Share2 size={14} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.1)' }} onClick={(e) => { e.stopPropagation(); onPreview?.(file); }}
              className="btn btn-ghost btn-sm" style={{ padding: '6px', borderRadius: '6px' }} data-tooltip="Preview">
              <Eye size={14} />
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.1)' }}
            onClick={(e) => { e.stopPropagation(); setMenuPos({ x: e.clientX, y: e.clientY }); setShowMenu(true); }}
            className="btn btn-ghost btn-sm" style={{ padding: '6px', borderRadius: '6px' }}
          >
            <MoreVertical size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              className="context-menu"
              style={{ left: menuPos.x, top: menuPos.y, zIndex: 50 }}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              <button className="context-menu-item" onClick={() => { onPreview?.(file); setShowMenu(false); }}>
                <Eye size={14} /> Preview
              </button>
              <button className="context-menu-item" onClick={() => { handleDownload(); setShowMenu(false); }}>
                <Download size={14} /> Download
              </button>
              <button className="context-menu-item" onClick={() => { onShare?.(file); setShowMenu(false); }}>
                <Share2 size={14} /> Share
              </button>
              <button className="context-menu-item" onClick={() => { onRename?.(file); setShowMenu(false); }}>
                <Edit2 size={14} /> Rename
              </button>
              <button className="context-menu-item" onClick={() => { onDuplicate?.(file._id); setShowMenu(false); }}>
                <Copy size={14} /> Duplicate
              </button>
              <button className="context-menu-item" onClick={() => { onMove?.(file); setShowMenu(false); }}>
                <FolderInput size={14} /> Move
              </button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button className="context-menu-item danger"
                onClick={() => { onDelete?.(file._id); setShowMenu(false); }}>
                <Trash2 size={14} /> Move to Trash
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FileCard;
