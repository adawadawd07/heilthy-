import { NextRequest, NextResponse } from 'next/server';
import { getVisionProvider } from '@/lib/ai';
import { requireApiUser } from '@/lib/session';
import { calculateNutrition, getFoodByName } from '@/lib/nutrition';
import { AnalyzedFoodItem, Food } from '@/types';

const GENERIC_MIXED_DISH: Omit<Food, 'id' | 'name' | 'name_ar' | 'name_en'> = {
  serving_unit: 'g',
  serving_weight_g: 100,
  calories_per_100g: 180,
  protein_g_per_100g: 9,
  carbs_g_per_100g: 18,
  fat_g_per_100g: 8,
  source: 'estimate',
};

function toFood(item: AnalyzedFoodItem): { food: Food; matchedId: string; source: string } {
  const seed = getFoodByName(item.name_ar) || getFoodByName(item.name_en) || getFoodByName(item.name);
  if (seed) return { food: seed, matchedId: seed.id, source: 'seed' };

  const hasAiMacros = typeof item.calories_per_100g === 'number' && item.calories_per_100g > 0;
  const base = hasAiMacros
    ? {
        serving_unit: item.unit || 'g',
        serving_weight_g: item.estimated_weight_g || 100,
        calories_per_100g: item.calories_per_100g ?? 0,
        protein_g_per_100g: item.protein_g_per_100g ?? 0,
        carbs_g_per_100g: item.carbs_g_per_100g ?? 0,
        fat_g_per_100g: item.fat_g_per_100g ?? 0,
        source: 'ai',
      }
    : GENERIC_MIXED_DISH;

  return {
    food: {
      id: 'ai',
      name: item.name,
      name_ar: item.name_ar,
      name_en: item.name_en,
      ...base,
    },
    matchedId: '',
    source: base.source,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const provider = getVisionProvider();
    const analysis = await provider.analyzeFoodImage(image);

    const items = (analysis.items ?? []).map((item) => {
      const { food, matchedId, source } = toFood(item);
      const weight = Math.max(0, Number(item.estimated_weight_g) || 0);
      return {
        ...item,
        estimated_weight_g: weight,
        matched_food_id: matchedId,
        nutrition_source: source,
        calories_per_100g: food.calories_per_100g,
        protein_g_per_100g: food.protein_g_per_100g,
        carbs_g_per_100g: food.carbs_g_per_100g,
        fat_g_per_100g: food.fat_g_per_100g,
        ...calculateNutrition(food, weight),
      };
    });

    const notes = [...(analysis.notes ?? [])];
    if (items.some((i) => i.nutrition_source === 'estimate')) {
      notes.push('بعض الأصناف غير معروفة، تم استخدام تقدير عام. عدّل الوزن للحصول على دقة أفضل.');
    }

    return NextResponse.json({ items, notes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
