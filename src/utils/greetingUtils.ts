export const GREETING_TITLES = [
  "Champion",
  "Warrior",
  "Legend",
  "Titan",
  "Guardian",
  "Vanguard",
  "Architect",
  "Pioneer",
  "Trailblazer",
  "Pathfinder",
  "Visionary",
  "Luminary",
  "Ascendant",
  "Sovereign",
  "Elite",
  "Achiever",
  "Performer",
  "Victor",
  "Conqueror",
  "Explorer",
  "Builder",
  "Creator",
  "Innovator",
  "Strategist",
  "Commander",
  "Captain",
  "Leader",
  "Hero",
  "Gladiator",
  "Phoenix",
  "Sentinel",
  "Trailmaster",
  "Navigator",
  "Craftsman",
  "Mentor",
  "Scholar",
  "Mastermind",
  "Challenger",
  "Optimist",
  "Go-Getter",
  "Dynamo",
  "Maverick",
  "Promise Keeper",
  "Self Starter",
  "Consistent",
  "Disciplined",
  "Focused",
  "Relentless",
  "Iron Mind",
  "Elite Performer",
  "Unbreakable",
  "Grandmaster",
  "Mythic",
  "Eternal",
  "OneDay Elite",
  "Apex",
  "Pinnacle",
  "Paragon",
  "Icon",
  "Founder of Self"
];

export function getDynamicGreeting(backendGreeting?: string): string {
  if (backendGreeting) {
    return backendGreeting;
  }

  const now = new Date();
  const hour = now.getHours();

  let timeGreeting = "Good Morning";
  if (hour >= 5 && hour < 12) {
    timeGreeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 24) {
    timeGreeting = "Good Evening";
  } else {
    timeGreeting = "Welcome back";
  }

  const lastTitle = sessionStorage.getItem("oneday_last_greeting_title");
  
  let availableTitles = GREETING_TITLES;
  if (lastTitle && GREETING_TITLES.length > 1) {
    availableTitles = GREETING_TITLES.filter(t => t !== lastTitle);
  }

  const randomTitle = availableTitles[Math.floor(Math.random() * availableTitles.length)];
  sessionStorage.setItem("oneday_last_greeting_title", randomTitle);

  const templates = [
    (t: string) => `${timeGreeting}, ${t}.`,
    (t: string) => `Welcome back, ${t}.`,
    (t: string) => `Ready, ${t}?`,
    (t: string) => `Let's build, ${t}.`,
    (t: string) => `Keep going, ${t}.`,
    (t: string) => `One more step, ${t}.`,
    (t: string) => `Time to win, ${t}.`,
    (t: string) => `Today's yours, ${t}.`,
    (t: string) => `Build your future, ${t}.`,
    (t: string) => `Stay disciplined, ${t}.`,
    (t: string) => `Keep your promise, ${t}.`,
    (t: string) => `Let's continue, ${t}.`,
    (t: string) => `Welcome home, ${t}.`,
  ];

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate(randomTitle);
}
