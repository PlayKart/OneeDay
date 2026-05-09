import { GoogleGenAI } from "@google/genai";
import { Habit } from "../store/useStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuote(streak: number, habits: Habit[]): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
     return streak >= 7 ? "You're ahead of 99%. Don't slow down." : "One day broke. Don't let two.";
  }

  const prompt = `You are an elite, stoic productivity AI coach. 
Generate ONE intense, premium motivational quote (maximum 12 words) for a user.
Their current daily streak is ${streak}.
Their current active habits are: ${habits.map(h => h.name).join(", ") || "None yet"}.
Focus on discipline, building their specific system, and consistency. 
Do not be cheesy. No emojis. Be sharp and direct. Just the quote text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    let text = response.text || "Discipline is the choice between what you want now and what you want most.";
    text = text.replace(/["']/g, '').trim(); 
    return text;
  } catch (error) {
    console.error("Gemini Quote Error:", error);
    return "Discipline is the choice between what you want now and what you want most.";
  }
}
