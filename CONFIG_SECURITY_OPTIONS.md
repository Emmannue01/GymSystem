/**
 * Solución para ocultar credenciales de Firebase en el build
 * 
 * OPCIÓN 1: Usar variables de entorno sin REACT_APP_
 * (No se incluirán en el bundle, pero tampoco en el cliente)
 * 
 * OPCIÓN 2: Crear una función serverless en Vercel (recomendado)
 * 
 * OPCIÓN 3: Usar un archivo dinámico cargado en tiempo de ejecución
 */

// ============================================
// OPCIÓN 2: Función Serverless (RECOMENDADO)
// ============================================

// Crear archivo: api/config.js en la raíz del proyecto

/*
module.exports = (req, res) => {
  // Validar que sea GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Proteger con CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL || '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Devolver configuración desde variables de entorno
  const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  res.status(200).json(config);
};
*/

// ============================================
// OPCIÓN 3: Env sin REACT_APP_
// ============================================

/*
En .env.production:

FIREBASE_API_KEY=tu_clave_aqui
FIREBASE_AUTH_DOMAIN=tu_dominio_aqui
FIREBASE_PROJECT_ID=tu_proyecto_aqui
(etc)

En firebase.js:
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

⚠️ PROBLEMA: Sin REACT_APP_, las variables no se cargan en Vercel
*/

// ============================================
// MEJOR SOLUCIÓN: Usar variables de Vercel
// ============================================

/*
En Vercel Dashboard → Settings → Environment Variables

Configura SOLO para: Production (no Development/Preview)

Luego en firebase.js usa:
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  ...
};

Esto asegura que:
✓ En Production (vercel.com) - se incluyen en build
✓ En Preview (PRs) - usa config diferente o no incluye
✓ En Development (local) - uses .env.local

Y las reglas de Firestore protegen los datos
*/

export default {
  note: 'Ver comentarios en este archivo para implementar',
};
