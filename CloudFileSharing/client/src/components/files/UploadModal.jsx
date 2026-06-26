import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, AlertCircle, File } from 'lucide-react';
import Modal from '../ui/Modal';
import UploadZone from './UploadZone';
import { useUpload } from '../../hooks/useUpload';
import { formatBytes } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

const UploadModal = ({ isOpen, onClose, folderId, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const navigate = useNavigate();

  const { uploadFiles, uploading, progress, uploadQueue } = useUpload((files) => {
    setSelectedFiles([]);
    onSuccess?.(files);
    setTimeout(() => {
      onClose();
      navigate('/dashboard/files');
    }, 1500);
  });

  const handleFiles = (files) => {
    setSelectedFiles(Array.from(files));
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles, folderId);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Files" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Upload Zone */}
        <UploadZone onFiles={handleFiles} disabled={uploading} />

        {/* Selected files list */}
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div style={{
                background: 'var(--surface-2)', borderRadius: '16px',
                border: '1px solid var(--border)', overflow: 'hidden',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)',
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)',
                  background: 'rgba(124,58,237,0.03)',
                }}>
                  {selectedFiles.length} file(s) selected
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {selectedFiles.map((file, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        background: 'var(--surface)',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(124,58,237,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <File size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '13px', color: 'var(--text)', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      {!uploading && (
                        <motion.button
                          whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.1)' }}
                          onClick={() => removeFile(idx)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', borderRadius: '6px' }}
                        >
                          <X size={14} style={{ color: 'var(--danger)' }} />
                        </motion.button>
                      )}
                      {uploading && uploadQueue[idx] && (
                        <div style={{ padding: '4px' }}>
                          {uploadQueue[idx].status === 'done'
                            ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /></motion.div>
                            : uploadQueue[idx].status === 'error'
                            ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><AlertCircle size={18} style={{ color: 'var(--danger)' }} /></motion.div>
                            : <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          }
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Uploading...</span>
                <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{progress}%</span>
              </div>
              <div className="storage-bar" style={{ height: '8px', background: 'var(--surface-3)' }}>
                <motion.div
                  className="storage-bar-fill"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-secondary" onClick={handleClose} disabled={uploading}>
            Cancel
          </motion.button>
          <motion.button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            whileHover={!(selectedFiles.length === 0 || uploading) ? { scale: 1.02, boxShadow: '0 6px 20px rgba(124,58,237,0.4)' } : {}}
            whileTap={!(selectedFiles.length === 0 || uploading) ? { scale: 0.98 } : {}}
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 4s ease infinite',
            }}
          >
            {uploading ? (
              <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Uploading...</>
            ) : (
              <><Upload size={16} /> Upload {selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : ''}</>
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
