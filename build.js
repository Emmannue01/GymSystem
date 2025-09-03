const fs = require('fs');

const config = `const firebaseConfig = {
  apiKey: "${process.env.FIREBASE_API_KEY || 'AIzaSyALeuGMHVzGuzEVejNcGx_9_MWEF5YHUx4'}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || 'colosossgym.firebaseapp.com'}",
  databaseURL: "${process.env.FIREBASE_DATABASE_URL || 'https://colosossgym-default-rtdb.firebaseio.com/'}",
  projectId: "${process.env.FIREBASE_PROJECT_ID || 'colosossgym'}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || 'colosossgym.firebasestorage.app'}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || '498715862896'}",
  appId: "${process.env.FIREBASE_APP_ID || '1:498715862896:web:d44ff8eda38aa3493991b5'}",
  measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || 'G-H52V06S4QX'}"
};

export { firebaseConfig };`;

fs.writeFileSync('config.js', config);
console.log('✅ Config built with environment variables');