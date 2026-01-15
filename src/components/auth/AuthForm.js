/**
 * components/auth/AuthForm.js
 * Formulario de autenticación (login/registro)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { RateLimit, getSafeErrorMessage, isValidEmail, isValidPassword } from '../../utils/securityConfig';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';

const loginRateLimit = new RateLimit(5, 15 * 60 * 1000);

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      showError('Por favor completa todos los campos');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Email inválido');
      return;
    }

    if (!isValidPassword(password)) {
      showError('La contraseña debe tener al mínimo 8 caracteres, una mayúscula y un número');
      return;
    }

    if (!loginRateLimit.check(email)) {
      showError('Demasiados intentos. Intenta en 15 minutos');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await authService.loginWithEmail(email, password);
      } else {
        result = await authService.registerWithEmail(email, password);
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        showError(result.error);
      }
    } catch (err) {
      showError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {!isLogin && password && (
              <p className="text-xs text-gray-400 mt-1">
                {isValidPassword(password) ? '✓ Contraseña válida' : '✗ No cumple requisitos'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Cargando...
              </span>
            ) : isLogin ? (
              'Iniciar Sesión'
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="w-full mt-4 text-sm text-indigo-400 hover:text-indigo-300"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
