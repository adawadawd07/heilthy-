import { NextRequest, NextResponse } from 'next/server';
import { updatePreferences, updateUser } from '@/lib/db';
import { requireApiUser } from '@/lib/session';
import { toPublicUser } from '@/lib/auth';
import { User } from '@/types';

const LANGUAGES = ['ar', 'en'] as const;
const THEMES = ['system', 'light', 'dark'] as const;
const MAX_CALORIES = 20000;
const MAX_MACRO_G = 2000;

function clampNumber(value: unknown, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(0, Math.round(n)));
}

function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  return NextResponse.json(
    { user: toPublicUser(user) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const body = (await req.json()) as Partial<User>;

  const patch: Partial<User> = {
    display_name:
      typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 40) : undefined,
    language: LANGUAGES.includes(body.language as (typeof LANGUAGES)[number])
      ? body.language
      : undefined,
    theme: THEMES.includes(body.theme as (typeof THEMES)[number]) ? body.theme : undefined,
    timezone: isValidTimezone(body.timezone) ? body.timezone : undefined,
    notifications_enabled:
      typeof body.notifications_enabled === 'boolean' ? body.notifications_enabled : undefined,
    daily_calories: clampNumber(body.daily_calories, MAX_CALORIES),
    daily_protein_g: clampNumber(body.daily_protein_g, MAX_MACRO_G),
    daily_carbs_g: clampNumber(body.daily_carbs_g, MAX_MACRO_G),
    daily_fat_g: clampNumber(body.daily_fat_g, MAX_MACRO_G),
  };

  const updated = await updateUser(user.id, patch);
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await updatePreferences(user.id, {
    language: patch.language,
    timezone: patch.timezone,
    theme: patch.theme,
    notifications_enabled: patch.notifications_enabled,
    daily_calories: patch.daily_calories,
    daily_protein_g: patch.daily_protein_g,
    daily_carbs_g: patch.daily_carbs_g,
    daily_fat_g: patch.daily_fat_g,
  });

  return NextResponse.json({ ok: true, user: toPublicUser(updated) });
}
