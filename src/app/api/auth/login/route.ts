import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateCoordinatorCredentials,
  createCoordinatorSessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/session';

const loginSchema = z.object({
  passcode: z.string().min(1, 'Passcode is required'),
  username: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid login format', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { passcode, username = 'Coordinator Officer' } = parseResult.data;

    // Server-side verification: never client-only
    const isValid = validateCoordinatorCredentials(passcode);
    if (!isValid) {
      return NextResponse.json(
        {
          error:
            'Invalid coordinator authorization passcode. Default demo passcode is: RESQ-CHENNAI-2024',
        },
        { status: 401 }
      );
    }

    // Generate server-signed HMAC token
    const token = createCoordinatorSessionToken(username);

    const response = NextResponse.json({
      success: true,
      message: 'Coordinator session authenticated successfully.',
      session: {
        username,
        role: 'coordinator',
      },
      token, // Also return Bearer token for API / mobile header use
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (err) {
    console.error('Coordinator login error:', err);
    return NextResponse.json({ error: 'Server authentication failure' }, { status: 500 });
  }
}
