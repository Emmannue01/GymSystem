/**
 * pages/LoginPage.js
 * Página de login - reutiliza el componente AuthForm
 */

import React from 'react';
import AuthForm from '../components/auth/AuthForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AuthForm />
    </div>
  );
};

export default LoginPage;
