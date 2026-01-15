/**
 * constants/roles.js
 * Constantes de roles de usuario
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  RECEPCION: 'recepcion',
  ENTRENADOR: 'entrenador',
  CLIENTE: 'cliente',
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['*'], // Acceso total
  [USER_ROLES.RECEPCION]: ['/recepcion', '/usuarios'],
  [USER_ROLES.ENTRENADOR]: ['/entrenadores', '/usuarios'],
  [USER_ROLES.CLIENTE]: ['/usuarios'],
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.RECEPCION]: 'Recepción',
  [USER_ROLES.ENTRENADOR]: 'Entrenador',
  [USER_ROLES.CLIENTE]: 'Cliente',
};

export default USER_ROLES;
