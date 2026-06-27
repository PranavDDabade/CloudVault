import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Star, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getFileIcon } from '../../utils/fileIcons';
import { fileService } from '../../services/fileService';
import toast from 'react-hot-toast';

const FilePreview = ({ file, isOpen, onClose, onToggleFavorite, onShare }) => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen || !file) return;
    setZoom(1);
    setDownloadUrl(null);

    // Prevent React 18 Strict Mode from double-firing the view count API
    if (file._id && !window.location.href.includes('/share/')) {
      const now = Date.now();
      if (window.__lastViewedFileId === file._id && (now - window.__lastViewedTime < 2000)) {
        return; // Skip if we just viewed this file in the last 2 seconds
      }
      window.__lastViewedFileId = file._id;
      window.__lastViewedTime = now;

      fileService.getFile(file._id).catch(() => {});
    }
  }, [file, isOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!file) return null;

  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = file.mimeType?.startsWith('text/');

  const fileIcon = getFileIcon(file);
  const LIcon = LucideIcons[fileIcon.icon.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')] || LucideIcons.File;

  const handleDownload = async () => {
    try {
      const { data } = await fileService.downloadFile(file._id);
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = file.name;
      a.click();
      toast.success('Download started!');
    } catch { toast.error('Download failed.'); }
  };

  const canPreview = isImage || isVideo || isAudio || isPdf;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="preview-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="preview-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              height: canPreview ? '100%' : 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
              borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: fileIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <LIcon size={20} style={{ color: fileIcon.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatBytes(file.size)} · {formatDate(file.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {isImage && (
                  <>
                    <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                      <ZoomIn size={16} />
                    </button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                      <ZoomOut size={16} />
                    </button>
                  </>
                )}
                <button onClick={() => onToggleFavorite?.(file._id)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                  <Star size={16} fill={file.isFavorite ? '#FCD34D' : 'none'} style={{ color: file.isFavorite ? '#FCD34D' : undefined }} />
                </button>
                <button onClick={() => onShare?.(file)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                  <Share2 size={16} />
                </button>
                <button onClick={handleDownload} className="btn btn-primary btn-sm">
                  <Download size={15} /> Download
                </button>
                <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Preview area */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: isPdf ? 'stretch' : 'center',
              justifyContent: 'center',
              minHeight: '300px',
              background: '#000a14',
              width: '100%'
            }}>
              {isImage && (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
                />
              )}
              {isVideo && (
                <video controls style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', objectFit: 'contain' }}>
                  <source src={file.previewUrl} type={file.mimeType} />
                </video>
              )}
              {isAudio && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '60px', marginBottom: '24px' }}>🎵</div>
                  <p style={{ color: 'var(--text)', marginBottom: '16px', fontWeight: 600 }}>{file.name}</p>
                  <audio controls src={file.previewUrl} style={{ width: '100%', maxWidth: '400px' }} />
                </div>
              )}
              {isPdf && (
                <iframe src={file.previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={file.name} />
              )}
              {!canPreview && (
                <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '20px',
                    background: fileIcon.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 20px',
                  }}>
                    <LIcon size={40} style={{ color: fileIcon.color }} />
                  </div>
                  <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>Preview not available</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                    This file type cannot be previewed in the browser
                  </p>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    <Download size={16} /> Download to View
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FilePreview;
