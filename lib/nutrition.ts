import { Food, Meal, MealItem } from '@/types';

export function round(value: number, decimals = 1): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateNutrition(
  food: Food,
  weightG: number
): Pick<MealItem, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'> {
  const ratio = Math.max(0, weightG) / 100;
  return {
    calories: round(food.calories_per_100g * ratio, 1),
    protein_g: round(food.protein_g_per_100g * ratio, 1),
    carbs_g: round(food.carbs_g_per_100g * ratio, 1),
    fat_g: round(food.fat_g_per_100g * ratio, 1),
  };
}

export function computeMealTotals(
  items: MealItem[]
): Pick<Meal, 'total_calories' | 'total_protein_g' | 'total_carbs_g' | 'total_fat_g'> {
  const totals = (items ?? []).reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein_g: acc.protein_g + (Number(item.protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(item.carbs_g) || 0),
      fat_g: acc.fat_g + (Number(item.fat_g) || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return {
    total_calories: round(totals.calories, 0),
    total_protein_g: round(totals.protein_g, 1),
    total_carbs_g: round(totals.carbs_g, 1),
    total_fat_g: round(totals.fat_g, 1),
  };
}

export const SEED_FOODS: Food[] = [
  { id: '1', name_ar: 'بيض مسلوق', name_en: 'Boiled egg', name: 'Boiled egg', serving_unit: 'piece', serving_weight_g: 50, calories_per_100g: 155, protein_g_per_100g: 13, carbs_g_per_100g: 1.1, fat_g_per_100g: 11, fiber_g_per_100g: 0, source: 'seed' },
  { id: '2', name_ar: 'أرز أبيض مطبوخ', name_en: 'White rice cooked', name: 'White rice cooked', serving_unit: 'cup', serving_weight_g: 158, calories_per_100g: 130, protein_g_per_100g: 2.7, carbs_g_per_100g: 28, fat_g_per_100g: 0.3, fiber_g_per_100g: 0.4, source: 'seed' },
  { id: '3', name_ar: 'صدر دجاج مطبوخ', name_en: 'Cooked chicken breast', name: 'Cooked chicken breast', serving_unit: 'g', serving_weight_g: 100, calories_per_100g: 165, protein_g_per_100g: 31, carbs_g_per_100g: 0, fat_g_per_100g: 3.6, fiber_g_per_100g: 0, source: 'seed' },
  { id: '4', name_ar: 'خبز', name_en: 'Bread', name: 'Bread', serving_unit: 'slice', serving_weight_g: 30, calories_per_100g: 265, protein_g_per_100g: 9, carbs_g_per_100g: 49, fat_g_per_100g: 3.2, fiber_g_per_100g: 2.7, source: 'seed' },
  { id: '5', name_ar: 'موز', name_en: 'Banana', name: 'Banana', serving_unit: 'piece', serving_weight_g: 118, calories_per_100g: 89, protein_g_per_100g: 1.1, carbs_g_per_100g: 23, fat_g_per_100g: 0.3, fiber_g_per_100g: 2.6, source: 'seed' },
  { id: '6', name_ar: 'تفاح', name_en: 'Apple', name: 'Apple', serving_unit: 'piece', serving_weight_g: 182, calories_per_100g: 52, protein_g_per_100g: 0.3, carbs_g_per_100g: 14, fat_g_per_100g: 0.2, fiber_g_per_100g: 2.4, source: 'seed' },
  { id: '7', name_ar: 'حليب', name_en: 'Milk', name: 'Milk', serving_unit: 'cup', serving_weight_g: 244, calories_per_100g: 42, protein_g_per_100g: 3.4, carbs_g_per_100g: 5, fat_g_per_100g: 1, fiber_g_per_100g: 0, source: 'seed' },
  { id: '8', name_ar: 'زبادي', name_en: 'Yogurt', name: 'Yogurt', serving_unit: 'cup', serving_weight_g: 170, calories_per_100g: 59, protein_g_per_100g: 10, carbs_g_per_100g: 3.6, fat_g_per_100g: 0.4, fiber_g_per_100g: 0, source: 'seed' },
  { id: '9', name_ar: 'جبن', name_en: 'Cheese', name: 'Cheese', serving_unit: 'g', serving_weight_g: 100, calories_per_100g: 264, protein_g_per_100g: 17, carbs_g_per_100g: 3.4, fat_g_per_100g: 21, fiber_g_per_100g: 0, source: 'seed' },
  { id: '10', name_ar: 'سلطة', name_en: 'Salad', name: 'Salad', serving_unit: 'bowl', serving_weight_g: 200, calories_per_100g: 33, protein_g_per_100g: 1.5, carbs_g_per_100g: 5, fat_g_per_100g: 0.5, fiber_g_per_100g: 2.5, source: 'seed' },
  { id: '11', name_ar: 'فول', name_en: 'Beans', name: 'Beans', serving_unit: 'cup', serving_weight_g: 180, calories_per_100g: 127, protein_g_per_100g: 9, carbs_g_per_100g: 22, fat_g_per_100g: 0.5, fiber_g_per_100g: 7.5, source: 'seed' },
  { id: '12', name_ar: 'سمك مشوي', name_en: 'Grilled fish', name: 'Grilled fish', serving_unit: 'g', serving_weight_g: 100, calories_per_100g: 206, protein_g_per_100g: 22, carbs_g_per_100g: 0, fat_g_per_100g: 12, fiber_g_per_100g: 0, source: 'seed' },
];

export function findFoodByName(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEED_FOODS.filter(
    (f) =>
      f.name_ar.toLowerCase().includes(q) ||
      f.name_en.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q)
  );
}

export function getFoodByName(name: string): Food | undefined {
  return SEED_FOODS.find(
    (f) =>
      f.name_ar.toLowerCase() === name.toLowerCase() ||
      f.name_en.toLowerCase() === name.toLowerCase() ||
      f.name.toLowerCase() === name.toLowerCase()
  );
}
