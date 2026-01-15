# INSTRUCCIONES PARA VERCEL

## Pasos para agregar variables de entorno en Vercel:

1. Ve a tu proyecto en https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Settings" → "Environment Variables"
4. Agrega estas variables (copia-pega los valores):

### Firebase Configuration
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=

### Cloudinary Configuration
REACT_APP_CLOUDINARY_PROYECT_NAME=
REACT_APP_CLOUDINARY_UPLOAD_PRESET=
REACT_APP_IMAGE_DATABASE_URL=

## Importante:
- ✅ Asegúrate de seleccionar: Development, Preview, Production
- ✅ Las claves API de Firebase son seguras en el cliente (son públicas)
- ✅ Pero NUNCA compartas tu .env.local en Git o redes sociales
- ✅ Después de agregar variables, haz redeploy en Vercel

## Para redeploy:
1. En Vercel → Deployments → Click en el último deployment
2. Click en "Redeploy" button
3. Espera a que termine

## Para desarrollo local:
1. Asegúrate de tener .env.local con tus valores
2. Ejecuta: npm start

## Variables NO sensibles:
Las variables REACT_APP_* se incluyen en el bundle (es normal en React).
Los datos SENSIBLES (claves secretas, tokens) NO deben estar aquí.
