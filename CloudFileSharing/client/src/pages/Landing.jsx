import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, Shield, Share2, Zap, HardDrive, Lock,
  ArrowRight, Check, ChevronDown, Star, Globe,
  Upload, Download, Sparkles, MessageSquare
} from 'lucide-react';

/* ─────────────── DATA ─────────────── */
const FEATURES = [
  { icon: Shield, title: 'Enterprise Security', desc: 'AES-256 encryption, secure token authorization, and AWS S3 storage standards protect your files.', size: 'large' },
  { icon: Share2, title: 'Smart Sharing', desc: 'Share with customized links, set expiry dates, restrict downloads, and configure passwords.', size: 'normal' },
  { icon: Zap, title: 'Instant Uploads', desc: 'Optimized multi-threaded uploads, CDN caching, and direct browser delivery pipelines.', size: 'normal' },
  { icon: HardDrive, title: '5 GB Free Storage', desc: 'Start with 5 GB free storage right away. Upgrade to premium storage tiers anytime.', size: 'normal' },
  { icon: Globe, title: 'Access Anywhere', desc: 'Cross-platform compatibility. Access and manage your files securely from any device.', size: 'normal' },
  { icon: Lock, title: 'Zero Knowledge Privacy', desc: 'We value your privacy. Your data is encrypted end-to-end, meaning only you have the access keys.', size: 'large' },
];

const PRICING = [
  { name: 'Free', price: 0, storage: '5 GB', features: ['5 GB encrypted storage', 'Up to 10 active file shares', '100 MB max file size', 'Basic file previewing', 'Community support'] },
  { name: 'Pro', price: 9, storage: '100 GB', features: ['100 GB premium storage', 'Unlimited file sharing', '5 GB max file size', 'Advanced file previewing', 'Password & expiry links', '24/7 Priority support'], popular: true },
  { name: 'Enterprise', price: 29, storage: '1 TB', features: ['1 TB dedicated storage', 'Unlimited file sharing', 'No file size limits', 'Dedicated admin dashboard', 'Custom storage endpoints', 'Dedicated customer success manager'] },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Lead Product Designer', avatar: 'SC', text: 'CloudVault is the cleanest file sharing solution I\'ve ever used. The UI is pixel-perfect and spacing is beautiful.' },
  { name: 'Marcus Rivera', role: 'Senior Systems Architect', avatar: 'MR', text: 'Finally, a cloud storage tool that feels premium and developer-friendly. Spacing, performance, and dark theme are spot on.' },
  { name: 'Priya Patel', role: 'Co-founder, NextSpace', avatar: 'PP', text: 'Our team switched to CloudVault and it drastically improved our asset management workflow. Spacing is incredibly balanced.' },
];

const FAQS = [
  { q: 'Is CloudVault free to use?', a: 'Yes! CloudVault offers a lifetime free plan with 5 GB of secure cloud storage. No payment method required.' },
  { q: 'How secure is my data?', a: 'We employ state-of-the-art security practices including AES-256 encryption at rest, TLS in transit, and secure token access.' },
  { q: 'Can I share files with non-registered users?', a: 'Absolutely. You can generate secure public links. Non-registered users can download shared assets directly from the landing view.' },
  { q: 'What files are supported?', a: 'Every major file type is supported: photos, videos, archives, docs, audio, spreadsheets, designs, and code files.' },
  { q: 'Can I downgrade or cancel?', a: 'Yes, subscriptions are month-to-month. You can cancel, upgrade, or downgrade your plan at any time in your billing dashboard.' },
];

/* ─────────────── NAVBAR ─────────────── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '72px',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(5, 8, 22, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <motion.div
          whileHover={{ rotate: 8, scale: 1.05 }}
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Cloud size={20} color="white" />
        </motion.div>
        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
          CloudVault
        </span>
      </Link>

      {/* Center navigation */}
      <div className="hidden md:flex items-center gap-8" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }} className="hover:text-white">Features</a>
        <a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }} className="hover:text-white">How It Works</a>
        <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }} className="hover:text-white">Pricing</a>
        <a href="#faqs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }} className="hover:text-white">FAQ</a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '15px' }} className="hover:text-white">Sign in</Link>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-button)', fontSize: '14px', height: '38px' }}>
            Get Started <ArrowRight size={14} />
          </button>
        </Link>
      </div>
    </motion.nav>
  );
};

