/**
 * Configuración de Usuarios de Prueba para Desarrollo
 * Este archivo contiene la configuración de los usuarios demo disponibles
 */

export const DEMO_USERS = {
  admin: {
    uid: 'demo-admin-001',
    email: 'admin@gymsystem.local',
    name: 'Admin',
    lastname: 'Usuario',
    rol: 'admin',
    color: 'blue',
    icon: 'shield'
  },
  entrenador: {
    uid: 'demo-trainer-001',
    email: 'entrenador@gymsystem.local',
    name: 'Entrenador',
    lastname: 'Certificado',
    rol: 'entrenador',
    color: 'purple',
    icon: 'chalkboard'
  },
  recepcion: {
    uid: 'demo-reception-001',
    email: 'recepcion@gymsystem.local',
    name: 'Recepcionista',
    lastname: 'Sistema',
    rol: 'recepcion',
    color: 'green',
    icon: 'door'
  },
  usuario: {
    uid: 'demo-user-001',
    email: 'usuario@gymsystem.local',
    name: 'Usuario',
    lastname: 'Miembro',
    rol: 'cliente',
    color: 'orange',
    icon: 'user'
  }
};

/**
 * Roles disponibles y sus permisos
 */
export const ROLES = {
  admin: {
    label: 'Administrador',
    description: 'Acceso completo al sistema',
    permissions: ['read', 'write', 'delete', 'admin'],
    routes: ['/Dashboard', '/usuarios', '/entrenadores', '/recepcion']
  },
  entrenador: {
    label: 'Entrenador',
    description: 'Gestión de rutinas y clientes',
    permissions: ['read', 'write'],
    routes: ['/entrenadores']
  },
  recepcion: {
    label: 'Recepción',
    description: 'Control de acceso y asistencia',
    permissions: ['read', 'write'],
    routes: ['/recepcion']
  },
  cliente: {
    label: 'Usuario/Miembro',
    description: 'Acceso a perfil y rutinas',
    permissions: ['read'],
    routes: ['/usuarios']
  }
};

/**
 * Datos de prueba para el Dashboard
 */
export const MOCK_DATA = {
  dashboard: {
    stats: {
      totalUsers: 245,
      activeMembers: 187,
      trainers: 12,
      revenue: 45320.50
    },
    activities: [
      { id: 1, user: 'Juan Pérez', action: 'Check-in', time: '08:30 AM' },
      { id: 2, user: 'María García', action: 'Completó rutina', time: '10:15 AM' },
      { id: 3, user: 'Carlos López', action: 'Check-out', time: '11:45 AM' }
    ]
  },
  users: [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com', rol: 'cliente', status: 'active' },
    { id: 2, name: 'María García', email: 'maria@example.com', rol: 'cliente', status: 'active' },
    { id: 3, name: 'Carlos López', email: 'carlos@example.com', rol: 'cliente', status: 'inactive' }
  ],
  trainers: [
    { id: 1, name: 'Pedro Rodríguez', specialty: 'Musculación', clients: 15, rating: 4.8 },
    { id: 2, name: 'Ana Martínez', specialty: 'Cardio', clients: 12, rating: 4.9 },
    { id: 3, name: 'Luis González', specialty: 'Crossfit', clients: 18, rating: 4.7 }
  ]
};

/**
 * Validar si estamos en modo desarrollo
 */
export const isDevelopmentMode = () => {
  return process.env.REACT_APP_ENV === 'development';
};

/**
 * Obtener usuario de prueba por rol
 */
export const getDemoUser = (role) => {
  return DEMO_USERS[role] || DEMO_USERS.usuario;
};

/**
 * Obtener todos los roles disponibles
 */
export const getAvailableRoles = () => {
  return Object.keys(DEMO_USERS);
};

export default {
  DEMO_USERS,
  ROLES,
  MOCK_DATA,
  isDevelopmentMode,
  getDemoUser,
  getAvailableRoles
};
