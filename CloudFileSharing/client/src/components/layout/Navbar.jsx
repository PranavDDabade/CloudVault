import { useState, useRef, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Search, Bell, Sun, Moon, Upload,
  X, CheckCheck, Trash2, Settings, User, LogOut, File as FileIcon, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../ui/index.jsx';
import { formatDate } from '../../utils/formatters';
import { useDebounceValue } from '../../hooks/useDebounce';
import { fileService } from '../../services/fileService';

const Navbar = ({ onMenuToggle, onUploadClick, searchQuery, onSearchChange }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearch = useDebounceValue(searchQuery, 400);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearch || !debouncedSearch.trim()) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const { data } = await fileService.getFiles({ search: debouncedSearch, limit: 5 });
        setSuggestions(data.files || []);
      } catch (error) {
        console.error('Failed to fetch suggestions', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSuggestionClick = (file) => {
    setShowSuggestions(false);
    startTransition(() => onSearchChange?.(''));
    navigate('/dashboard/files', { state: { previewFile: file } });
  };

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: '68px', display: 'flex', alignItems: 'center',
      padding: '0 32px', gap: '16px',
      background: 'var(--navbar-bg)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <button className="btn btn-ghost btn-sm md:hidden" onClick={onMenuToggle} style={{ padding: '8px' }}>
        <Menu size={20} />
      </button>

      {/* Pill Search Bar matching Figma */}
      <div className="relative flex-1 max-w-md" ref={searchContainerRef}>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search files, folders..."
          value={searchQuery || ''}
          onFocus={() => setShowSuggestions(true)}
          onChange={(e) => {
            startTransition(() => onSearchChange?.(e.target.value));
            setShowSuggestions(true);
          }}
          className="input search-pill"
          style={{
            paddingLeft: '44px', paddingRight: '40px', height: '44px',
            fontSize: '14px', background: 'var(--surface)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => startTransition(() => onSearchChange?.(''))}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={14} />
          </button>
        )}

        <AnimatePresence>
          {showSuggestions && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              style={{
                position: 'absolute', top: '56px', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 50,
              }}
            >
              <div className="p-2 border-b flex justify-between items-center" style={{ borderBottomColor: 'var(--border)', background: 'var(--surface-hover)' }}>
                <span className="text-xs font-semibold pl-2" style={{ color: 'var(--text-secondary)' }}>Files</span>
                {loadingSuggestions && <Loader2 size={12} className="animate-spin mr-2" style={{ color: 'var(--primary)' }} />}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {!loadingSuggestions && suggestions.length === 0 ? (
                  <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No files found for "{searchQuery}"</div>
                ) : (
                  suggestions.map((file) => (
                    <div
                      key={file._id}
                      onClick={() => handleSuggestionClick(file)}
                      className="p-3 cursor-pointer flex items-center gap-3 hover-bg-surface-hover transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'rgba(124, 92, 255, 0.1)', color: 'var(--primary)' }}>
                        <FileIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{file.formattedSize || (file.size / 1024 / 1024).toFixed(2) + ' MB'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          className="btn btn-primary hidden md:flex"
          onClick={onUploadClick}
          style={{ borderRadius: 'var(--radius-button)', fontWeight: 600, height: '40px', padding: '0 20px' }}
        >
          <Upload size={16} /> Upload
        </button>

        <button
          className="btn btn-ghost"
          style={{ padding: '8px', borderRadius: '50%' }}
          onClick={toggleTheme}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', position: 'relative' }}
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute', top: '6px', right: '6px',
                  width: '8px', height: '8px',
                  background: 'var(--primary)',
                  borderRadius: '50%',
                  border: '2px solid var(--bg)'
                }}
              />
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                style={{
                  position: 'absolute', top: '56px', right: 0, width: '340px',
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 50,
                }}
              >
                <div className="flex justify-between items-center p-4 border-b" style={{ borderBottomColor: 'var(--border)' }}>
                  <span className="font-semibold text-sm">Notifications</span>
                  <div className="flex gap-2">
                    <button onClick={markAllAsRead} className="btn btn-ghost btn-sm px-2"><CheckCheck size={14} /></button>
                    <button onClick={clearAll} className="btn btn-ghost btn-sm px-2 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-500">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif._id} onClick={() => markAsRead(notif._id)}
                        className="p-4 cursor-pointer flex gap-3"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: notif.isRead ? 'transparent' : 'rgba(124, 92, 255, 0.08)'
                        }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{notif.title}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{formatDate(notif.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px' }}
          >
            <Avatar src={user?.avatar} name={user?.name} size={36} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                style={{
                  position: 'absolute', top: '56px', right: 0, width: '220px',
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 50,
                }}
              >
                <div className="p-4 border-b" style={{ borderBottomColor: 'var(--border)', background: 'var(--surface-hover)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => { navigate('/dashboard/profile'); setShowProfile(false); }} className="context-menu-item">
                    <User size={16} /> Profile
                  </button>
                  <button onClick={() => { navigate('/dashboard/settings'); setShowProfile(false); }} className="context-menu-item">
                    <Settings size={16} /> Settings
                  </button>
                  <div className="h-px my-2" style={{ background: 'var(--border)' }} />
                  <button onClick={handleLogout} className="context-menu-item danger">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
