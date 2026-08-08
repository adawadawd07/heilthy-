import { NextResponse } from 'next/server';
import { getMeals } from '@/lib/db';
import { requireApiUser } from '@/lib/session';
import { formatTimeInTimezone } from '@/lib/dates';

const HEADERS = [
  'date',
  'time',
  'meal_type',
  'food',
  'quantity',
  'unit',
  'weight_g',
  'calories',
  'protein_g',
  'carbs_g',
  'fat_g',
  'source',
] as const;

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const meals = await getMeals(user.id);

  const rows = meals
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .flatMap((meal) =>
      meal.items.map((item) => ({
        date: meal.logical_date,
        time: formatTimeInTimezone(meal.timestamp, user.timezone),
        meal_type: meal.meal_type,
        food: item.name_ar,
        quantity: item.quantity,
        unit: item.unit,
        weight_g: item.weight_g,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        source: meal.source,
      }))
    );

  const csv = [
    HEADERS.join(','),
    ...rows.map((row) => HEADERS.map((header) => escapeCsv(row[header])).join(',')),
  ].join('\r\n');

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="heilthy-${user.username}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
