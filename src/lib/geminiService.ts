import { Habit } from "../store/useStore";

// Extensive list of premium curated Stoic discipline and consistency quotes
const PREMIUM_STOIC_QUOTES = [
  "You do not rise to your goals; you fall to your systems.",
  "First say to yourself what you would be; then do what you have to do.",
  "Suffering of discipline is temporary; regret is permanent.",
  "He who has a strong enough why can bear almost any how.",
  "Amor Fati: Embrace the friction. Build your focus.",
  "No man is free who is not master of himself.",
  "Discipline is the choice between what you want now and what you want most.",
  "What stands in the way becomes the way.",
  "Associate with people who are likely to improve you.",
  "The best revenge is to be unlike him who performed the injury.",
  "He who fears death will never do anything worthy of a man who is alive.",
  "We suffer more often in imagination than in reality.",
  "If it is not right do not do it; if it is not true do not say it.",
  "Waste no more time arguing about what a good man should be. Be one.",
  "A rational being can turn each obstacle into fuel for his own purpose.",
  "Only the disciplined in life are free. The undisciplined are slaves to passion.",
  "Discipline equals freedom.",
  "Small daily improvements over time lead to stunning results.",
  "The standard you walk past is the standard you accept."
];

export async function generateQuote(streak: number, habits: Habit[]): Promise<string> {
  // Try to use a different quote based on the current streak day to feel dynamic
  const index = Math.max(0, streak) % PREMIUM_STOIC_QUOTES.length;
  return PREMIUM_STOIC_QUOTES[index];
}

export async function askAICoach(
  message: string, 
  history: {role: string, content: string}[], 
  streak: number, 
  habits: Habit[]
): Promise<string> {
  // Frontend no longer performs client-side AI completions.
  // This is handled via backend `/api/chat` route in useStore.ts.
  throw new Error("AI Coaching is processed exclusively via the backend server.");
}
