import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui/index.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
const PublicShare = lazy(() => import('./pages/PublicShare'));

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Landing         = lazy(() => import('./pages/Landing'));
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const MyFiles         = lazy(() => import('./pages/MyFiles'));
const SharedFiles     = lazy(() => import('./pages/SharedFiles'));
const Favorites       = lazy(() => import('./pages/Favorites'));
const Trash           = lazy(() => import('./pages/Trash'));
const StorageAnalytics= lazy(() => import('./pages/StorageAnalytics'));
const Profile         = lazy(() => import('./pages/Profile'));
const Settings        = lazy(() => import('./pages/Settings'));
const Admin           = lazy(() => import('./pages/Admin'));
const NotFound        = lazy(() => import('./pages/NotFound'));

// ── Route guards ──────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <HelmetProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/share/:token" element={<PublicShare />} />

          {/* Protected dashboard routes — each page wrapped in its own ErrorBoundary */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="files" element={<ErrorBoundary><MyFiles /></ErrorBoundary>} />
            <Route path="shared" element={<ErrorBoundary><SharedFiles /></ErrorBoundary>} />
            <Route path="favorites" element={<ErrorBoundary><Favorites /></ErrorBoundary>} />
            <Route path="trash" element={<ErrorBoundary><Trash /></ErrorBoundary>} />
            <Route path="analytics" element={<ErrorBoundary><StorageAnalytics /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="admin" element={<AdminRoute><ErrorBoundary><Admin /></ErrorBoundary></AdminRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HelmetProvider>
  );
}

export default App;

