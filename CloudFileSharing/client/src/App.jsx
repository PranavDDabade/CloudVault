import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui/index.jsx';
import DashboardLayout from './components/layout/DashboardLayout';

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

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="files" element={<MyFiles />} />
            <Route path="shared" element={<SharedFiles />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="trash" element={<Trash />} />
            <Route path="analytics" element={<StorageAnalytics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HelmetProvider>
  );
}

export default App;
