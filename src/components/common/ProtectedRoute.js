/**
 * components/common/ProtectedRoute.js
 * Componente para proteger rutas
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../constants/roles';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    const redirectTo = userRole === USER_ROLES.ADMIN ? '/dashboard' : '/usuarios';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
