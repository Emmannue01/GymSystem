/**
 * App.js
 * Componente principal de la aplicación
 * Gestiona las rutas y el enrutamiento
 */

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components';
import {
  LoginPage,
  DashboardPage,
  UsuariosPage,
  EntrenadoresPage,
  RecepcionPage,
} from './pages';
import { USER_ROLES } from './constants/roles';
import './App.css';

/**
 * Componente principal que define todas las rutas
 */
const AppRoutes = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta de login */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                userRole === USER_ROLES.ADMIN
                  ? '/dashboard'
                  : userRole === USER_ROLES.RECEPCION
                  ? '/recepcion'
                  : userRole === USER_ROLES.ENTRENADOR
                  ? '/entrenadores'
                  : '/usuarios'
              }
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Rutas protegidas - Admin */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas protegidas - Recepción */}
      <Route
        path="/recepcion"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.RECEPCION]}>
            <RecepcionPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas protegidas - Entrenador */}
      <Route
        path="/entrenadores"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ENTRENADOR]}>
            <EntrenadoresPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas protegidas - Cliente */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.CLIENTE]}>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * Componente principal App
 */
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;