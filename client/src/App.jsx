import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FamilyDashboard from './pages/FamilyDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import DashboardPage from './pages/user/DashboardPage';
import SchedulePage from './pages/user/SchedulePage';
import CheckupPage from './pages/user/CheckupPage';
import ProfilePage from './pages/user/ProfilePage';

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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={(
              <ProtectedRoute allowedRoles={["user"]}>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="schedule"
            element={(
              <ProtectedRoute allowedRoles={["user"]}>
                <SchedulePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="checkup"
            element={(
              <ProtectedRoute allowedRoles={["user"]}>
                <CheckupPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="profile"
            element={(
              <ProtectedRoute allowedRoles={["user"]}>
                <ProfilePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="family"
            element={(
              <ProtectedRoute allowedRoles={["family"]}>
                <FamilyDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="pharmacist"
            element={(
              <ProtectedRoute allowedRoles={["pharmacist"]}>
                <PharmacistDashboard />
              </ProtectedRoute>
            )}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </Router>
);

export default App;