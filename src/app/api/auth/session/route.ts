import { NextRequest, NextResponse } from 'next/server';
import { verifyCoordinatorAuth, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const auth = verifyCoordinatorAuth(req);
  if (!auth) {
    return NextResponse.json(
      { authenticated: false, error: 'No active coordinator session.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    session: auth,
  });
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Coordinator session cleared.',
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
