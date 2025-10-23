import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';

const App = () => (
  <Router>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<UserDashboard />} />
          <Route path="family" element={<FamilyDashboard />} />
          <Route path="pharmacist" element={<PharmacistDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </Router>
);

export default App;