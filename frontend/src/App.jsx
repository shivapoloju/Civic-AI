import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route wrapper component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkbg-900 text-white font-extrabold text-sm uppercase tracking-widest animate-pulse">
        CivicAI - Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this specific panel, send them back to their matching role dashboard
    const fallbackMap = {
      admin: '/admin',
      supervisor: '/supervisor',
      officer: '/officer',
      worker: '/worker',
      citizen: '/citizen'
    };
    return <Navigate to={fallbackMap[user.role] || '/citizen'} replace />;
  }

  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Panels */}
        <Route 
          path="/citizen" 
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/worker" 
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <WorkerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor" 
          element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/officer" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'supervisor']}>
              <OfficerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Redirection routing */}
        <Route 
          path="*" 
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'supervisor' ? '/supervisor' : user.role === 'worker' ? '/worker' : user.role === 'officer' ? '/officer' : '/citizen'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
