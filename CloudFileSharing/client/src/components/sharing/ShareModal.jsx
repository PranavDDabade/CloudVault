import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Mail, Lock, Clock, Eye, Download, Edit2, Copy, Check, X, Globe, Users, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import { shareService } from '../../services/shareService';
import toast from 'react-hot-toast';

const ShareModal = ({ file, isOpen, onClose }) => {
  const [tab, setTab] = useState('link');
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [config, setConfig] = useState({
    isPublic: true,
    canDownload: true,
    canEdit: false,
    hasPassword: false,
    password: '',
    hasExpiry: false,
    expiresAt: '',
    emails: '',
  });

  // Fetch existing share if file is already shared
  useEffect(() => {
    if (isOpen) {
      setShare(null);
      setTab('link');
      setEditMode(false);
      setConfig({
        isPublic: true,
        canDownload: true,
        canEdit: false,
        hasPassword: false,
        password: '',
        hasExpiry: false,
        expiresAt: '',
        emails: '',
      });

      if (file?.isShared) {
        setLoading(true);
        shareService.getMyShares()
          .then(({ data }) => {
            const existing = data.shares?.find(s => s.file?._id === file._id || s.file === file._id);
            if (existing) setShare(existing);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, file]);

  const createShare = async () => {
    if (!file) return;
    if (config.hasExpiry && !config.expiresAt) {
      toast.error('Please select an expiry date and time');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fileId: file._id,
        isPublic: config.isPublic,
        permissions: { canView: true, canDownload: config.canDownload, canEdit: config.canEdit },
        ...(config.hasPassword && config.password ? { password: config.password } : {}),
        ...(config.hasExpiry && config.expiresAt ? { expiresAt: new Date(config.expiresAt).toISOString() } : {}),
        ...(config.emails ? { emails: config.emails.split(',').map(e => e.trim()).filter(Boolean) } : {}),
      };
      
      const { data } = await shareService.createShare(payload);
      setShare(data.share);
      
      if (!data.alreadyShared) {
        toast.success('Share link created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create share link');
    }
    setLoading(false);
  };

  const updateShare = async () => {
    if (!share) return;
    if (config.hasExpiry && !config.expiresAt) {
      toast.error('Please select an expiry date and time');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        isPublic: config.isPublic,
        permissions: { canView: true, canDownload: config.canDownload, canEdit: config.canEdit },
        password: config.hasPassword ? (config.password || undefined) : null,
        expiresAt: config.hasExpiry && config.expiresAt ? new Date(config.expiresAt).toISOString() : null,
      };
      
      const { data } = await shareService.updateShare(share._id, payload);
      setShare(data.share);
      setEditMode(false);
      toast.success('Share settings updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update share settings');
    }
    setLoading(false);
  };

  const copyLink = async () => {
    const link = share?.publicLink || (share?.linkToken ? `${window.location.origin}/#/share/${share.linkToken}` : '');
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const disableShare = async () => {
    if (!share?._id) return;
    try {
      await shareService.deleteShare(share._id);
      setShare(null);
      setEditMode(false);
      toast.success('Share link disabled.');
    } catch { 
      toast.error('Failed to disable share link.'); 
    }
  };

  const enterEditMode = () => {
    setConfig({
      isPublic: share.isPublic !== false,
      canDownload: share.permissions?.canDownload !== false,
      canEdit: share.permissions?.canEdit === true,
      hasPassword: share.hasPassword || false,
      password: '',
      hasExpiry: !!share.expiresAt,
      expiresAt: share.expiresAt 
        ? new Date(new Date(share.expiresAt).getTime() - new Date(share.expiresAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
        : '',
      emails: '',
    });
    setEditMode(true);
  };

  if (!file) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editMode ? `Edit Share Settings` : `Share "${file.name}"`} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Settings Form (Create or Edit) */}
        {(!share || editMode) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Show tabs only when creating a new share */}
            {!editMode && (
              <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '4px', borderRadius: '10px', marginBottom: '8px' }}>
                {[{ id: 'link', label: 'Share Link', icon: Link2 }, { id: 'email', label: 'Email', icon: Mail }].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                      background: tab === id ? 'var(--surface)' : 'transparent',
                      color: tab === id ? 'var(--text)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                    }}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            )}

            {/* Permissions */}
            <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Permissions
              </p>
              {[
                { key: 'canDownload', icon: Download, label: 'Allow Downloads' },
                { key: 'canEdit', icon: Edit2, label: 'Allow Editing' },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Icon size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
                  </div>
                  <input type="checkbox" checked={config[key]} onChange={(e) => setConfig(p => ({ ...p, [key]: e.target.checked }))} />
                </div>
              ))}
            </div>

            {/* Password */}
            <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input type="checkbox" id="has-password" checked={config.hasPassword}
                  onChange={(e) => setConfig(p => ({ ...p, hasPassword: e.target.checked }))} />
                <label htmlFor="has-password" style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Lock size={14} /> Password protect
                </label>
              </div>
              {config.hasPassword && (
                <input type="password" placeholder={editMode && share?.hasPassword ? "Enter new password to change" : "Enter password"} value={config.password}
                  onChange={(e) => setConfig(p => ({ ...p, password: e.target.value }))}
                  className="input" style={{ fontSize: '13px', height: '38px' }} />
              )}
            </div>

            {/* Expiry */}
            <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input type="checkbox" id="has-expiry" checked={config.hasExpiry}
                  onChange={(e) => setConfig(p => ({ ...p, hasExpiry: e.target.checked }))} />
                <label htmlFor="has-expiry" style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Clock size={14} /> Set expiry date
                </label>
              </div>
              {config.hasExpiry && (
                <input type="datetime-local" value={config.expiresAt}
                  onChange={(e) => setConfig(p => ({ ...p, expiresAt: e.target.value }))}
                  className="input" style={{ fontSize: '13px', height: '38px' }} />
              )}
            </div>

            {/* Email (only in create mode) */}
            {!editMode && tab === 'email' && (
              <input placeholder="Enter emails separated by commas" value={config.emails}
                onChange={(e) => setConfig(p => ({ ...p, emails: e.target.value }))}
                className="input" style={{ fontSize: '13px' }} />
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {editMode && (
                <button className="btn btn-ghost" onClick={() => setEditMode(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={editMode ? updateShare : createShare} disabled={loading} style={{ flex: 2 }}>
                {loading ? (
                  editMode ? 'Saving...' : (tab === 'email' ? 'Sharing...' : 'Creating...')
                ) : (
                  editMode ? (
                    <><Save size={15} /> Save Changes</>
                  ) : (
                    tab === 'email' ? (
                      <><Mail size={15} /> Share via Email</>
                    ) : (
                      <><Globe size={15} /> Create Share Link</>
                    )
                  )
                )}
              </button>
            </div>
          </div>
        )}

        {/* Share link display (Only when NOT editing) */}
        {share && !editMode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'rgba(124, 92, 255, 0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(124, 92, 255, 0.2)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} /> Already Shared
                </p>
                {share.hasPassword && (
                  <span style={{ fontSize: '11px', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Password Protected
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input readOnly value={share.publicLink || (share.linkToken ? `${window.location.origin}/#/share/${share.linkToken}` : '')} className="input" style={{ fontSize: '12px', height: '36px', flex: 1 }} />
                <button onClick={copyLink} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              
              {share.expiresAt && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Expires: {new Date(share.expiresAt).toLocaleDateString()} {new Date(share.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={copyLink} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={enterEditMode} className="btn btn-secondary btn-sm">
                <Edit2 size={14} /> Edit Settings
              </button>
              <button onClick={disableShare} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', gridColumn: '1 / -1' }}>
                <X size={14} /> Disable Share Link
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
