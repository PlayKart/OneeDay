import React, { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { Habit } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Flame,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isHabitScheduledForDate } from "../lib/habitUtils";

type Timeframe = 7 | 14 | 30;

interface DayData {
  dateStr: string; // "YYYY-MM-DD"
  displayDate: string; // "Aug 15"
  dayName: string; // "Mon"
  fullDayName: string; // "Monday"
  completedCount: number;
  totalScheduled: number;
  percentage: number;
  completedHabits: string[];
}

interface DayOfWeekData {
  dayName: string;
  avgPercentage: number;
  totalCompleted: number;
  totalScheduled: number;
  count: number;
}

interface CategoryData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export function HabitTrendsView() {
  const { habits, user } = useStore();
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const safeHabits: Habit[] = useMemo(() => (Array.isArray(habits) ? habits : []), [habits]);

  // Generate date range data for the past 30 days
  const dailyData: DayData[] = useMemo(() => {
    const result: DayData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      // Date string format YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const displayDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDayName = d.toLocaleDateString("en-US", { weekday: "long" });

      // Find scheduled habits for this date
      const scheduledHabits = safeHabits.filter((h) => isHabitScheduledForDate(h, d));
      const totalScheduled = scheduledHabits.length;

      // Completed habits on this date
      const completedList: string[] = [];
      scheduledHabits.forEach((h) => {
        if (h.completedDates && Array.isArray(h.completedDates)) {
          if (h.completedDates.includes(dateStr)) {
            completedList.push(h.name);
          }
        } else if (i === 0 && h.completedToday) {
          // If today and completedToday is true
          completedList.push(h.name);
        }
      });

      const completedCount = completedList.length;
      const percentage = totalScheduled === 0 ? 0 : Math.round((completedCount / totalScheduled) * 100);

      result.push({
        dateStr,
        displayDate,
        dayName,
        fullDayName,
        completedCount,
        totalScheduled,
        percentage,
        completedHabits: completedList,
      });
    }

    return result;
  }, [safeHabits]);

  // Filtered dataset according to timeframe selection
  const filteredDailyData = useMemo(() => {
    return dailyData.slice(30 - timeframe);
  }, [dailyData, timeframe]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalScheduled = filteredDailyData.reduce((acc, curr) => acc + curr.totalScheduled, 0);
    const totalCompleted = filteredDailyData.reduce((acc, curr) => acc + curr.completedCount, 0);
    const overallRate = totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100);

    // Calculate trend compared to previous period
    const halfLen = Math.floor(filteredDailyData.length / 2);
    const recentData = filteredDailyData.slice(halfLen);
    const olderData = filteredDailyData.slice(0, halfLen);

    const recentCompleted = recentData.reduce((acc, curr) => acc + curr.completedCount, 0);
    const recentScheduled = recentData.reduce((acc, curr) => acc + curr.totalScheduled, 0);
    const recentRate = recentScheduled === 0 ? 0 : Math.round((recentCompleted / recentScheduled) * 100);

    const olderCompleted = olderData.reduce((acc, curr) => acc + curr.completedCount, 0);
    const olderScheduled = olderData.reduce((acc, curr) => acc + curr.totalScheduled, 0);
    const olderRate = olderScheduled === 0 ? 0 : Math.round((olderCompleted / olderScheduled) * 100);

    const rateDiff = recentRate - olderRate;

    return {
      totalScheduled,
      totalCompleted,
      overallRate,
      rateDiff,
      isImproving: rateDiff >= 0,
    };
  }, [filteredDailyData]);

  // Day-of-week pattern breakdown (Mon-Sun)
  const dayOfWeekPattern: DayOfWeekData[] = useMemo(() => {
    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const map: Record<string, { completed: number; scheduled: number; count: number }> = {};

    daysOrder.forEach((d) => {
      map[d] = { completed: 0, scheduled: 0, count: 0 };
    });

    dailyData.forEach((day) => {
      if (map[day.dayName]) {
        map[day.dayName].completed += day.completedCount;
        map[day.dayName].scheduled += day.totalScheduled;
        map[day.dayName].count += 1;
      }
    });

    return daysOrder.map((d) => {
      const item = map[d];
      const avgPercentage =
        item.scheduled === 0 ? 0 : Math.round((item.completed / item.scheduled) * 100);
      return {
        dayName: d,
        avgPercentage,
        totalCompleted: item.completed,
        totalScheduled: item.scheduled,
        count: item.count,
      };
    });
  }, [dailyData]);

  // Best & Worst performing day
  const bestDay = useMemo(() => {
    if (!dayOfWeekPattern.length) return null;
    return [...dayOfWeekPattern].sort((a, b) => b.avgPercentage - a.avgPercentage)[0];
  }, [dayOfWeekPattern]);

  const worstDay = useMemo(() => {
    if (!dayOfWeekPattern.length) return null;
    return [...dayOfWeekPattern].sort((a, b) => a.avgPercentage - b.avgPercentage)[0];
  }, [dayOfWeekPattern]);

  // Category distribution
  const categoryData: CategoryData[] = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalCompletions = 0;

    safeHabits.forEach((h) => {
      const cat = h.category || "General";
      const completionsCount = h.completedDates?.length || (h.completedToday ? 1 : 0);
      counts[cat] = (counts[cat] || 0) + completionsCount;
      totalCompletions += completionsCount;
    });

    const categoryColors: Record<string, string> = {
      emerald: "#10b981",
      cyan: "#06b6d4",
      purple: "#a855f7",
      amber: "#f59e0b",
      rose: "#f43f5e",
      blue: "#3b82f6",
      General: "#64748b",
    };

    return Object.entries(counts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: totalCompletions === 0 ? 0 : Math.round((count / totalCompletions) * 100),
        color: categoryColors[name.toLowerCase()] || "#8b5cf6",
      }))
      .sort((a, b) => b.count - a.count);
  }, [safeHabits]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-[#0c0d12]/95 border border-white/15 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl max-w-xs text-xs z-50">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-2">
            <span className="font-extrabold text-white text-sm">
              {data.fullDayName}, {data.displayDate}
            </span>
            <span className="font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full text-[10px]">
              {data.percentage}%
            </span>
          </div>
          <div className="space-y-1.5 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Completed Habits:</span>
              <span className="font-bold text-emerald-400">
                {data.completedCount} / {data.totalScheduled}
              </span>
            </div>
            {data.completedHabits.length > 0 ? (
              <div className="pt-1.5 border-t border-white/5 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed
                </span>
                <ul className="space-y-1 max-h-24 overflow-y-auto">
                  {data.completedHabits.map((name, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic pt-1">No habits completed on this date</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER ROW & TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BarChart3 size={18} />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">30-Day Discipline Trends</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Analyze your consistency patterns, peak discipline days, and completion velocity.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-2xl">
          {( [7, 14, 30] as Timeframe[] ).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                timeframe === tf
                  ? "bg-white text-black shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tf} Days
            </button>
          ))}
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Discipline Score */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Avg Discipline
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.overallRate}%</div>
            <div className="flex items-center gap-1 text-[10px] font-bold mt-1">
              {stats.isImproving ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> +{stats.rateDiff}% vs prev period
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <ArrowDownRight size={12} /> {stats.rateDiff}% vs prev period
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Completions */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Total Check-Ins
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.totalCompleted}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Out of {stats.totalScheduled} scheduled habits
            </div>
          </div>
        </div>

        {/* Card 3: Best Day of Week */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Peak Discipline
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-white">
              {bestDay ? bestDay.dayName : "N/A"}
            </div>
            <div className="text-[10px] font-bold text-purple-400 mt-1">
              {bestDay ? `${bestDay.avgPercentage}% completion rate` : "No data yet"}
            </div>
          </div>
        </div>

        {/* Card 4: Active Streak */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Active Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Flame size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              {user?.currentStreak ?? user?.streak ?? 0} <span className="text-xs font-bold text-slate-500">Days</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Keep momentum strong
            </div>
          </div>
        </div>
      </div>

      {/* CHART 1: MAIN AREA CHART - DAILY COMPLETION TREND */}
      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Completion Velocity ({timeframe} Days)
            </h3>
            <p className="text-[11px] text-slate-400">
              Daily habit completion percentage with 80% discipline benchmark line.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Completion Rate %
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400" />
              80% Benchmark
            </span>
          </div>
        </div>

        {/* Recharts AreaChart */}
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={80}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "80% Target",
                  fill: "#10b981",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cyanGradient)"
                activeDot={{ r: 6, fill: "#38bdf8", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRID: DAY-OF-WEEK PATTERN & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 2: DAY-OF-WEEK PATTERN BARCHART */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-purple-400" />
              Day-of-Week Pattern
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Average completion rate grouped by day of the week over the last 30 days.
            </p>

            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekPattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="dayName"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}% Avg Rate`, "Discipline"]}
                    contentStyle={{
                      backgroundColor: "#0c0d12",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="avgPercentage" radius={[6, 6, 0, 0]}>
                    {dayOfWeekPattern.map((entry, index) => {
                      const color =
                        entry.avgPercentage >= 80
                          ? "#10b981"
                          : entry.avgPercentage >= 50
                          ? "#a855f7"
                          : "#f59e0b";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pattern Insight Box */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 mt-4 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Discipline Insight:</span>{" "}
                {bestDay && worstDay ? (
                  <>
                    You show peak performance on <strong className="text-emerald-400">{bestDay.dayName}s ({bestDay.avgPercentage}%)</strong>. Consider placing high-effort habits on these high-energy days.
                  </>
                ) : (
                  "Complete more habits across different days to unlock detailed discipline patterns."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: CATEGORY / HABIT DISTRIBUTION */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-400" />
              Category Focus
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Distribution of check-ins across habit categories over 30 days.
            </p>

            {categoryData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} check-ins`, name]}
                        contentStyle={{
                          backgroundColor: "#0c0d12",
                          borderColor: "rgba(255,255,255,0.15)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {categoryData.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-slate-200">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400">{cat.count} check-ins</span>
                        <span className="font-extrabold text-white bg-white/10 px-1.5 py-0.5 rounded-md">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-500 italic">
                No categorized habits found. Add categories to your habits to view distribution.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 mt-4">
            Balanced discipline across multiple categories prevents burnout and supports long-term consistency.
          </div>
        </div>
      </div>

      {/* 30-DAY DAILY CONSISTENCY GRID */}
      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} className="text-cyan-400" />
          30-Day Check-In Heatmap
        </h3>

        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1.5 pt-2">
          {dailyData.map((d, idx) => {
            const bgClass =
              d.percentage >= 80
                ? "bg-emerald-500/80 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : d.percentage >= 50
                ? "bg-cyan-500/60 border-cyan-400/40"
                : d.percentage > 0
                ? "bg-amber-500/40 border-amber-400/30"
                : "bg-white/5 border-white/10";

            return (
              <div
                key={idx}
                title={`${d.fullDayName}, ${d.displayDate}: ${d.percentage}% (${d.completedCount}/${d.totalScheduled})`}
                className={`h-10 rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-200 hover:scale-110 cursor-pointer ${bgClass}`}
              >
                <span className="text-[8px] font-bold text-white/70 uppercase">
                  {d.dayName.charAt(0)}
                </span>
                <span className="text-[9px] font-black text-white">{d.percentage}%</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 pt-3 border-t border-white/5">
          <span>Older (30 days ago)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-white/5 border border-white/10" /> 0%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/40" /> 1-49%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500/60" /> 50-79%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" /> 80%+
            </span>
          </div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
