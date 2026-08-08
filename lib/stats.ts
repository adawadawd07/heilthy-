import { DailySummary, Meal, User } from '@/types';
import { calculateNutritionTotals } from './summary';
import { addDays } from './dates';
import { KCAL_PER_G } from './goals';
import { round } from './nutrition';

export interface DayStat extends DailySummary {
  goalCalories: number;
  pct: number;
  logged: boolean;
}

export interface MacroSplit {
  protein: number;
  carbs: number;
  fat: number;
}

export interface StatsResult {
  range: number;
  days: DayStat[];
  loggedDays: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  onTargetDays: number;
  adherencePct: number;
  streak: number;
  bestDay: DayStat | null;
  worstDay: DayStat | null;
  macroSplit: MacroSplit;
  goals: Pick<User, 'daily_calories' | 'daily_protein_g' | 'daily_carbs_g' | 'daily_fat_g'>;
}

const ON_TARGET_LOWER = 0.9;
const ON_TARGET_UPPER = 1.1;

function buildDateRange(today: string, days: number): string[] {
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    dates.push(addDays(today, -offset));
  }
  return dates;
}

function groupByDate(meals: Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const meal of meals) {
    const list = map.get(meal.logical_date) ?? [];
    list.push(meal);
    map.set(meal.logical_date, list);
  }
  return map;
}

/**
 * Consecutive logged days counting backwards from today.
 * A missing today does not break the streak if yesterday is logged,
 * so the streak stays visible until the day actually ends.
 */
export function calculateStreak(loggedDates: Set<string>, today: string): number {
  let cursor = loggedDates.has(today) ? today : addDays(today, -1);
  if (!loggedDates.has(cursor)) return 0;

  let streak = 0;
  while (loggedDates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function buildStats(
  meals: Meal[],
  user: Pick<User, 'daily_calories' | 'daily_protein_g' | 'daily_carbs_g' | 'daily_fat_g'>,
  today: string,
  range: number
): StatsResult {
  const goalCalories = user.daily_calories || 0;
  const byDate = groupByDate(meals);
  const loggedDates = new Set(
    [...byDate.entries()].filter(([, list]) => list.length > 0).map(([date]) => date)
  );

  const days: DayStat[] = buildDateRange(today, range).map((date) => {
    const dayMeals = byDate.get(date) ?? [];
    const summary = calculateNutritionTotals(dayMeals, date);
    return {
      ...summary,
      goalCalories,
      pct: goalCalories > 0 ? round((summary.calories / goalCalories) * 100, 0) : 0,
      logged: dayMeals.length > 0,
    };
  });

  const loggedStats = days.filter((d) => d.logged);
  const loggedDays = loggedStats.length;

  const sum = loggedStats.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein_g,
      carbs: acc.carbs + d.carbs_g,
      fat: acc.fat + d.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const avg = (total: number) => (loggedDays > 0 ? round(total / loggedDays, 1) : 0);

  const onTargetDays = goalCalories
    ? loggedStats.filter(
        (d) =>
          d.calories >= goalCalories * ON_TARGET_LOWER &&
          d.calories <= goalCalories * ON_TARGET_UPPER
      ).length
    : 0;

  const byDeviation = goalCalories
    ? [...loggedStats].sort(
        (a, b) => Math.abs(a.calories - goalCalories) - Math.abs(b.calories - goalCalories)
      )
    : [];

  const macroCalories =
    sum.protein * KCAL_PER_G.protein + sum.carbs * KCAL_PER_G.carbs + sum.fat * KCAL_PER_G.fat;

  const macroSplit: MacroSplit = macroCalories
    ? {
        protein: round((sum.protein * KCAL_PER_G.protein * 100) / macroCalories, 0),
        carbs: round((sum.carbs * KCAL_PER_G.carbs * 100) / macroCalories, 0),
        fat: round((sum.fat * KCAL_PER_G.fat * 100) / macroCalories, 0),
      }
    : { protein: 0, carbs: 0, fat: 0 };

  return {
    range,
    days,
    loggedDays,
    avgCalories: Math.round(avg(sum.calories)),
    avgProtein: avg(sum.protein),
    avgCarbs: avg(sum.carbs),
    avgFat: avg(sum.fat),
    onTargetDays,
    adherencePct: loggedDays > 0 ? round((onTargetDays / loggedDays) * 100, 0) : 0,
    streak: calculateStreak(loggedDates, today),
    bestDay: byDeviation[0] ?? null,
    worstDay: byDeviation.length > 1 ? (byDeviation.at(-1) ?? null) : null,
    macroSplit,
    goals: {
      daily_calories: user.daily_calories,
      daily_protein_g: user.daily_protein_g,
      daily_carbs_g: user.daily_carbs_g,
      daily_fat_g: user.daily_fat_g,
    },
  };
}
