import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Menu from './pages/Menu';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import KitchenMonitor from './pages/KitchenMonitor';
import DailyReport from './pages/DailyReport';
import OrderHistory from './pages/OrderHistory';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const getVerifiedRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const decoded = parseJwt(token);
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
    localStorage.clear();
    return null;
  }
  return decoded.role;
};

const AdminRoute = ({ children }) => {
  const role = getVerifiedRole();
  if (role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const role = getVerifiedRole();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
            duration: 4000,
            style: {
                background: '#0b3d91',
                color: '#fff',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 'bold'
            }
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/kitchen" element={<AdminRoute><KitchenMonitor /></AdminRoute>} />
        <Route path="/admin/report" element={<AdminRoute><DailyReport /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;