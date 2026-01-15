/**
 * firestoreService.js
 * Servicio para operaciones con Firestore
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

export const firestoreService = {
  /**
   * Obtener un documento por ID
   */
  getDocument: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error(`Error obteniendo ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Obtener todos los documentos de una colección
   */
  getCollection: async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error obteniendo colección ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo documento
   */
  createDocument: async (collectionName, docId, data) => {
    try {
      await setDoc(doc(db, collectionName, docId), data);
      return { success: true };
    } catch (error) {
      console.error(`Error creando documento en ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar un documento
   */
  updateDocument: async (collectionName, docId, data) => {
    try {
      await updateDoc(doc(db, collectionName, docId), data);
      return { success: true };
    } catch (error) {
      console.error(`Error actualizando documento en ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un documento
   */
  deleteDocument: async (collectionName, docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return { success: true };
    } catch (error) {
      console.error(`Error eliminando documento en ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Consultar documentos con filtro
   */
  queryDocuments: async (collectionName, field, operator, value) => {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error consultando ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Batch update (múltiples documentos)
   */
  batchUpdate: async (operations) => {
    try {
      const batch = writeBatch(db);
      operations.forEach(({ type, collectionName, docId, data }) => {
        const docRef = doc(db, collectionName, docId);
        if (type === 'set') batch.set(docRef, data);
        if (type === 'update') batch.update(docRef, data);
        if (type === 'delete') batch.delete(docRef);
      });
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error en batch update:', error);
      throw error;
    }
  },
};

export default firestoreService;
