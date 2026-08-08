import { NextRequest, NextResponse } from 'next/server';
import { createMeal, getMeals } from '@/lib/db';
import { requireApiUser } from '@/lib/session';
import { getHourInTimezone, getLogicalNutritionDate } from '@/lib/dates';
import { computeMealTotals } from '@/lib/nutrition';
import { inferMealType, isMealSource, isMealType } from '@/lib/meals';
import { Meal, MealItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const meals = await getMeals(user.id, date || undefined);
    return NextResponse.json(meals, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const body = await req.json();

    const items: MealItem[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Meal must contain at least one item' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const mealType: Meal['meal_type'] = isMealType(body.meal_type)
      ? body.meal_type
      : inferMealType(getHourInTimezone(now, user.timezone));
    const source: Meal['source'] = isMealSource(body.source) ? body.source : 'manual';

    const meal: Meal = {
      id,
      user_id: user.id,
      name: body.name ?? mealType,
      name_ar: body.name_ar ?? mealType,
      name_en: body.name_en ?? mealType,
      meal_type: mealType,
      source,
      image_url: body.image_url,
      items: items.map((item) => ({ ...item, meal_id: id })),
      timestamp: now,
      logical_date: getLogicalNutritionDate(now, user.timezone),
      ...computeMealTotals(items),
      created_at: now,
      updated_at: now,
    };

    await createMeal(meal);
    return NextResponse.json(meal);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
