# GymSystem

## Descripción

GymSystem es un sistema completo de control y administración para gimnasios. Proporciona interfaces diferenciadas y personalizadas para entrenadores, recepcionistas, administradores y usuarios finales. Desarrollado con React y Firebase, ofrece una experiencia fluida y segura para la gestión de membresías, entrenamientos y operaciones diarias del gimnasio.

## Características Principales

- **Autenticación Segura**: Sistema de login con Firebase Authentication
- **Interfaces Personalizadas**:
  - **Administrador**: Control total del sistema
  - **Recepcionista**: Gestión de ingresos y salidas
  - **Entrenador**: Seguimiento de rutinas y clientes
  - **Usuario**: Acceso a perfil y progreso personal
- **Dashboard Interactivo**: Panel de control con métricas y estadísticas
- **Códigos QR**: Generación y escaneo de códigos QR para acceso rápido
- **Gestión de Usuarios**: Administración completa de perfiles y permisos
- **Configuración de Seguridad**: Políticas de seguridad personalizables

## Tecnologías Utilizadas

- **Frontend**: React.js
- **Backend**: Firebase (Authentication, Firestore)
- **Despliegue**: Vercel
- **Lenguajes**: JavaScript, HTML, CSS

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/GymSystem.git
   cd GymSystem
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura Firebase:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication y Firestore
   - Copia las credenciales en `src/firebase.js`

4. Inicia la aplicación en modo desarrollo:
   ```bash
   npm start
   ```

## Uso

- Accede a la aplicación en `http://localhost:3000`
- Regístrate o inicia sesión según tu rol
- Navega por las diferentes secciones según tus permisos

## Despliegue

La aplicación está configurada para desplegarse automáticamente en Vercel. Simplemente conecta tu repositorio de GitHub a Vercel y el despliegue se realizará automáticamente en cada push.

## Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Para preguntas o soporte, por favor contacta al equipo de desarrollo.