/* ─────────────── HERO ─────────────── */
const Hero = () => {
  return (
    <section
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '160px 32px 96px', position: 'relative',
        background: 'radial-gradient(circle at top, rgba(124, 92, 255, 0.08) 0%, transparent 60%)',
      }}
    >
      <div style={{ maxWidth: '900px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(124, 92, 255, 0.1)', border: '1px solid rgba(124, 92, 255, 0.2)',
            borderRadius: '100px', padding: '8px 20px', fontSize: '13px', fontWeight: 600,
            color: '#8B5CF6', marginBottom: '32px',
          }}>
            <Sparkles size={14} /> Meet CloudVault 2.0
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-dashboard-title"
          style={{
            fontSize: 'clamp(44px, 6vw, 72px)',
            lineHeight: 1.1, marginBottom: '32px', color: 'var(--text)',
            letterSpacing: '-0.03em',
          }}
        >
          Secure Cloud Storage <br />
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D5EF8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Shared Effortlessly
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7,
            maxWidth: '600px', margin: '0 auto 48px',
          }}
        >
          An enterprise-grade platform built to securely back up, index, organize, and share your most crucial digital assets. Experience design excellence.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '0 32px', height: '52px', borderRadius: 'var(--radius-button)' }}>
              Start Storing Free <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary" style={{ padding: '0 32px', height: '52px', borderRadius: 'var(--radius-button)' }}>
              Sign In
            </button>
          </Link>
        </motion.div>

        {/* Trust features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex', justifyContent: 'center', gap: '32px',
            marginTop: '80px', flexWrap: 'wrap', borderTop: '1px solid var(--border)',
            paddingTop: '32px',
          }}
        >
          {[
            { value: '5 GB', label: 'Free Base Tier' },
            { value: 'AES-256', label: 'Encryption Standard' },
            { value: 'Instant', label: 'File Previews' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: '120px' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>{value}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ─────────────── FEATURES ─────────────── */
const Features = () => (
  <section id="features" className="section-padding" style={{ background: 'var(--bg)' }}>
    <div className="desktop-container">
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Features</span>
        <h2 className="text-section-title" style={{ marginBottom: '20px' }}>Built for Privacy & Speed</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '560px', margin: '0 auto' }}>
          Explore premium infrastructure details, cloud parameters, and access tools configured for maximum safety.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--gap-grid)',
      }}>
        {FEATURES.map(({ icon: Icon, title, desc, size }, i) => (
          <motion.div
            key={title}
            className="card"
            style={{
              padding: 'var(--padding-card)',
              gridColumn: size === 'large' ? 'span 2' : 'span 1',
              display: 'flex', flexDirection: 'column', gap: '16px',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(124, 92, 255, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(124, 92, 255, 0.15)',
              color: 'var(--primary)',
            }}>
              <Icon size={22} />
            </div>
            <h3 className="text-card-title" style={{ fontSize: '20px', fontWeight: 700 }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────── HOW IT WORKS ─────────────── */
const HowItWorks = () => (
  <section id="how-it-works" className="section-padding" style={{ background: 'var(--bg-elevated)', borderY: '1px solid var(--border)' }}>
    <div className="desktop-container">
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '16px' }}>How it works</span>
        <h2 className="text-section-title" style={{ marginBottom: '20px' }}>Getting started in three steps</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '560px', margin: '0 auto' }}>
          We design systems that optimize complexity. Get secure file access in less than a minute.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gap-grid)' }}>
        {[
          { step: '01', icon: Shield, title: 'Register Securely', desc: 'Create your storage account in seconds. All initial keys are generated client-side.' },
          { step: '02', icon: Upload, title: 'Upload & Index', desc: 'Drag and drop any folder or format structure directly. Watch live index updates.' },
          { step: '03', icon: Share2, title: 'Secure Links', desc: 'Create share points, set download limits, restrict permissions, and share instantly.' },
        ].map(({ step, icon: Icon, title, desc }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card"
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(124, 92, 255, 0.25)',
              }}>
                <Icon size={26} color="white" />
              </div>
              <span style={{
                position: 'absolute', top: '-8px', right: '-8px',
                background: 'var(--surface)', border: '2px solid var(--primary)',
                width: '24px', height: '24px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, color: 'var(--text)',
              }}>{step}</span>
            </div>
            <h3 className="text-card-title" style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────── TESTIMONIALS ─────────────── */
const Testimonials = () => (
  <section className="section-padding" style={{ background: 'var(--bg)' }}>
    <div className="desktop-container">
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Feedback</span>
        <h2 className="text-section-title" style={{ marginBottom: '20px' }}>What our users say</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--gap-grid)' }}>
        {TESTIMONIALS.map(({ name, role, avatar, text }, i) => (
          <motion.div
            key={name}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}
          >
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} fill="#FCD34D" style={{ color: '#FCD34D' }} />
                ))}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{text}"
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'white',
              }}>{avatar}</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────── PRICING ─────────────── */
