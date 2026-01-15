/**
 * Función Serverless de Vercel para servir configuración de Firebase
 * Las credenciales se cargan desde variables de entorno del servidor
 * y NO se exponen en el código del cliente
 * 
 * Ruta: GET /api/config/firebase
 */

export default function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validar autenticación básica (opcional pero recomendado)
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    'https://tudominio.com',
    'https://tudominio.vercel.app',
    'http://localhost:3000', // desarrollo
  ];

  // En producción, valida el origen
  if (process.env.NODE_ENV === 'production') {
    if (!origin || !allowedOrigins.some(o => origin.includes(o))) {
      return res.status(403).json({ error: 'CORS error' });
    }
  }

  // Headers de seguridad
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validar que las variables de entorno existan
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('Variables de entorno faltantes:', missing);
    return res.status(500).json({ error: 'Configuración incompleta del servidor' });
  }

  // Devolver configuración
  const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || '',
  };

  res.status(200).json(config);
}
