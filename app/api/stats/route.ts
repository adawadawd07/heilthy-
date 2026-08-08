import { NextRequest, NextResponse } from 'next/server';
import { getMeals } from '@/lib/db';
import { requireApiUser } from '@/lib/session';
import { getLogicalNutritionDate } from '@/lib/dates';
import { buildStats } from '@/lib/stats';

const ALLOWED_RANGES = [7, 30, 90];

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { searchParams } = new URL(req.url);
    const requested = Number.parseInt(searchParams.get('days') || '7', 10);
    const range = ALLOWED_RANGES.includes(requested) ? requested : 7;

    const today = getLogicalNutritionDate(new Date(), user.timezone);
    const meals = await getMeals(user.id);
    const stats = buildStats(meals, user, today, range);

    return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
