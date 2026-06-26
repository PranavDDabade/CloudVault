import { motion } from 'framer-motion';
import { Cloud } from 'lucide-react';

// Badge component
export const Badge = ({ children, variant = 'primary', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

// Spinner component
export const Spinner = ({ size = 20, className = '' }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24" fill="none"
    className={`${className}`}
    style={{ color: '#A78BFA', animation: 'spinSlow 1s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.416" strokeDashoffset="10" strokeLinecap="round" />
  </svg>
);

// PageLoader — Premium animated loader
export const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--bg)',
    position: 'relative', overflow: 'hidden',
  }}>
    {/* Background glow */}
    <div style={{
      position: 'absolute', width: '300px', height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
      filter: 'blur(60px)',
    }} />

    <motion.div
      style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated logo */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '64px', height: '64px', margin: '0 auto 20px',
          borderRadius: '18px', position: 'relative',
        }}
      >
        <div style={{
          width: '100%', height: '100%', borderRadius: '18px',
          background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
        }}>
          <Cloud size={30} color="white" />
        </div>
      </motion.div>

      {/* Loading bar */}
      <div style={{
        width: '120px', height: '3px', borderRadius: '3px',
        background: 'var(--surface-3)', margin: '0 auto 16px',
        overflow: 'hidden',
      }}>
        <motion.div
          style={{
            height: '100%', borderRadius: '3px',
            background: 'linear-gradient(90deg, #7C3AED, #2DD4BF)',
            width: '40%',
          }}
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
        Loading CloudVault...
      </p>
    </motion.div>
  </div>
);

// Skeleton loaders
export const SkeletonCard = () => (
  <div className="card" style={{ padding: '20px' }}>
    <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '16px' }} />
    <div className="skeleton" style={{ height: '28px', width: '60%', marginBottom: '8px' }} />
    <div className="skeleton" style={{ height: '12px', width: '80%' }} />
  </div>
);

export const SkeletonRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '6px' }} />
      <div className="skeleton" style={{ height: '12px', width: '30%' }} />
    </div>
    <div className="skeleton" style={{ height: '12px', width: '60px' }} />
  </div>
);

// Empty state
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center'
    }}
  >
    {Icon && (
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          width: '80px', height: '80px', borderRadius: '22px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(45,212,191,0.06))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px', border: '1px solid rgba(124,58,237,0.1)',
        }}
      >
        <Icon size={34} style={{ color: '#A78BFA' }} />
      </motion.div>
    )}
    <h3 style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px',
    }}>{title}</h3>
    {description && (
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '340px', lineHeight: 1.6, marginBottom: '24px' }}>
        {description}
      </p>
    )}
    {action}
  </motion.div>
);

// Divider
export const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    {label && <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>}
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

// Avatar with gradient ring
export const Avatar = ({ src, name, size = 36 }) => {
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0
    }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  );
};
