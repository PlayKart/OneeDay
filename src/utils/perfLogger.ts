// src/utils/perfLogger.ts

interface PerfMilestones {
  authReady?: number;
  syncStart?: number;
  syncEnd?: number;
  dashboardReady?: number;
  habitsReady?: number;
  quoteReady?: number;
}

class PerfLogger {
  private startTime: number = performance.now();
  private milestones: PerfMilestones = {};
  private hasReported = false;

  public mark(name: keyof PerfMilestones, timeMs?: number) {
    const elapsed = Math.round(timeMs !== undefined ? timeMs : (performance.now() - this.startTime));
    this.milestones[name] = elapsed;

    this.checkAndReport();
  }

  public markHabitTap(habitId: string, durationMs: number) {
    console.log(`[PERF FRONTEND] habitTapToVisual: ${Math.round(durationMs)}ms (habit: ${habitId})`);
  }

  private checkAndReport() {
    // Report when essential milestones are logged
    const { authReady, syncStart, syncEnd, dashboardReady, habitsReady, quoteReady } = this.milestones;
    
    // Log individual milestone when it arrives
    const latestKeys = Object.keys(this.milestones) as (keyof PerfMilestones)[];
    const latestKey = latestKeys[latestKeys.length - 1];
    if (latestKey) {
      console.log(`[PERF FRONTEND] ${latestKey}: ${this.milestones[latestKey]}ms`);
    }

    if (authReady !== undefined && dashboardReady !== undefined && habitsReady !== undefined && !this.hasReported) {
      this.hasReported = true;
      console.log(
        `[PERF FRONTEND SUMMARY]\n` +
        `authReady: ${authReady}ms\n` +
        `syncStart: ${syncStart ?? 0}ms\n` +
        `syncEnd: ${syncEnd ?? 0}ms\n` +
        `dashboardReady: ${dashboardReady}ms\n` +
        `habitsReady: ${habitsReady}ms\n` +
        `quoteReady: ${quoteReady ?? "async"}ms`
      );
    }
  }

  public getMilestones(): PerfMilestones {
    return { ...this.milestones };
  }
}

export const perfLogger = new PerfLogger();
