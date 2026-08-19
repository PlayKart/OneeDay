import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

// Initialize Firebase Admin (without credentials, uses application default if available, or just mock for now if no service account)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0738721798"
  });
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Middleware to verify Firebase token
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized: Valid Firebase Auth session required." });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid Firebase token." });
  }
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/mindset", requireAuth, async (req, res) => {
  if (!ai) return res.json({ quote: "One day broke. Don't let two." });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a short, punchy, 1-sentence quote about discipline, consistency, or overcoming procrastination. No quotes or attribution, just the sentence.",
    });
    res.json({ quote: response.text });
  } catch (err) {
    res.json({ quote: "Consistency is the only metric that matters." });
  }
});

// Mock chat storage
const chatSessions: Record<string, any[]> = {};
const chatMessages: Record<string, any[]> = {};

app.get("/api/conversations", requireAuth, (req, res) => {
  const uid = (req as any).user.uid;
  const sessions = chatSessions[uid] || [];
  res.json({ data: sessions });
});

app.get("/api/chats", requireAuth, (req, res) => {
  const sessionId = req.query.sessionId as string;
  const messages = chatMessages[sessionId] || [];
  res.json({ data: messages });
});

app.post("/api/chat", requireAuth, async (req, res) => {
  const uid = (req as any).user.uid;
  const { message, sessionId: incomingSessionId } = req.body;
  
  if (!chatSessions[uid]) chatSessions[uid] = [];
  
  let sessionId = incomingSessionId;
  if (!sessionId) {
    sessionId = "session_" + Date.now();
    chatSessions[uid].push({
      id: sessionId,
      title: "Coaching Session",
      createdAt: new Date().toISOString()
    });
  }

  if (!chatMessages[sessionId]) chatMessages[sessionId] = [];
  
  chatMessages[sessionId].push({
    id: "msg_" + Date.now(),
    role: "user",
    content: message,
    createdAt: new Date().toISOString()
  });

  let replyText = "Stay disciplined and keep pushing forward.";
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an AI discipline coach. Keep responses punchy, direct, and slightly tough. User says: ${message}`,
      });
      replyText = response.text || replyText;
    } catch (err) {
      console.error(err);
    }
  }

  const aiMsg = {
    id: "msg_" + (Date.now() + 1),
    role: "assistant",
    content: replyText,
    createdAt: new Date().toISOString()
  };
  chatMessages[sessionId].push(aiMsg);

  res.json({
    success: true,
    reply: replyText,
    sessionId,
    messages: chatMessages[sessionId]
  });
});

async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