const Pricing = () => (
  <section id="pricing" className="section-padding" style={{ background: 'var(--bg-elevated)', borderY: '1px solid var(--border)' }}>
    <div className="desktop-container">
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Pricing</span>
        <h2 className="text-section-title" style={{ marginBottom: '20px' }}>Simple Transparent Tiers</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '560px', margin: '0 auto' }}>
          Choose a storage volume size configured exactly for your workflow. Cancel or scale anytime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--gap-grid)', alignItems: 'stretch' }}>
        {PRICING.map(({ name, price, storage, features, popular }, i) => (
          <motion.div
            key={name}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              border: popular ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: popular ? 'rgba(124, 92, 255, 0.03)' : 'var(--surface)',
            }}
          >
            <div>
              {popular && (
                <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Most Popular</span>
              )}
              <h3 className="text-card-title" style={{ marginBottom: '8px' }}>{name}</h3>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text)' }}>${price}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>/month</span>
              </div>
              <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '15px', marginBottom: '24px' }}>{storage} secure storage</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {features.map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'rgba(52, 211, 153, 0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--success)'
                    }}>
                      <Check size={12} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button className={popular ? 'btn btn-primary' : 'btn btn-secondary'} style={{ width: '100%', borderRadius: 'var(--radius-button)' }}>
                Get Started
              </button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────── FAQ ─────────────── */
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faqs" className="section-padding" style={{ background: 'var(--bg)' }}>
      <div className="desktop-container" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '16px' }}>FAQ</span>
          <h2 className="text-section-title" style={{ marginBottom: '20px' }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FAQS.map(({ q, a }, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={q}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
                className="hover:border-white/10"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '20px 24px', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>{q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p style={{
                        padding: '0 24px 20px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                      }}>{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ─────────────── CTA ─────────────── */
const CTA = () => (
  <section className="section-padding" style={{ background: 'var(--bg)' }}>
    <div className="desktop-container" style={{ maxWidth: '800px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        style={{
          padding: '64px 48px',
          borderRadius: 'var(--radius-card)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(109, 94, 248, 0.02) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <h2 className="text-section-title" style={{ fontSize: '36px', marginBottom: '16px' }}>Ready to Secure Your Files?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Create an account and start managing your secure assets within a minute. Upgrade whenever you need more space.
        </p>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ padding: '0 32px', height: '52px', borderRadius: 'var(--radius-button)' }}>
            Get Started Free
          </button>
        </Link>
      </motion.div>
    </div>
  </section>
);

/* ─────────────── FOOTER ─────────────── */
const Footer = () => (
  <footer style={{
    padding: '48px 32px', borderTop: '1px solid var(--border)', textAlign: 'center',
    background: 'var(--bg)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Cloud size={16} color="white" />
      </div>
      <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>
        CloudVault
      </span>
    </div>
    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
      © {new Date().getFullYear()} CloudVault. Secure Cloud Storage system. All rights reserved.
    </p>
  </footer>
);

/* ─────────────── PAGE ─────────────── */
const Landing = () => (
  <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}>
    <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
    <Testimonials />
    <Pricing />
    <FAQ />
    <CTA />
    <Footer />
  </div>
);

export default Landing;
