import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// Animated number counter
const AnimatedValue = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const num = parseInt(value);
    if (isNaN(num)) {
      setDisplay(value);
      return;
    }
    let start = 0;
    const duration = 800;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (num - start) * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, inView]);

  return <span ref={ref}>{typeof value === 'string' && isNaN(parseInt(value)) ? value : display}</span>;
};

const StatsCard = ({ title, value, subtitle, icon: Icon, color, gradient, index = 0 }) => (
  <motion.div
    className="card"
    style={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '140px',
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
  >
    {/* Top Row: Icon top-left, Label top-right */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      {Icon && (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: gradient || color || 'rgba(124, 92, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Icon size={18} />
        </div>
      )}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </span>
    </div>

    {/* Bottom Row: Large number, subtitle underneath */}
    <div style={{ marginTop: '20px' }}>
      <p
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}
      >
        <AnimatedValue value={value} />
      </p>
      {subtitle && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {subtitle}
        </p>
      )}
    </div>
  </motion.div>
);

export default StatsCard;
