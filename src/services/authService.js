/**
 * authService.js
 * Servicio para operaciones de autenticación
 */

import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getSafeErrorMessage } from '../utils/securityConfig';

export const authService = {
  /**
   * Login con email y contraseña
   */
  loginWithEmail: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  },

  /**
   * Registrar nuevo usuario
   */
  registerWithEmail: async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  },

  /**
   * Cerrar sesión
   */
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  },

  /**
   * Actualizar perfil de usuario
   */
  updateUserProfile: async (displayName, photoURL) => {
    try {
      await updateProfile(auth.currentUser, { displayName, photoURL });
      return { success: true };
    } catch (error) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  },
};

export default authService;
