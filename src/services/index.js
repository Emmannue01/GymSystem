/**
 * index.js
 * Exporta todos los servicios
 */

export { authService, default as authServiceDefault } from './authService';
export { firestoreService, default as firestoreServiceDefault } from './firestoreService';
export { auth, db, rtdb, storage, default as firebaseApp } from './firebase';
