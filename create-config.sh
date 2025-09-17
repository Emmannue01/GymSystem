#!/bin/bash

# Salir inmediatamente si un comando falla
set -e

echo "Creating JS/config.js with environment variables..."

# Crear el directorio JS si no existe
mkdir -p JS

# Escribir el contenido en el archivo, sustituyendo las variables de entorno de Vercel
cat > JS/config.js << EOF
const firebaseConfig = {
  apiKey: "${FIREBASE_API_KEY}",
  authDomain: "${FIREBASE_AUTH_DOMAIN}",
  databaseURL: "${FIREBASE_DATABASE_URL}",
  projectId: "${FIREBASE_PROJECT_ID}",
  storageBucket: "${FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${FIREBASE_APP_ID}",
  measurementId: "${FIREBASE_MEASUREMENT_ID}",
};
export { firebaseConfig };
EOF

echo "JS/config.js created successfully."
