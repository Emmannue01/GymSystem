// Al inicio del componente AdminEscolar.js
import { initializeApp } from 'firebase/app';
import { getFirestore} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import getPublicConfig from './config/publicConfig';

const firebaseConfig = getPublicConfig();


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { db, auth, rtdb, storage };
export default app;

export const cloudinaryConfig = {
  
  cloudName: process.env.REACT_APP_CLOUDINARY_PROYECT_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  uploadUrl: process.env.REACT_APP_IMAGE_DATABASE_URL};