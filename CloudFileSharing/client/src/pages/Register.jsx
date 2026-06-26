import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Cloud, ArrowRight, CheckCircle, Shield, HardDrive, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Shield, text: 'AES-256 Cloud Encryption' },
  { icon: HardDrive, text: '5 GB Free Storage Base Tier' },
  { icon: Share2, text: 'Granular Share Controls' },
];

const Register = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Weak', color: '#EF4444' },
      { level: 2, label: 'Fair', color: '#F59E0B' },
      { level: 3, label: 'Good', color: '#34D399' },
      { level: 4, label: 'Strong', color: '#10B981' },
    ];
    return levels[score];
  };
  const strength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup({ name: data.name, email: data.email, password: data.password });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', position: 'relative', overflow: 'hidden',
    }}>
      {/* Left — Brand Side */}
      <motion.div
        className="hidden lg:flex"
        style={{
          flex: 1, flexDirection: 'column', justifyContent: 'center',
          padding: '64px', position: 'relative', zIndex: 1,
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border)',
        }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '64px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cloud size={20} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
            CloudVault
          </span>
        </Link>

        <h2 style={{
          fontSize: '36px', fontWeight: 700, color: 'var(--text)',
          lineHeight: 1.2, marginBottom: '24px', letterSpacing: '-0.02em',
        }}>
          Start Storing and <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Sharing Instantly
          </span>
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, marginBottom: '48px', maxWidth: '400px' }}>
          Get 5 GB free. Backup files, share link configs, index folders in high-performance cloud environments.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 20px', borderRadius: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                maxWidth: '360px',
              }}
            >
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Right — Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px', position: 'relative', zIndex: 1,
      }}>
        <motion.div
          style={{ width: '100%', maxWidth: '420px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo on mobile */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Cloud size={20} color="white" />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>CloudVault</span>
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Get 5 GB free storage, no credit card required
            </p>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input" style={{ paddingLeft: '48px' }} placeholder="John Doe"
                    {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} />
                </div>
                {errors.name && <p style={{ color: 'var(--error)', fontSize: '12px' }}>{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="input" style={{ paddingLeft: '48px' }} placeholder="you@example.com"
                    {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' } })} />
                </div>
                {errors.email && <p style={{ color: 'var(--error)', fontSize: '12px' }}>{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type={showPass ? 'text' : 'password'} className="input" style={{ paddingLeft: '48px', paddingRight: '48px' }} placeholder="Min 8 characters"
                    {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} style={{
                          flex: 1, height: '3px', borderRadius: '3px',
                          background: n <= strength.level ? strength.color : 'var(--border)',
                          transition: 'all 0.3s ease',
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>{strength.label}</p>
                  </div>
                )}
                {errors.password && <p style={{ color: 'var(--error)', fontSize: '12px' }}>{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" className="input" style={{ paddingLeft: '48px' }} placeholder="Confirm your password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: val => val === password || 'Passwords do not match',
                    })} />
                </div>
                {errors.confirmPassword && <p style={{ color: 'var(--error)', fontSize: '12px' }}>{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: 'var(--radius-button)', marginTop: '12px' }}
                disabled={loading}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spinSlow 0.8s linear infinite' }} />
                ) : (
                  <><span>Create Account</span><ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
