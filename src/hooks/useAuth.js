import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

/**
 * Hook para proteger rutas privadas
 */
export const useProtectedRoute = (allowedRoles, userRole) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

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
  }, [allowedRoles, userRole, navigate]);

  return { isAuthorized };
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
