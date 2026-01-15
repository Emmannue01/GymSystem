/**
 * Carga la configuración de Firebase desde un servidor
 * Esto oculta las credenciales del bundle JavaScript
 */

let firebaseConfig = null;

export const loadFirebaseConfig = async () => {
  if (firebaseConfig) return firebaseConfig;

  try {
    // En producción, llamar a un endpoint que devuelve la config
    // En desarrollo, usar variables de entorno
    if (process.env.NODE_ENV === 'production') {
      // Opción 1: Si tienes un backend
      const response = await fetch('/api/config/firebase', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to load config');
      firebaseConfig = await response.json();
    } else {
      // Desarrollo: usar variables de entorno normales
      firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
      };
    }

    return firebaseConfig;
  } catch (error) {
    console.error('Error cargando configuración de Firebase:', error);
    // Fallback a variables de entorno
    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    };
  }
};

export default loadFirebaseConfig;
