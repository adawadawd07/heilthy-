export const KCAL_PER_G = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

const PROTEIN_SHARE = 680 / 1475;
const FAT_SHARE = 315 / 1475;

export interface MacroGoals {
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
}

export function deriveMacroGoals(calories: number): MacroGoals {
  const safeCalories = Math.max(0, Math.round(calories) || 0);
  const protein = Math.round((safeCalories * PROTEIN_SHARE) / KCAL_PER_G.protein);
  const fat = Math.round((safeCalories * FAT_SHARE) / KCAL_PER_G.fat);
  const carbsCalories = safeCalories - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat;
  const carbs = Math.max(0, Math.round(carbsCalories / KCAL_PER_G.carbs));

  return {
    daily_calories: safeCalories,
    daily_protein_g: protein,
    daily_carbs_g: carbs,
    daily_fat_g: fat,
  };
}

export function caloriesFromMacros(goals: Omit<MacroGoals, 'daily_calories'>): number {
  return Math.round(
    goals.daily_protein_g * KCAL_PER_G.protein +
      goals.daily_carbs_g * KCAL_PER_G.carbs +
      goals.daily_fat_g * KCAL_PER_G.fat
  );
}
