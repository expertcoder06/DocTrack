/**
 * App.tsx – Root component with React Router setup and protected routes.
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { NewApplicationPage } from './pages/NewApplication';
import { ApplicationDetailPage } from './pages/ApplicationDetail';
import { AdminDashboard } from './pages/AdminDashboard';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
        <p>Initialising DocTrack...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Auth routes */}
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />}
      />
      <Route
        path="/register"
        element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
      />

      {/* Customer routes */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/applications/new" element={<NewApplicationPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Shared authenticated route – both roles can view application detail */}
      <Route element={<ProtectedRoute />}>
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Navbar />
          <AppRoutes />
          <ToastContainer />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
