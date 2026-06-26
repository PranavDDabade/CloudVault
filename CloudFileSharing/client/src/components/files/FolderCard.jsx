import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, MoreVertical, Edit2, Trash2, FolderInput, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const FolderCard = ({
  folder,
  onOpen,
  onDelete,
  onRename,
  onMove,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 8 });
    setShowMenu(true);
  };

  const handleToggleFav = async (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      await onToggleFavorite(folder._id, !folder.isFavorite);
    }
  };

  return (
    <>
      <motion.div
        className="file-card"
        style={{
          padding: '16px',
          height: '110px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        onContextMenu={handleContextMenu}
        onDoubleClick={() => onOpen?.(folder._id)}
        onClick={() => onOpen?.(folder._id)}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4, borderHex: 'rgba(124,58,237,0.2)', boxShadow: 'var(--shadow-md), var(--shadow-glow)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Folder Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(124, 92, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: folder.color || 'var(--primary)',
          }}>
            <Folder size={22} fill={folder.color || 'var(--primary)'} style={{ opacity: 0.8 }} />
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {/* Star button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleFav}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: folder.isFavorite ? '#FCD34D' : 'var(--text-muted)',
                padding: '4px',
              }}
            >
              <Star size={14} fill={folder.isFavorite ? '#FCD34D' : 'none'} />
            </motion.button>

            {/* Menu trigger */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMoreClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
              }}
            >
              <MoreVertical size={16} />
            </motion.button>
          </div>
        </div>

        {/* Folder Info */}
        <div style={{ minWidth: 0, marginTop: '8px' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '2px',
          }}>
            {folder.name}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {folder.subfolderCount || 0} folder{(folder.subfolderCount !== 1) ? 's' : ''} · {folder.fileCount || 0} file{(folder.fileCount !== 1) ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Dropdown Menu */}
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
              <button className="context-menu-item" onClick={() => { onOpen?.(folder._id); setShowMenu(false); }}>
                <Folder size={14} /> Open
              </button>
              <button className="context-menu-item" onClick={() => { onRename?.(folder); setShowMenu(false); }}>
                <Edit2 size={14} /> Rename
              </button>
              <button className="context-menu-item" onClick={() => { onMove?.(folder); setShowMenu(false); }}>
                <FolderInput size={14} /> Move
              </button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button className="context-menu-item danger" onClick={() => { onDelete?.(folder._id); setShowMenu(false); }}>
                <Trash2 size={14} /> Move to Trash
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(FolderCard);
