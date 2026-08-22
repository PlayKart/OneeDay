import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCXbaGq1ZmLSSMUTS5jpJyXfecP85l-e7g",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0738721798.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0738721798",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0738721798.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "852822909526",
  appId: env.VITE_FIREBASE_APP_ID || "1:852822909526:web:b55776015e3fe2cfc551f7",
};

console.log("[FIREBASE INIT] Initializing Firebase Auth with Project ID:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = null as any;

// Configure explicit browserLocalPersistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[AUTH] Failed to set Firebase persistence:", err);
});



