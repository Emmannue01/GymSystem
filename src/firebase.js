// Al inicio del componente AdminEscolar.js
import { initializeApp } from 'firebase/app';
import { getFirestore} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

let firebaseConfig = null;
let app = null;

// Cargar configuración desde servidor (serverless) en producción
// En desarrollo, usar variables de entorno locales
const initializeFirebase = async () => {
  if (app) return app;

  try {
    if (process.env.NODE_ENV === 'production') {
      // En producción, obtener configuración del servidor
      // Las variables de entorno NO se exponen en el bundle
      const response = await fetch('/api/config/firebase');
      if (!response.ok) throw new Error('Failed to load firebase config');
      firebaseConfig = await response.json();
    } else {
      // En desarrollo, usar variables de entorno locales
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

    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error inicializando Firebase:', error);
    // Fallback: usar variables de entorno
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
    app = initializeApp(firebaseConfig);
  }

  return app;
};

// Inicializar Firebase al cargar el módulo
initializeFirebase();

const db = firebaseConfig ? getFirestore(app) : null;
const auth = firebaseConfig ? getAuth(app) : null;
const rtdb = firebaseConfig ? getDatabase(app) : null;
const storage = firebaseConfig ? getStorage(app) : null;

export { db, auth, rtdb, storage };
export default app;

export const cloudinaryConfig = {
  
  cloudName: process.env.REACT_APP_CLOUDINARY_PROYECT_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  uploadUrl: process.env.REACT_APP_IMAGE_DATABASE_URL};