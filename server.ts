import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

// Initialize Firebase Admin (without credentials, uses application default if available)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0738721798"
    });
  } catch (err) {
    console.warn("Firebase Admin initialization warning:", err);
  }
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// ==========================================
// PERSISTENT DATABASE STORAGE (JSON FILE)
// ==========================================
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DB {
  users: Record<string, any>;
  habits: Record<string, any>;
}

let dbData: DB = { users: {}, habits: {} };

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    dbData = JSON.parse(raw);
    if (!dbData.users) dbData.users = {};
    if (!dbData.habits) dbData.habits = {};
    console.log(`[DB] Loaded persistent database from ${DB_FILE}. Users: ${Object.keys(dbData.users).length}, Habits: ${Object.keys(dbData.habits).length}`);
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
    console.log(`[DB] Initialized new persistent database at ${DB_FILE}`);
  }
} catch (err) {
  console.error("[DB ERROR] Failed to load/init DB file:", err);
  dbData = { users: {}, habits: {} };
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (err) {
    console.error("[DB ERROR] Failed to write DB file:", err);
  }
}

// Helper: Calculate streak from completed dates
function calculateStreak(completedDates: string[]): number {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(completedDates)).sort().reverse();
  
  const today = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterdayDate)) {
    return 0;
  }

  let streak = 0;
  let checkTime = uniqueDates.includes(today) ? Date.now() : Date.now() - 86400000;

  while (true) {
    const dateStr = new Date(checkTime).toISOString().split("T")[0];
    if (uniqueDates.includes(dateStr)) {
      streak++;
      checkTime -= 86400000;
    } else {
      break;
    }
  }

  return streak;
}

