import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import UploadModal from '../files/UploadModal';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);

  const handleSearch = useCallback((q) => setSearchQuery(q), []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="main-content">
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          onUploadClick={() => setUploadOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
        />

        <motion.main
          style={{ padding: '24px', minHeight: 'calc(100vh - 64px)', position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet context={{ searchQuery, currentFolder, setCurrentFolder, openUpload: () => setUploadOpen(true) }} />
        </motion.main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={currentFolder}
      />
    </div>
  );
};

export default DashboardLayout;
