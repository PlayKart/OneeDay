import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0738721798"
  });
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  async function verifyUser(req: any, res: any, next: any) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) throw new Error();

      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  }

  function todayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function calculateLevel(xp: number) {
    return Math.floor(xp / 100) + 1;
  }

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/user", verifyUser, async (req: any, res: any) => {
    try {
      const { uid, email, name } = req.user;

      let { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();

      if (!user) {
        await supabase.from("users").insert([{
          id: uid,
          name: name || email || 'Guest',
          xp: 0,
          streak: 0,
          level: 1,
          levelProgress: 0,
          freeze_until: null,
          lastActiveDate: new Date()
        }]);

        const { data: newUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", uid)
          .single();

        return res.json(newUser);
      }

      const now = new Date();
      const last = new Date(user.lastActiveDate);
      const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
      const isFrozen = user.freeze_until && new Date(user.freeze_until) > now;

      if (diffHours > 48 && !isFrozen) {
        await supabase
          .from("users")
          .update({ streak: 0 })
          .eq("id", uid);
        user.streak = 0;
      }

      res.json({
        name: user.name,
        xp: user.xp,
        streak: user.streak,
        level: user.level,
        levelProgress: user.levelProgress,
        freeze_until: user.freeze_until,
        lastActiveDate: user.lastActiveDate
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "User failed" });
    }
  });

  app.get("/api/habits", verifyUser, async (req: any, res: any) => {
    try {
      const { uid } = req.user;
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("userId", uid);

      const today = todayStr();
      const { data: completions } = await supabase
        .from("completions")
        .select("habitId")
        .eq("userId", uid)
        .eq("date", today);

      const completedSet = new Set((completions || []).map(c => c.habitId));

      const result = (habits || []).map(h => ({
        id: h.id,
        name: h.name,
        completedToday: completedSet.has(h.id)
      }));

      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Habits failed" });
    }
  });

  app.post("/api/habit", verifyUser, async (req: any, res: any) => {
    try {
      const { uid } = req.user;
      const { name } = req.body;

      await supabase.from("habits").insert([{
        userId: uid,
        name,
        createdAt: new Date()
      }]);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Add failed" });
    }
  });

  app.post("/api/complete", verifyUser, async (req: any, res: any) => {
    try {
      const { uid } = req.user;
      const { habit_id } = req.body;
      const today = todayStr();

      const { data: existing } = await supabase
        .from("completions")
        .select("id")
        .eq("habitId", habit_id)
        .eq("userId", uid)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        return res.json({ success: false });
      }

      await supabase.from("completions").insert([{
        habitId: habit_id,
        userId: uid,
        date: today,
        createdAt: new Date()
      }]);

      const { data: todayCompletions } = await supabase
        .from("completions")
        .select("*")
        .eq("userId", uid)
        .eq("date", today);

      const isFirstToday = todayCompletions?.length === 1;

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();

      let xp = user.xp + 10;
      let streak = user.streak;

      if (isFirstToday) {
        streak += 1;
      }

      await supabase
        .from("users")
        .update({
          xp,
          streak,
          level: calculateLevel(xp),
          levelProgress: xp % 100,
          lastActiveDate: new Date()
        })
        .eq("id", uid);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Complete failed" });
    }
  });

  app.post("/api/freeze", verifyUser, async (req: any, res: any) => {
    try {
      const { uid } = req.user;
      const { days } = req.body;
      const date = new Date();
      date.setDate(date.getDate() + days);

      await supabase
        .from("users")
        .update({ freeze_until: date })
        .eq("id", uid);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Freeze failed" });
    }
  });

  app.post("/api/chat", verifyUser, async (req: any, res: any) => {
    try {
      const { uid } = req.user;
      const { message } = req.body;

      const { data: user } = await supabase
        .from("users")
        .select("streak")
        .eq("id", uid)
        .single();

      const systemPrompt = `You are OneDay AI Coach. User streak: ${user?.streak || 0}. Rules: Short replies, no emojis, no fluff. If streak >= 7: Be strict, aggressive, elite. If streak < 7: Be firm and motivating. Focus on discipline and daily action.`;

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 200,
      });

      res.json({ reply: response.choices[0].message.content || "Connection lost. Continue your streak." });
    } catch (e: any) {
      console.error("AI Context Error:", e);
      res.status(500).json({ error: "AI Coach is currently offline. Stay disciplined regardless." });
    }
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