// Helper: Extract user identity from Firebase Auth token
async function getAuthUser(req: express.Request): Promise<{ uid: string; email: string; name: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@oneday.app`,
      name: decoded.name || decoded.email || decoded.uid
    };
  } catch (err) {
    // Fallback: decode JWT payload or extract token string for dev/mock sessions
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          return {
            uid,
            email: payload.email || `${uid}@oneday.app`,
            name: payload.name || payload.email || uid
          };
        }
      }
    } catch (e) {}

    const safeUid = token.replace(/[^a-zA-Z0-9_-]/g, "_");
    return {
      uid: safeUid,
      email: `${safeUid}@oneday.app`,
      name: safeUid
    };
  }
}

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Unauthorized: Valid token required" });
  }
  (req as any).user = authUser;
  next();
};

function getOrCreateUser(uid: string, email: string, name: string) {
  if (!dbData.users[uid]) {
    dbData.users[uid] = {
      id: uid,
      userId: uid,
      email: email || `${uid}@oneday.app`,
      name: name || "Member",
      fullName: name || "Member",
      gender: null,
      dob: null,
      whyOneday: null,
      xp: 0,
      level: 1,
      levelProgress: 0,
      streak: 0,
      longestStreak: 0,
      onboarded: false,
      onboardingStep: 1,
      currentTitle: "Newcomer",
      unlockedTitles: ["Newcomer"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDB();
  }
  return dbData.users[uid];
}

// ==========================================
// API ENDPOINTS
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/profile & GET /api/user
app.get(["/api/profile", "/api/user"], requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const user = getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  // Compute overall user streak across all habits
  const userHabits = Object.values(dbData.habits).filter((h) => h.userId === authUser.uid);
  let maxStreak = 0;
  userHabits.forEach((h) => {
    const s = calculateStreak(h.completedDates || []);
    if (s > maxStreak) maxStreak = s;
  });

  user.streak = maxStreak;
  user.currentStreak = maxStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, maxStreak);

  console.log(`[HYDRATION DEBUG] Returning profile for uid ${authUser.uid}: level=${user.level}, xp=${user.xp}, streak=${user.streak}`);
  res.json({
    success: true,
    status: "success",
    id: user.id,
    userId: user.userId,
    user,
    profile: user,
    ...user
  });
});

// POST /api/profile
app.post("/api/profile", requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const user = getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  const updates = req.body || {};
  Object.assign(user, {
    ...updates,
    id: authUser.uid,
    userId: authUser.uid,
    updatedAt: new Date().toISOString()
  });

  saveDB();
  console.log(`[HYDRATION DEBUG] Updated profile for uid ${authUser.uid}`);
  res.json({
    success: true,
    status: "success",
    user,
    profile: user,
    ...user
  });
});

// POST /api/onboarding
app.post("/api/onboarding", requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const user = getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  const { step, completed, gender, dob, whyOneday, name } = req.body || {};

  if (step !== undefined) user.onboardingStep = Number(step);
  if (completed) user.onboarded = true;
  if (gender) user.gender = gender;
  if (dob) user.dob = dob;
  if (whyOneday) user.whyOneday = whyOneday;
  if (name) user.name = name;

  user.updatedAt = new Date().toISOString();
  saveDB();

  res.json({
    success: true,
    status: "success",
    message: `Onboarding saved to step ${user.onboardingStep}`,
    user,
    profile: user,
    onboardingStep: user.onboardingStep,
    onboarded: user.onboarded
  });
});

// GET /api/habits
app.get("/api/habits", requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const today = (req.headers["x-local-date"] as string) || new Date().toISOString().split("T")[0];

  const userHabits = Object.values(dbData.habits)
    .filter((h) => h.userId === authUser.uid)
    .map((h) => {
      const dates = Array.isArray(h.completedDates) ? h.completedDates : [];
      const completedToday = dates.includes(today);
      return {
        ...h,
        completedToday,
        streak: calculateStreak(dates)
      };
    });

  console.log(`[HYDRATION DEBUG] GET /api/habits for uid ${authUser.uid}: found ${userHabits.length} habits`);
  res.json({
    success: true,
    status: "success",
    data: userHabits,
    habits: userHabits
  });
});

// POST /api/habit
app.post("/api/habit", requireAuth, (req, res) => {
  const authUser = (req as any).user;
  getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  const { name, title, difficulty, repeatType, customDays, notes, icon, category, reminderTime } = req.body || {};

  const habitName = (name || title || "New Habit").trim();
  const habitId = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newHabit = {
    id: habitId,
    userId: authUser.uid,
    name: habitName,
    title: habitName,
    difficulty: difficulty || "Medium",
    repeatType: repeatType || "every_day",
    customDays: Array.isArray(customDays) ? customDays : [],
    notes: notes || "",
    icon: icon || "dumbbell",
    category: category || "emerald",
    reminderTime: reminderTime || "",
    completedDates: [],
    completedToday: false,
    streak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbData.habits[habitId] = newHabit;
  saveDB();

  console.log(`[WRITE PATH] Created habit ${habitId} ("${habitName}") for uid ${authUser.uid} in persistent DB.`);
  res.json({
    success: true,
    status: "success",
    data: newHabit,
    habit: newHabit
  });
});

// PUT /api/habit/:id or POST /api/habit/:id
app.all(["/api/habit/:id", "/api/habits/:id"], requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const habitId = req.params.id;

  const habit = dbData.habits[habitId];
  if (!habit || habit.userId !== authUser.uid) {
    return res.status(404).json({ success: false, error: "Habit not found" });
  }

  if (req.method === "DELETE") {
    delete dbData.habits[habitId];
    saveDB();
    console.log(`[WRITE PATH] Deleted habit ${habitId} for uid ${authUser.uid}`);
    return res.json({ success: true, status: "success" });
  }

  Object.assign(habit, req.body || {}, { updatedAt: new Date().toISOString() });
  saveDB();

  res.json({
    success: true,
    status: "success",
    data: habit,
    habit
  });
});

// POST /api/habits/:id/complete
app.post("/api/habits/:id/complete", requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const habitId = req.params.id;
  const today = (req.headers["x-local-date"] as string) || req.body?.date || new Date().toISOString().split("T")[0];

  const habit = dbData.habits[habitId];
  if (!habit || habit.userId !== authUser.uid) {
    return res.status(404).json({ success: false, error: "Habit not found" });
  }

  const user = getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  if (!Array.isArray(habit.completedDates)) habit.completedDates = [];

  if (!habit.completedDates.includes(today)) {
    habit.completedDates.push(today);

    // Calculate XP
    const difficultyXP = habit.difficulty === "Easy" ? 10 : habit.difficulty === "Hard" ? 30 : 20;
    user.xp = (user.xp || 0) + difficultyXP;
    user.level = Math.floor(user.xp / 100) + 1;
    user.levelProgress = user.xp % 100;
  }

  const habitStreak = calculateStreak(habit.completedDates);
  habit.streak = habitStreak;

  // Calculate total streak
  const userHabits = Object.values(dbData.habits).filter((h) => h.userId === authUser.uid);
  let maxStreak = 0;
  userHabits.forEach((h) => {
    const s = calculateStreak(h.completedDates || []);
    if (s > maxStreak) maxStreak = s;
  });

  user.streak = maxStreak;
  user.currentStreak = maxStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, maxStreak);

  saveDB();

  console.log(`[WRITE PATH] Completed habit ${habitId} on ${today}. User XP: ${user.xp}, Level: ${user.level}, Streak: ${user.streak}`);
  res.json({
    success: true,
    status: "success",
    streak: user.streak,
    currentStreak: user.streak,
    xp: user.xp,
    level: user.level,
    levelProgress: user.levelProgress,
    user,
    habit
  });
});

// POST /api/habits/:id/undo
app.all(["/api/habits/:id/undo", "/api/habits/:id/uncomplete"], requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const habitId = req.params.id;
  const today = (req.headers["x-local-date"] as string) || req.body?.date || new Date().toISOString().split("T")[0];

  const habit = dbData.habits[habitId];
  if (!habit || habit.userId !== authUser.uid) {
    return res.status(404).json({ success: false, error: "Habit not found" });
  }

  const user = getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  if (Array.isArray(habit.completedDates) && habit.completedDates.includes(today)) {
    habit.completedDates = habit.completedDates.filter((d: string) => d !== today);

    const difficultyXP = habit.difficulty === "Easy" ? 10 : habit.difficulty === "Hard" ? 30 : 20;
    user.xp = Math.max(0, (user.xp || 0) - difficultyXP);
    user.level = Math.max(1, Math.floor(user.xp / 100) + 1);
    user.levelProgress = user.xp % 100;
  }

  const habitStreak = calculateStreak(habit.completedDates);
  habit.streak = habitStreak;

  const userHabits = Object.values(dbData.habits).filter((h) => h.userId === authUser.uid);
  let maxStreak = 0;
  userHabits.forEach((h) => {
    const s = calculateStreak(h.completedDates || []);
    if (s > maxStreak) maxStreak = s;
  });

  user.streak = maxStreak;
  user.currentStreak = maxStreak;

  saveDB();

  console.log(`[WRITE PATH] Undid habit ${habitId} completion. User XP: ${user.xp}, Level: ${user.level}, Streak: ${user.streak}`);
  res.json({
    success: true,
    status: "success",
    streak: user.streak,
    currentStreak: user.streak,
    xp: user.xp,
    level: user.level,
    levelProgress: user.levelProgress,
    user,
    habit
  });
});

// GET /api/dashboard
app.get("/api/dashboard", requireAuth, (req, res) => {
  const authUser = (req as any).user;
  const today = (req.headers["x-local-date"] as string) || new Date().toISOString().split("T")[0];

  const user = getOrCreateUser(authUser.uid, authUser.email, authUser.name);

  const userHabits = Object.values(dbData.habits)
    .filter((h) => h.userId === authUser.uid)
    .map((h) => {
      const dates = Array.isArray(h.completedDates) ? h.completedDates : [];
      return {
        ...h,
        completedToday: dates.includes(today),
        streak: calculateStreak(dates)
      };
    });

  const completedTodayCount = userHabits.filter((h) => h.completedToday).length;

  res.json({
    success: true,
    status: "success",
    user,
    habits: userHabits,
    quote: "Discipline equals freedom.",
    statistics: {
      totalHabits: userHabits.length,
      completedToday: completedTodayCount,
      currentStreak: user.streak,
      longestStreak: user.longestStreak || user.streak,
      completionRate: userHabits.length > 0 ? Math.round((completedTodayCount / userHabits.length) * 100) : 0
    },
    achievements: [
      { id: "1", title: "First Step", description: "Complete your first habit", unlocked: completedTodayCount > 0 },
      { id: "2", title: "Unstoppable", description: "Reach a 7-day streak", unlocked: user.streak >= 7, progress: user.streak, maxProgress: 7 },
      { id: "3", title: "Master System", description: "Maintain 5 active habits", unlocked: userHabits.length >= 5, progress: userHabits.length, maxProgress: 5 }
    ],
    notifications: []
  });
});

// GET /api/mindset
app.get("/api/mindset", requireAuth, async (req, res) => {
  if (!ai) return res.json({ quote: "One day broke. Don't let two." });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a short, punchy, 1-sentence quote about discipline, consistency, or overcoming procrastination. No quotes or attribution, just the sentence."
    });
    res.json({ quote: response.text });
  } catch (err) {
    res.json({ quote: "Consistency is the only metric that matters." });
  }
});

// Mock AI Chat sessions & messages
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
        contents: `You are an AI discipline coach. Keep responses punchy, direct, and slightly tough. User says: ${message}`
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
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
