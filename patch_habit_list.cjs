const fs = require('fs');
let code = fs.readFileSync('src/components/HabitList.tsx', 'utf8');

// 1. Add border mapping function
const borderMapFn = `
const getBorderClass = (id: string) => {
  const map: Record<string, string> = {
    emerald: "border-l-emerald-500",
    cyan: "border-l-cyan-500",
    blue: "border-l-blue-500",
    purple: "border-l-purple-500",
    rose: "border-l-rose-500",
    amber: "border-l-amber-500",
    orange: "border-l-orange-500",
    indigo: "border-l-indigo-500",
  };
  return map[id] || "border-l-slate-500";
};
`;

code = code.replace(/export const HabitList =/g, borderMapFn + "\nexport const HabitList =");

// 2. Update motion.div className
const targetMotionDivClassName = `className={\`p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 border \${
              habit.completedToday 
                ? 'bg-white/5 border-white/10 opacity-60' 
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20'
            }\`}`;

const newMotionDivClassName = `className={\`p-4 rounded-3xl flex items-center justify-between group transition-all duration-300 border-y border-r \${
              habit.completedToday 
                ? 'bg-white/5 border-white/10 opacity-60 border-l-4 border-l-white/20' 
                : \`bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] border-l-4 \${getBorderClass(colorTheme.id || 'emerald')}\`
            }\`}`;

code = code.replace(targetMotionDivClassName, newMotionDivClassName);

// 3. Update the button className
const targetButtonClass = `                  isPending
                    ? 'bg-white/10 text-white cursor-wait border border-white/20'
                    : habit.completedToday 
                      ? 'bg-white text-black hover:bg-red-500 hover:text-white border border-transparent' 
                      : (isToday ? 'bg-white/5 border border-white/10 group-hover:border-white/30 text-white/30 sm:text-transparent sm:hover:text-white' : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed')
                }\`}`;

const newButtonClass = `                  isPending
                    ? 'bg-white/10 text-white cursor-wait border border-white/20'
                    : habit.completedToday 
                      ? 'bg-emerald-500 text-black hover:bg-red-500 hover:text-white border border-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                      : (isToday ? 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-white/30 hover:text-white transition-colors' : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed')
                }\`}`;

code = code.replace(targetButtonClass, newButtonClass);

fs.writeFileSync('src/components/HabitList.tsx', code);
