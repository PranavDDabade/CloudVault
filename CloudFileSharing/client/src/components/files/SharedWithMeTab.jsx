import { useState, useEffect, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Share2, Eye, Download } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { shareService } from '../../services/shareService';
import { EmptyState, SkeletonRow } from '../ui/index.jsx';
const FilePreview = lazy(() => import('./FilePreview'));
import { formatBytes, formatDate, formatShortDate } from '../../utils/formatters';
import { getFileIcon } from '../../utils/fileIcons';
import toast from 'react-hot-toast';

const SharedWithMeTab = () => {
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shareService.getSharedWithMe();
        setSharedWithMe(res.data.shares || []);
      } catch {
        toast.error('Failed to load shared files');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>;
  }

  if (sharedWithMe.length === 0) {
    return <EmptyState icon={Share2} title="No shared files" description="Files shared with you will appear here" />;
  }

  return (
    <div>
      <div className="table-container">
        {sharedWithMe.map((share, idx) => {
          const isFolder = !!share.folder;
          const item = isFolder ? share.folder : share.file;
          if (!item) return null;
          
          const fileIcon = isFolder
            ? { bg: 'rgba(124, 92, 255, 0.1)', color: item.color || 'var(--primary)' }
            : getFileIcon(item);
            
          const LIcon = isFolder
            ? LucideIcons.Folder
            : (LucideIcons[fileIcon.icon.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')] || LucideIcons.File);

          return (
            <motion.div
              key={share._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="table-row"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onDoubleClick={() => window.open(`/#/share/${share.token}`, '_blank')}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: fileIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LIcon size={20} style={{ color: fileIcon.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, marginLeft: '16px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                  {item.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {isFolder ? 'Folder' : formatBytes(item.size)}
                  {share.sharedBy && ` · From ${share.sharedBy.name}`}
                  {share.expiresAt && ` · Expires ${formatShortDate(share.expiresAt)}`}
                </p>
              </div>
              {/* Permissions */}
              <div style={{ display: 'flex', gap: '8px', marginHorizontal: '16px' }}>
                {share.permissions?.canView && <span className="badge badge-primary" style={{ fontSize: '10px', height: '24px' }}><Eye size={11} style={{ marginRight: '4px' }} /> View</span>}
                {share.permissions?.canDownload && <span className="badge badge-success" style={{ fontSize: '10px', height: '24px' }}><Download size={11} style={{ marginRight: '4px' }} /> DL</span>}
              </div>
              {/* Stats */}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right', minWidth: '100px', marginRight: '24px' }}>
                <p style={{ fontWeight: 600, color: 'var(--text)' }}>{share.accessCount || 0} views</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(share.createdAt)}</p>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => isFolder ? toast.success('Open the link in your browser to view this folder!') : setPreviewFile(item)} 
                  className="btn btn-secondary btn-sm" 
                  style={{ height: '36px', fontSize: '13px', borderRadius: 'var(--radius-button)' }}
                >
                  <Eye size={14} /> {isFolder ? 'View Folder' : 'View File'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!!previewFile && (
        <Suspense fallback={null}>
          <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default SharedWithMeTab;
