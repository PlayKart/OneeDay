import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const getAICoachResponse = async (message: string, chatHistory: any[], userStats: any) => {
  try {
    const prompt = `
      User Stats:
      - Streak: ${userStats.streak} days
      - Level: ${userStats.level}
      - XP: ${userStats.xp}
      
      Recent Reflections: ${userStats.reflections?.join(", ") || "None"}
      
      User Message: ${message}
    `;

    // Modern SDK usage from skill:
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are 'OneDay' AI Coach. Your tone is short, motivational, and disciplined. You help users build streaks, maintain habits, and stay focused. You are aware of their current stats and history. Be concise.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Coach Error:", error);
    throw error;
  }
};
