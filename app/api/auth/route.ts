import { NextResponse } from 'next/server';
import { toPublicUser } from '@/lib/auth';
import { getCurrentUser } from '@/lib/session';

/** Returns the current (default) user. */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { user: user ? toPublicUser(user) : null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null, adoptedMeals: 0 });
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
