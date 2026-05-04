import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCXbaGq1ZmLSSMUTS5jpJyXfecP85l-e7g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0738721798.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0738721798",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0738721798.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "852822909526",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:852822909526:web:b55776015e3fe2cfc551f7",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-da5d5bdc-b58b-4b95-8ea7-d2a02951c76d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
