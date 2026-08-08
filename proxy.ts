import { NextRequest, NextResponse } from 'next/server';

export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)'],
};
