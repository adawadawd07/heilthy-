import { NextResponse } from 'next/server';
import { clearUserMeals, deleteAllUserData } from '@/lib/db';
import { requireApiUser } from '@/lib/session';

/** Wipes logged meals but keeps the account and its goals. */
export async function POST() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  await clearUserMeals(user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  await deleteAllUserData(user.id);
  return NextResponse.json({ ok: true });
}
