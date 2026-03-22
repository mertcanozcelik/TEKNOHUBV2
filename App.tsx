import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

console.log('App.tsx loaded');
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Roadmaps from './pages/Roadmaps';
import Research from './pages/Research';
import GlobalFeed from './pages/GlobalFeed';
import Settings from './pages/Settings';
import Login from './pages/Login';
import TaxonomyMatcher from './pages/TaxonomyMatcher';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/roadmaps" element={<ProtectedRoute><Roadmaps /></ProtectedRoute>} />
      <Route path="/roadmaps/:id" element={<ProtectedRoute><Roadmaps /></ProtectedRoute>} />
      <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><GlobalFeed /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/taxonomy-matcher" element={<ProtectedRoute><TaxonomyMatcher /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
