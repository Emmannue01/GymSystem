/**
 * Configuración de Seguridad
 * No expongas datos sensibles en el cliente
 */

// Validar que las variables de entorno estén configuradas
export const validateEnvironment = () => {
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_PROJECT_ID',
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.warn(`⚠️ Variable de entorno faltante: ${varName}`);
    }
  });
};

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

// Rate limiting simple (cliente)
export class RateLimit {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = {};
  }

  check(identifier) {
    const now = Date.now();
    if (!this.attempts[identifier]) {
      this.attempts[identifier] = [];
    }

    // Limpiar intentos antiguos
    this.attempts[identifier] = this.attempts[identifier].filter(
      time => now - time < this.windowMs
    );

    if (this.attempts[identifier].length >= this.maxAttempts) {
      return false;
    }

    this.attempts[identifier].push(now);
    return true;
  }
}

// Tokens seguros
export const generateSecureToken = () => {
  return Math.random().toString(36).substring(2, 15);
};

export default {
  validateEnvironment,
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  getSafeErrorMessage,
  RateLimit,
  generateSecureToken,
};
