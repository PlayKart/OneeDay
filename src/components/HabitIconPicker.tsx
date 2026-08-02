import { useState } from "react";
import { HABIT_ICONS, HABIT_COLORS, HabitIconOption, HabitColorOption } from "../lib/habitIcons";
import { Check } from "lucide-react";

interface HabitIconPickerProps {
  selectedIcon: string;
  selectedColor: string;
  onSelectIcon: (iconId: string) => void;
  onSelectColor: (colorId: string) => void;
}

export function HabitIconPicker({
  selectedIcon,
  selectedColor,
  onSelectIcon,
  onSelectColor,
}: HabitIconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Health & Fitness");

  const categories = ["Health & Fitness", "Mind & Focus", "Productivity", "Lifestyle"] as const;

  const filteredIcons = HABIT_ICONS.filter((item) => item.category === activeCategory);

  const currentColorObj = HABIT_COLORS.find((c) => c.id === selectedColor) || HABIT_COLORS[0];
  const activeIconObj = HABIT_ICONS.find((i) => i.id === selectedIcon) || HABIT_ICONS[0];
  const ActiveIconComp = activeIconObj.icon;

  return (
    <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
      {/* Header & Live Preview */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Habit Icon & Color
          </label>
          <p className="text-[11px] text-slate-500">
            Pick a distinct visual badge for Habitify style tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl ${currentColorObj.bg} border ${currentColorObj.border} flex items-center justify-center ${currentColorObj.text} shadow-lg ${currentColorObj.glow} transition-all duration-300`}
          >
            <ActiveIconComp size={22} />
          </div>
        </div>
      </div>

      {/* Color Preset Palette */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
          Accent Color
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {HABIT_COLORS.map((c) => {
            const isSelected = selectedColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.bg} border ${c.border} flex items-center justify-center transition-all ${
                  isSelected ? `ring-2 ${c.ring} scale-110 shadow-md` : "hover:scale-105 opacity-70 hover:opacity-100"
                }`}
                title={c.name}
              >
                {isSelected && <Check size={14} className={c.text} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-white text-black border-white shadow-sm"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
          {filteredIcons.map((item) => {
            const IconComp = item.icon;
            const isSelected = selectedIcon === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectIcon(item.id)}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 group ${
                  isSelected
                    ? `${currentColorObj.bg} ${currentColorObj.border} ${currentColorObj.text} ring-2 ${currentColorObj.ring} scale-105`
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                }`}
                title={item.label}
              >
                <IconComp size={20} />
                <span className="text-[9px] font-bold truncate max-w-full leading-tight opacity-80 group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
