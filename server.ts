import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0738721798" // Fallback to provided ID
  });
}

const db = admin.firestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- NEW ROUTES FOR USER SPEC ---

  app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split("Bearer ")[1];
    
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const userRef = db.collection('users').doc(decoded.uid);
      let userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // Initial setup
        await userRef.set({
          name: decoded.name || decoded.email,
          xp: 0,
          streak: 0,
          level: 1,
          levelProgress: 0,
          freeze_until: null,
          lastActiveDate: new Date().toISOString(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        userDoc = await userRef.get();
      }

      const userData = userDoc.data()!;
      // Simple streak logic sync
      const lastActive = new Date(userData.lastActiveDate);
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      let updates: any = {};
      const isFrozen = userData.freeze_until && new Date(userData.freeze_until) > now;

      if (diff >= 2 && !isFrozen) {
        updates.streak = 0;
        updates.lastActiveDate = now.toISOString();
        await userRef.update(updates);
      }

      res.json({ ...userData, ...updates });
    } catch (e) {
      res.status(500).json({ error: "Auth failed" });
    }
  });

  app.get("/api/habits", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split("Bearer ")[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const habits = await db.collection('habits').where('userId', '==', decoded.uid).get();
      const today = new Date().toISOString().split('T')[0];
      
      const list = await Promise.all(habits.docs.map(async (doc) => {
        const completed = await db.collection('completions')
          .where('userId', '==', decoded.uid)
          .where('habitId', '==', doc.id)
          .where('date', '==', today)
          .get();
        
        return {
          id: doc.id,
          name: doc.data().name,
          completedToday: !completed.empty
        };
      }));

      res.json(list);
    } catch (e) {
      res.status(500).json({ error: "Fail" });
    }
  });

  app.post("/api/habit", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { name } = req.body;
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return res.status(401).send();

    const decoded = await admin.auth().verifyIdToken(token);
    await db.collection('habits').add({ userId: decoded.uid, name, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true });
  });

  app.post("/api/complete", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { habit_id } = req.body;
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return res.status(401).send();

    const decoded = await admin.auth().verifyIdToken(token);
    const today = new Date().toISOString().split('T')[0];
    
    const completions = db.collection('completions');
    const q = await completions.where('userId', '==', decoded.uid).where('habitId', '==', habit_id).where('date', '==', today).get();
    if (!q.empty) return res.status(400).json({ error: "Done" });

    await completions.add({ userId: decoded.uid, habitId: habit_id, date: today, ts: admin.firestore.FieldValue.serverTimestamp() });
    
    // Update XP and Streak
    const userRef = db.collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();
    const data = userDoc.data()!;

    // Check if first completion today for streak
    const todayCount = await completions.where('userId', '==', decoded.uid).where('date', '==', today).get();
    const isFirst = todayCount.size === 1;

    const newXp = (data.xp || 0) + 10;
    const newStreak = isFirst ? (data.streak || 0) + 1 : (data.streak || 0);
    const newLevel = Math.floor(newXp / 100) + 1;

    await userRef.update({
      xp: newXp,
      streak: newStreak,
      level: newLevel,
      levelProgress: newXp % 100,
      lastActiveDate: new Date().toISOString()
    });

    res.json({ success: true });
  });

  app.post("/api/freeze", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { days } = req.body;
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return res.status(401).send();

    const decoded = await admin.auth().verifyIdToken(token);
    const until = new Date();
    until.setDate(until.getDate() + days);

    await db.collection('users').doc(decoded.uid).update({ freeze_until: until.toISOString() });
    res.json({ success: true });
  });

  app.post("/api/chat", async (req, res) => {
    // Deprecated: AI Coach moved to frontend protocol
    res.status(410).json({ error: "Endpoint deprecated. Use frontend SDK." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
