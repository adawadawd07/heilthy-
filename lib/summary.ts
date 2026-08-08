import { Meal, DailySummary } from '@/types';

export function calculateNutritionTotals(meals: Meal[], date: string): DailySummary {
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.total_calories,
      protein_g: acc.protein_g + meal.total_protein_g,
      carbs_g: acc.carbs_g + meal.total_carbs_g,
      fat_g: acc.fat_g + meal.total_fat_g,
      scan_count: acc.scan_count + (meal.source === 'scan' ? 1 : 0),
      manual_count: acc.manual_count + (meal.source === 'manual' ? 1 : 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, scan_count: 0, manual_count: 0 }
  );

  return {
    date,
    ...totals,
    protein_g: Math.round(totals.protein_g * 10) / 10,
    carbs_g: Math.round(totals.carbs_g * 10) / 10,
    fat_g: Math.round(totals.fat_g * 10) / 10,
    meal_count: meals.length,
  };
}
