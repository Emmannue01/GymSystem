/**
 * Configuración de Seguridad
 * Validación y sanitización de datos
 */

// Sanitizar datos antes de enviar a Firestore
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().slice(0, 500); // Límite de caracteres
};

// Validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar contraseña (mínimo 8 caracteres, mayúscula, número)
export const isValidPassword = (password) => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

// Obtener error de manera segura (no exponer detalles)
export const getSafeErrorMessage = (error) => {
  const errorMessages = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres',
    'auth/invalid-email': 'Email inválido',
    'permission-denied': 'No tienes permiso para realizar esta acción',
  };

  return errorMessages[error.code] || 'Ocurrió un error. Intenta de nuevo.';
};

export default {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  getSafeErrorMessage,
};
