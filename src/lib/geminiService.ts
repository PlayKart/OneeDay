import { GoogleGenAI } from "@google/genai";
import { Habit } from "../store/useStore";

const getApiKey = () => {
  return import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
};

export async function generateQuote(streak: number, habits: Habit[]): Promise<string> {
  const apiKey = getApiKey();
  const habitsArray = Array.isArray(habits) ? habits : [];
  const prompt = `You are an elite, stoic productivity AI coach. 
Generate ONE intense, premium motivational quote (maximum 12 words) for a user.
Their current daily streak is ${streak}.
Their current active habits are: ${habitsArray.map(h => h.name).join(", ") || "None yet"}.
Focus on discipline, building their specific system, and consistency. 
Do not be cheesy. No emojis. Be sharp and direct. Just the quote text.`;

  // If we have an OpenRouter key, use OpenRouter for a super stable connection
  if (import.meta.env.VITE_OPENROUTER_API_KEY) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "OneDay"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        text = text.replace(/["']/g, '').trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn("OpenRouter quote generation failed, falling back to local defaults", err);
    }
  }

  // Fallback to GoogleGenAI if VITE_GEMINI_API_KEY is present
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      let text = response.text || "";
      text = text.replace(/["']/g, '').trim(); 
      if (text) return text;
    } catch (error) {
      console.error("Gemini Quote Error:", error);
    }
  }

  // Standard stoic fallback quotes
  const localQuotes = [
    "You do not rise to your goals; you fall to your systems.",
    "First say to yourself what you would be; then do what you have to do.",
    "Suffering of discipline is temporary; regret is permanent.",
    "He who has a strong enough why can bear almost any how.",
    "Amor Fati: Embrace the friction. Build your focus.",
    "No man is free who is not master of himself."
  ];
  return localQuotes[Math.floor(Math.random() * localQuotes.length)];
}

export async function askAICoach(
  message: string, 
  history: {role: string, content: string}[], 
  streak: number, 
  habits: Habit[]
): Promise<string> {
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const habitsArray = Array.isArray(habits) ? habits : [];

  const systemInstructions = `You are an elite, stoic productivity and discipline AI Coach named OneDay. 
Your goal is to build long-term systems of consistency, eliminate friction, and challenge the user to stay disciplined.
Avoid cheesy generic self-help advice. Be sharp, direct, stoic, and deep.
The user's current streak is ${streak} days.
Their current habits are: ${habitsArray.map(h => `${h.name} (${h.completedToday ? "Completed" : "Pending"})`).join(", ") || "None yet"}.
Keep your responses punchy, concise, and highly actionable. No fluff. Maximum 3-4 sentences.`;

  // 1. If OpenRouter key is available
  if (openRouterKey) {
    try {
      const messages = [
        { role: "system", content: systemInstructions },
        ...history.map(msg => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "OneDay"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Focus on the execution. Your routine defines you.";
      }
    } catch (err) {
      console.error("OpenRouter coach call failed", err);
    }
  }

  // 2. Fallback to direct Gemini SDK if VITE_GEMINI_API_KEY is available
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `${systemInstructions}\n\nConversation History:\n${history.map(h => `${h.role}: ${h.content}`).join("\n")}\n\nUser: ${message}\n\nCoach:`;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      return response.text || "Discipline is the only way out.";
    } catch (err) {
      console.error("Gemini Direct coach call failed", err);
    }
  }

  return "I am currently in Offline Standby Mode. Remember: Stoic discipline requires executing your daily standards regardless of external conditions. Complete your tasks today.";
}

