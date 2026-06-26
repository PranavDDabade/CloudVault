import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cloud, Lock, Download, AlertTriangle, ZoomIn, ZoomOut } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { shareService } from '../services/shareService';
import { formatBytes } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import toast from 'react-hot-toast';

function PublicShare() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);

  const fetchShareDetails = async (passVal = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareService.getShareByToken(token, passVal);
      const shareData = response.data.share;
      setShare(shareData);
      setRequiresPassword(false);

      // Now fetch download URL for preview/download
      const dlResponse = await shareService.downloadViaShare(token, passVal);
      setFileUrl(dlResponse.data.downloadUrl);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Failed to load share link';
      
      if (status === 401 && err.response?.data?.requiresPassword) {
        setRequiresPassword(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShareDetails();
  }, [token]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Password is required');
      return;
    }
    setVerifying(true);
    try {
      await fetchShareDetails(password);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!fileUrl || !share?.file) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = share.file.name;
    a.click();
    toast.success('Download started!');
  };

  if (loading && !share && !requiresPassword) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '15px' }}>Loading secure share link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div className="animated-bg"><div className="blob blob-1" /><div className="blob blob-2" /></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', maxWidth: '440px', textAlign: 'center', zIndex: 1, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <AlertTriangle size={32} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>{error}</p>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
            Go Home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div className="animated-bg"><div className="blob blob-1" /><div className="blob blob-2" /></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', maxWidth: '400px', width: '100%', zIndex: 1, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Lock size={30} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', textAlign: 'center' }}>Password Protected</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
            This link is secure. Please enter the password to access the file.
          </p>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input" style={{ height: '42px' }} disabled={verifying} autoFocus />
            <button className="btn btn-primary" style={{ height: '42px', justifyContent: 'center' }} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Access File'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!share || !share.file) return null;

  const file = share.file;
  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');
  const isPdf = file.mimeType === 'application/pdf';
  const canPreview = (isImage || isVideo || isAudio || isPdf) && fileUrl;

  const fileIcon = getFileIcon(file);
  const LIcon = LucideIcons[fileIcon.icon.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')] || LucideIcons.File;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--sidebar)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cloud size={24} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg, #7C5CFF, #5EEAD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CloudVault</span>
        </div>
        <button onClick={handleDownload} className="btn btn-primary btn-sm">
          <Download size={14} style={{ marginRight: '6px' }} /> Download File
        </button>
      </header>

      {/* Main Share view */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: canPreview ? '1fr 360px' : '1fr', flex: 1, minHeight: 0 }}>
          
          {/* File Preview area */}
          {canPreview ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000814', position: 'relative', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
              {isImage && (
                <>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 20 }}>
                    <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="btn btn-secondary btn-sm" style={{ padding: '6px', minWidth: '36px' }}>
                      <ZoomIn size={16} />
                    </button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="btn btn-secondary btn-sm" style={{ padding: '6px', minWidth: '36px' }}>
                      <ZoomOut size={16} />
                    </button>
                  </div>
                  <img src={fileUrl} alt={file.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', transform: `scale(${zoom})`, transition: 'transform 0.2s' }} />
                </>
              )}
              {isVideo && (
                <video controls style={{ maxWidth: '90%', maxHeight: '80vh', borderRadius: '12px' }}>
                  <source src={fileUrl} type={file.mimeType} />
                </video>
              )}
              {isAudio && (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', maxWidth: '440px', width: '100%', margin: '0 24px', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>{file.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>{formatBytes(file.size)}</p>
                  <audio controls src={fileUrl} style={{ width: '100%' }} />
                </div>
              )}
              {isPdf && (
                <iframe src={fileUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={file.name} />
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000814', padding: '40px 24px' }}>
              <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: fileIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'var(--shadow-glow)' }}>
                  <LIcon size={44} style={{ color: fileIcon.color }} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{file.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
                  {formatBytes(file.size)} · Preview not available for this file type
                </p>
                <button className="btn btn-primary" onClick={handleDownload} style={{ padding: '14px 32px', fontSize: '15px' }}>
                  <Download size={16} style={{ marginRight: '8px' }} /> Download File
                </button>
              </div>
            </div>
          )}

          {/* Info Details panel (Only shown if preview is active) */}
          {canPreview && (
            <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--sidebar)', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Shared File</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: fileIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LIcon size={24} style={{ color: fileIcon.color }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</p>
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Shared By</span>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{share.sharedBy?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Created On</span>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{new Date(share.createdAt).toLocaleDateString()}</span>
                    </div>
                    {share.expiresAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Expires On</span>
                        <span style={{ fontWeight: 500, color: '#FF8A65' }}>{new Date(share.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px' }}>
                <button className="btn btn-secondary" onClick={handleDownload} style={{ width: '100%', justifyContent: 'center', height: '44px' }}>
                  <Download size={15} style={{ marginRight: '6px' }} /> Download File
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default PublicShare;
