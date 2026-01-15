import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

/**
 * Hook para proteger rutas privadas
 * Cierra sesión después de inactividad
 */
export const useProtectedRoute = (allowedRoles, userRole) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const inactivityTimeout = 30 * 60 * 1000; // 30 minutos
  let inactivityTimer;

  // Renovar timer al detectar actividad
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      logout();
    }, inactivityTimeout);
  };

  const logout = async () => {
    try {
      await auth.signOut();
      sessionStorage.clear();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/', { replace: true });
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      navigate('/', { replace: true });
      return;
    }

    setIsAuthorized(true);

    // Detectar actividad del usuario
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Iniciar timer
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [allowedRoles, userRole, navigate]);

  return { isAuthorized, logout };
};

/**
 * Hook para detectar cambios de autenticación
 */
export const useAuthState = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
};

export default { useProtectedRoute, useAuthState };
