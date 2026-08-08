import { NextRequest, NextResponse } from 'next/server';
import { deleteMeal, getMealById, updateMeal } from '@/lib/db';
import { requireApiUser } from '@/lib/session';
import { computeMealTotals } from '@/lib/nutrition';
import { isMealType } from '@/lib/meals';
import { Meal, MealItem } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { id } = await params;
    const meal = await getMealById(user.id, id);
    if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(meal, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { id } = await params;
    const existing = await getMealById(user.id, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const items: MealItem[] = Array.isArray(body.items) ? body.items : existing.items;
    if (items.length === 0) {
      return NextResponse.json({ error: 'Meal must contain at least one item' }, { status: 400 });
    }

    const mealType = isMealType(body.meal_type) ? body.meal_type : existing.meal_type;

    const updated: Meal = {
      ...existing,
      meal_type: mealType,
      items: items.map((item) => ({ ...item, meal_id: id })),
      ...computeMealTotals(items),
      // timestamp and logical_date stay untouched so an edit never moves the meal to another day
      timestamp: existing.timestamp,
      logical_date: existing.logical_date,
      updated_at: new Date().toISOString(),
    };

    await updateMeal(user.id, updated);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { id } = await params;
    const meal = await getMealById(user.id, id);
    if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteMeal(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
