import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Cloud, FolderOpen } from 'lucide-react';

const UploadZone = ({ onFiles, disabled, compact = false }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFiles(acceptedFiles);
    }
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled,
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? 'active' : ''}`}
      style={{
        ...(isDragReject ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.05)' } : {}),
        ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
        ...(compact ? { padding: '24px', borderRadius: '16px' } : {}),
        background: isDragActive ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.02)',
      }}
    >
      <input {...getInputProps()} />
      <motion.div
        animate={{ scale: isDragActive ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
      >
        {/* Animated icon */}
        <motion.div
          animate={{ y: isDragActive ? [-6, 0, -6] : 0 }}
          transition={{ repeat: isDragActive ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
          style={{
            width: compact ? '64px' : '90px',
            height: compact ? '64px' : '90px',
            borderRadius: '24px',
            background: isDragActive
              ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(45,212,191,0.15))'
              : 'rgba(124,58,237,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid',
            borderColor: isDragActive ? '#A78BFA' : 'rgba(124,58,237,0.25)',
            transition: 'all 0.3s',
            boxShadow: isDragActive ? '0 8px 32px rgba(124,58,237,0.2)' : 'none',
          }}
        >
          {isDragActive ? (
            <FolderOpen size={compact ? 32 : 44} style={{ color: '#A78BFA' }} />
          ) : (
            <Cloud size={compact ? 32 : 44} style={{ color: '#818CF8' }} />
          )}
        </motion.div>

        <div>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: compact ? '16px' : '20px', fontWeight: 600, color: 'var(--text)',
            marginBottom: '6px', letterSpacing: '-0.5px',
          }}>
            {isDragActive
              ? isDragReject ? '❌ File type not supported' : '📂 Drop files to upload'
              : 'Drag & drop files here'
            }
          </p>
          {!isDragActive && (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                or click to browse your computer
              </p>
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 4s ease infinite',
                  color: 'white', padding: '12px 28px', borderRadius: '12px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Upload size={16} />
                Choose Files
              </motion.div>
              {!compact && (
                <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Supports images, videos, documents, archives and more · Max 100MB per file · Up to 10 files
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UploadZone;
