import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Share2, Star, Trash2,
  BarChart2, Settings, Shield, LogOut, X, Cloud,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/index.jsx';
import { formatBytes } from '../../utils/formatters';

const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',          icon: LayoutDashboard },
  { label: 'My Files',        path: '/dashboard/files',    icon: FolderOpen },
  { label: 'Shared Files',    path: '/dashboard/shared',   icon: Share2 },
  { label: 'Favorites',       path: '/dashboard/favorites',icon: Star },
  { label: 'Trash',           path: '/dashboard/trash',    icon: Trash2 },
  { label: 'Analytics',       path: '/dashboard/analytics',icon: BarChart2 },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const storagePercent = user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0;
  const isWarning = storagePercent >= 80;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo matching Figma */}
        <div className="flex items-center justify-between px-4 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <NavLink to="/dashboard" className="flex items-center gap-3 no-underline">
            <div
              style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Cloud size={20} color="white" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
              CloudVault
            </span>
          </NavLink>
          <button className="btn btn-ghost btn-sm md:hidden" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-8 px-4 py-6">
          <p className="text-xs font-medium uppercase tracking-wider px-2 mb-4"
            style={{ color: 'var(--text-muted)' }}>
            MAIN MENU
          </p>
          <ul className="space-y-1" style={{ listStyle: 'none' }}>
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={path === '/dashboard'}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onClose?.()}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider px-2 mb-4 mt-8"
                style={{ color: 'var(--text-muted)' }}>
                ADMINISTRATION
              </p>
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onClose?.()}
              >
                <Shield size={18} />
                <span>Admin Panel</span>
              </NavLink>
            </>
          )}
          
          <div className="mt-8">
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onClose?.()}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* Storage card matching Figma */}
        {user && (
          <div className="px-4 mb-4">
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '9px' }}>
              <div className="flex items-center gap-2 mb-1">
                <HardDrive size={14} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>STORAGE</span>
              </div>
              <div className="storage-bar mb-2">
                <motion.div
                  className={`storage-bar-fill ${isWarning ? 'warning' : ''}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(storagePercent, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {formatBytes(user.storageUsed)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatBytes(user.storageLimit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* User footer */}
        <div className="px-4 pb-1">
          <div className="flex items-center gap-3 p-3" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '16px'
          }}>
            <Avatar src={user?.avatar} name={user?.name} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {user?.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.plan || 'free'} Plan
              </p>
            </div>
            <motion.button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: '8px', height: 'auto' }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            >
              <LogOut size={16} style={{ color: 'var(--error)' }} />
            </motion.button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
