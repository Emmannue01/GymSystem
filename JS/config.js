let firebaseConfig = null;

async function initializeFirebaseConfig() {
  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Error al obtener la configuración de Firebase');
    }
    firebaseConfig = await response.json();
  } catch (error) {
    console.error('Error:', error);
    // Fallback para desarrollo local
    firebaseConfig = {
      // Configuración mínima para desarrollo
      projectId: "colosossgym",
      databaseURL: "https://colosossgym-default-rtdb.firebaseio.com/"
    };
  }
}

export async function getFirebaseConfig() {
  if (!firebaseConfig) {
    await initializeFirebaseConfig();
  }
  return firebaseConfig;
}