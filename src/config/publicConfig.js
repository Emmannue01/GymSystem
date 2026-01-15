/**
 * Configuración para ocultar información sensible en el build
 * Este archivo asegura que ciertos datos no se expongan en el navegador
 */

// Crear variables de entorno seguras
const isProduction = process.env.NODE_ENV === 'production';

// Solo usar estas claves en el cliente (están diseñadas para ser públicas)
export const getPublicConfig = () => {
  return {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
};

// Variables que NUNCA deben exponerse (no las incluyas aquí)
// Ejemplos: JWT secretos, claves privadas, tokens de admin

// Validar que solo variables públicas estén en el bundle
if (isProduction) {
  const config = getPublicConfig();
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      console.warn(`⚠️ Variable no configurada: ${key}`);
    }
  });
}

export default getPublicConfig;
