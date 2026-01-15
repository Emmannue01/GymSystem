# Estructura Profesional del Proyecto GymSystem

## 📁 Árbol de directorios

```
src/
├── components/
│   ├── auth/
│   │   └── AuthForm.js          # Formulario de login/registro
│   ├── common/
│   │   └── ProtectedRoute.js    # Componente para rutas protegidas
│   ├── Dashboard.js              # Componente original
│   ├── Entrenadores.js           # Componente original
│   ├── Login.js                  # Componente original (deprecated)
│   ├── QRCodeModal.js            # Componente original
│   ├── QRScannerModal.js         # Componente original
│   ├── Recepcion.js              # Componente original
│   ├── Usuarios.js               # Componente original
│   └── index.js                  # Exporta componentes reutilizables
│
├── pages/
│   ├── LoginPage.js              # Página de login
│   ├── DashboardPage.js          # Página del dashboard
│   ├── UsuariosPage.js           # Página de usuarios
│   ├── EntrenadoresPage.js       # Página de entrenadores
│   ├── RecepcionPage.js          # Página de recepción
│   └── index.js                  # Exporta todas las páginas
│
├── context/
│   └── AuthContext.js            # Context para autenticación global
│
├── services/
│   ├── firebase.js               # Inicialización de Firebase
│   ├── authService.js            # Servicio de autenticación
│   ├── firestoreService.js       # Servicio de Firestore
│   └── index.js                  # Exporta todos los servicios
│
├── hooks/
│   ├── useAuth.js                # Hook de autenticación (con timeout)
│   └── (otros hooks personalizados)
│
├── utils/
│   ├── securityConfig.js         # Validaciones y seguridad
│   └── (funciones utilitarias)
│
├── config/
│   ├── firebase.js               # Archivo original (deprecated)
│   ├── publicConfig.js           # Configuración pública
│   └── (otras configuraciones)
│
├── constants/
│   ├── roles.js                  # Constantes de roles
│   └── index.js                  # Exporta constantes
│
├── styles/
│   ├── App.css                   # Estilos de App
│   ├── index.css                 # Estilos globales
│   └── (otros estilos)
│
├── App.js                        # Componente principal (reorganizado)
├── index.js                      # Punto de entrada
└── (otros archivos)
```

## 🎯 Qué va en cada carpeta

### `components/`
- **auth/**: Componentes relacionados con autenticación
- **common/**: Componentes reutilizables (ProtectedRoute, etc)
- Componentes de negocio específicos

### `pages/`
- Páginas principales de la aplicación
- Usan componentes de `components/`
- Cada página es un contenedor para una ruta

### `context/`
- Estado global de la aplicación
- AuthContext, ThemeContext, etc

### `services/`
- Lógica de negocio separada de componentes
- Llamadas a Firebase, APIs, etc
- Reutilizable en toda la app

### `hooks/`
- Custom hooks personalizados
- `useAuth`, `useProtectedRoute`, etc

### `utils/`
- Funciones auxiliares
- Validaciones, helpers, etc

### `constants/`
- Constantes de la aplicación
- Roles, mensajes de error, etc

### `config/`
- Configuración de Firebase, APIs, etc

### `styles/`
- Estilos CSS/SCSS organizados

## 📋 Guía de Migraciones

### Antes (Antiguo)
```javascript
import { auth, db } from './firebase';
```

### Después (Nuevo)
```javascript
import { auth, db } from './services/firebase';
import { useAuth } from './context/AuthContext';
import { firestoreService } from './services/firestoreService';
```

## 🔄 Actualizaciones necesarias

1. **Actualiza los imports en componentes existentes:**
   ```javascript
   // Cambiar de:
   import { auth, db } from './firebase';
   
   // A:
   import { useAuth } from '../context/AuthContext';
   import { auth, db } from '../services/firebase';
   import { firestoreService } from '../services/firestoreService';
   ```

2. **En lugar de usar `auth` directamente, usa el hook:**
   ```javascript
   // Cambiar de:
   if (auth.currentUser) { ... }
   
   // A:
   const { user, isAuthenticated } = useAuth();
   if (isAuthenticated) { ... }
   ```

3. **Para operaciones Firestore, usa el servicio:**
   ```javascript
   // Cambiar de:
   import { doc, getDoc } from 'firebase/firestore';
   const userData = await getDoc(doc(db, 'usuarios', uid));
   
   // A:
   import { firestoreService } from '../services/firestoreService';
   const userData = await firestoreService.getDocument('usuarios', uid);
   ```

## ✅ Ventajas de esta estructura

- ✅ **Escalabilidad**: Fácil agregar nuevas features
- ✅ **Mantenibilidad**: Código organizado y modular
- ✅ **Testabilidad**: Cada parte puede testearse por separado
- ✅ **Reutilización**: Servicios y hooks compartidos
- ✅ **Seguridad**: Lógica centralizada en servicios
- ✅ **Rendimiento**: Mejor tree-shaking y code-splitting

## 🚀 Próximos pasos

1. Actualizar imports en todos los componentes
2. Eliminar archivos duplicados (`src/firebase.js`, `src/components/AuthForm.js`, etc)
3. Hacer pruebas de toda la funcionalidad
4. Deploy a Vercel
