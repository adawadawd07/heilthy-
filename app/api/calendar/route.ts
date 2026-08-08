import { NextRequest, NextResponse } from 'next/server';
import { getMeals } from '@/lib/db';
import { requireApiUser } from '@/lib/session';

function parseIntInRange(raw: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseIntInRange(searchParams.get('month'), now.getMonth() + 1, 1, 12);
    const year = parseIntInRange(searchParams.get('year'), now.getFullYear(), 1970, 3000);
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    const all = await getMeals(user.id);
    const filtered = all.filter((m) => m.logical_date.startsWith(prefix));
    const grouped: Record<string, typeof filtered> = {};
    for (const meal of filtered) {
      grouped[meal.logical_date] = grouped[meal.logical_date] || [];
      grouped[meal.logical_date].push(meal);
    }
    return NextResponse.json(grouped, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
