import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import './index.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading DigiDrive... </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
      <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/admin/*" element={
        <ProtectedRoute requireAdmin>
          {user?.requirePasswordChange ? <Navigate to="/change-password" replace /> : <AdminDashboard />}
        </ProtectedRoute>
      } />

      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          {user?.requirePasswordChange ? <Navigate to="/change-password" replace /> : <EmployeeDashboard />}
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '12px',
                fontSize: '15px',
                padding: '14px 20px',
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                maxWidth: '500px',
              },
              success: {
                style: {
                  background: 'rgba(6, 78, 59, 0.95)',
                  border: '1px solid #059669',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                },
                iconTheme: { primary: '#34d399', secondary: '#064e3b' },
              },
              error: {
                style: {
                  background: 'rgba(127, 29, 29, 0.95)',
                  border: '1px solid #ef4444',
                  color: '#fff',
                  fontWeight: '600',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
