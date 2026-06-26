import { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const err = this.state.error;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ width: '80px', height: '80px', borderRadius: '22px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
            >
              <AlertTriangle size={36} style={{ color: 'var(--error, #EF4444)' }} />
            </motion.div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              An unexpected error occurred on this page. Your files are safe.
            </p>
            {err && (
              <details style={{ marginBottom: '28px', textAlign: 'left', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', cursor: 'pointer' }}>
                <summary style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', listStyle: 'none', userSelect: 'none' }}>
                  Show error details
                </summary>
                <pre style={{ fontSize: '11px', color: 'var(--error)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '10px', lineHeight: 1.5 }}>
                  {err.toString()}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
                style={{ height: '40px', borderRadius: 'var(--radius-button, 10px)' }}
              >
                <RefreshCw size={15} /> Try Again
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { window.location.href = '/#/dashboard'; }}
                style={{ height: '40px', borderRadius: 'var(--radius-button, 10px)' }}
              >
                <Home size={15} /> Go to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;