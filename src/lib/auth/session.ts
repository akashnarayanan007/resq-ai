import crypto from 'crypto';
import { CoordinatorSession } from '@/types';
import { NextRequest } from 'next/server';

const SESSION_SECRET =
  process.env.DEMO_ADMIN_SECRET ||
  process.env.SESSION_SECRET ||
  'resq-ai-demo-admin-secret-chennai-metropolis-2024';

const DEFAULT_PASSCODE = process.env.COORDINATOR_PASSCODE || 'RESQ-CHENNAI-2024';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const SESSION_COOKIE_NAME = 'resq_coordinator_session';

/**
 * Validates coordinator credentials.
 */
export function validateCoordinatorCredentials(passcode: string): boolean {
  if (!passcode) return false;
  return passcode.trim() === DEFAULT_PASSCODE;
}

/**
 * Creates an HMAC-signed server session token.
 */
export function createCoordinatorSessionToken(username: string = 'Operations Lead'): string {
  const now = Date.now();
  const session: CoordinatorSession = {
    username,
    role: 'coordinator',
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * Verifies the signature and expiration of a session token on the server.
 * Never allows client-only forgery.
 */
export function verifyCoordinatorSessionToken(token?: string | null): CoordinatorSession | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null; // Invalid signature
  }

  try {
    const raw = Buffer.from(payload, 'base64url').toString('utf-8');
    const session: CoordinatorSession = JSON.parse(raw);

    // Check expiration
    if (Date.now() > session.expiresAt) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Helper to inspect session token from either Authorization header (Bearer token) or Cookies.
 */
export function getCoordinatorSessionFromRequest(
  req: Request | NextRequest
): CoordinatorSession | null {
  // 1. Check Bearer Authorization Header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = verifyCoordinatorSessionToken(token);
    if (session) return session;
  }

  // 2. Check Session Cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  if (match) {
    const token = decodeURIComponent(match[1]);
    const session = verifyCoordinatorSessionToken(token);
    if (session) return session;
  }

  return null;
}

/**
 * Enforces coordinator authorization on server-side API routes.
 */
export function verifyCoordinatorAuth(req: Request | NextRequest): {
  authenticated: boolean;
  session?: CoordinatorSession;
  error?: string;
} {
  const session = getCoordinatorSessionFromRequest(req);
  if (!session) {
    return {
      authenticated: false,
      error: 'Unauthorized: Valid server-validated coordinator session required.',
    };
  }
  return {
    authenticated: true,
    session,
  };
}
