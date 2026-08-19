import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCXbaGq1ZmLSSMUTS5jpJyXfecP85l-e7g",
  authDomain: "gen-lang-client-0738721798.firebaseapp.com",
  projectId: "gen-lang-client-0738721798",
  storageBucket: "gen-lang-client-0738721798.firebasestorage.app",
  messagingSenderId: "852822909526",
  appId: "1:852822909526:web:b55776015e3fe2cfc551f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

import { BACKEND_URL } from "./constants";

async function test() {
  console.log("Signing in anonymously...");
  const userCredential = await signInAnonymously(auth);
  const token = await userCredential.user.getIdToken();
  console.log("Token obtained successfully.");

  const endpoints = [
    { path: "/api/chat/sessions", method: "GET" },
    { path: "/api/chats", method: "GET" },
    { path: "/api/conversations", method: "GET" },
    { path: "/api/chat", method: "GET" },
    { path: "/api/chat/session", method: "POST", body: { title: "Test Chat" } },
    { path: "/api/chats", method: "POST", body: { title: "Test Chat" } },
    { path: "/api/conversations", method: "POST", body: { title: "Test Chat" } },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BACKEND_URL}${ep.path}`, {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: ep.body ? JSON.stringify(ep.body) : null
      });
      console.log(`[${ep.method}] ${ep.path} -> Status: ${res.status}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log("Response JSON:", JSON.stringify(json, null, 2).slice(0, 500));
      } catch {
        console.log("Response text:", text.slice(0, 500));
      }
    } catch (err: any) {
      console.error(`Error requesting ${ep.path}:`, err.message);
    }
  }
}

test();
