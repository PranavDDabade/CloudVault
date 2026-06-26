import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Link2, Download, Eye } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { shareService } from '../services/shareService';
import { EmptyState, SkeletonRow } from '../components/ui/index.jsx';
import FilePreview from '../components/files/FilePreview';
import { formatBytes, formatDate, formatShortDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import toast from 'react-hot-toast';

const SharedFiles = () => {
  const [tab, setTab] = useState('mine');
  const [myShares, setMyShares] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [mineRes, withMeRes] = await Promise.all([
          shareService.getMyShares(),
          shareService.getSharedWithMe(),
        ]);
        setMyShares(mineRes.data.shares || []);
        setSharedWithMe(withMeRes.data.shares || []);
      } catch {
        toast.error('Failed to load shared files');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyLink = async (share) => {
    if (!share.publicLink) return;
    await navigator.clipboard.writeText(share.publicLink);
    setCopiedId(share._id);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const disableShare = async (id) => {
    try {
      await shareService.deleteShare(id);
      setMyShares(prev => prev.filter(s => s._id !== id));
      toast.success('Share disabled.');
    } catch {
      toast.error('Failed to disable share.');
    }
  };

  const currentList = tab === 'mine' ? myShares : sharedWithMe;

  return (
    <div>
      <motion.div style={{ marginBottom: 'var(--gap-lg)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-page-title">Shared Files</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {tab === 'mine' ? `${myShares.length} links shared by you` : `${sharedWithMe.length} links shared with you`}
        </p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: 'var(--gap-lg)', width: 'fit-content' }}>
        {[{ id: 'mine', label: `Shared by Me (${myShares.length})` }, { id: 'with-me', label: `Shared with Me (${sharedWithMe.length})` }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
              background: tab === id ? 'var(--surface)' : 'transparent',
              color: tab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : currentList.length === 0 ? (
        <EmptyState icon={Share2} title="No shared files" description={tab === 'mine' ? 'Share files to see them here' : 'Files shared with you will appear here'} />
      ) : (
        <div className="table-container">
          {currentList.map((share, idx) => {
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
                    {tab === 'with-me' && share.sharedBy && ` · From ${share.sharedBy.name}`}
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
                  {tab === 'mine' && (
                    <>
                      <button onClick={() => copyLink(share)} className="btn btn-secondary btn-sm" style={{ height: '36px', fontSize: '13px', borderRadius: 'var(--radius-button)' }}>
                        <Link2 size={14} /> {copiedId === share._id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button onClick={() => disableShare(share._id)} className="btn btn-danger btn-sm" style={{ height: '36px', fontSize: '13px', borderRadius: 'var(--radius-button)' }}>
                        Disable
                      </button>
                    </>
                  )}
                  {tab === 'with-me' && (
                    <button 
                      onClick={() => isFolder ? toast.success('Open the link in your browser to view this folder!') : setPreviewFile(item)} 
                      className="btn btn-secondary btn-sm" 
                      style={{ height: '36px', fontSize: '13px', borderRadius: 'var(--radius-button)' }}
                    >
                      <Eye size={14} /> {isFolder ? 'View Folder' : 'View File'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default SharedFiles;
