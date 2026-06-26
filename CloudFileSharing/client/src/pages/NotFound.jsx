import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Cloud } from 'lucide-react';

const NotFound = () => (
  <div style={{
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', textAlign: 'center', padding: '24px',
    position: 'relative', overflow: 'hidden'
  }}>
    <div className="animated-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
      style={{ position: 'relative', zIndex: 1, background: 'var(--surface)', padding: '60px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{
          width: '90px', height: '90px', borderRadius: '28px',
          background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px', boxShadow: '0 12px 40px rgba(124,58,237,0.4)',
        }}
      >
        <Cloud size={44} color="white" />
      </motion.div>

      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '120px', fontWeight: 900, lineHeight: 1,
        background: 'linear-gradient(135deg, #C084FC, #5EEAD4)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '16px', letterSpacing: '-4px',
      }}>
        404
      </h1>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
        Lost in the cloud
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '40px', maxWidth: '380px', margin: '0 auto 40px', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
      </p>

      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        <motion.div className="btn btn-primary" style={{ gap: '10px', fontSize: '16px', padding: '14px 32px', background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)' }}
          whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }} whileTap={{ scale: 0.95 }}>
          <Home size={20} /> Return to Dashboard
        </motion.div>
      </Link>
    </motion.div>
  </div>
);

export default NotFound;
