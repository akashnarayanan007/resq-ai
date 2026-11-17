import crypto from 'crypto';
import { CoordinatorSession } from '@/types';
import { NextRequest } from 'next/server';

function getSessionSecret(): string {
  const secret = process.env.DEMO_ADMIN_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DEMO_ADMIN_SECRET or SESSION_SECRET must be configured in environment.');
    }
    return 'resq-local-dev-session-secret-ephemeral-key';
  }
  return secret;
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_COOKIE_NAME = 'resq_coordinator_session';

/**
 * Validates coordinator credentials against environment variable only.
 * No public default passcode is hardcoded.
 */
export function validateCoordinatorCredentials(passcode: string): boolean {
  if (!passcode || typeof passcode !== 'string') return false;
  
  const configuredPasscode = process.env.COORDINATOR_PASSCODE;
  if (!configuredPasscode) {
    console.warn('COORDINATOR_PASSCODE is not set in environment. Access denied.');
    return false;
  }

  const inputBuffer = Buffer.from(passcode.trim());
  const expectedBuffer = Buffer.from(configuredPasscode.trim());

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
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
    .createHmac('sha256', getSessionSecret())
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

  const [payloadBase64, providedSignature] = parts;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payloadBase64)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSignature);
    const providedBuf = Buffer.from(providedSignature);

    if (expectedBuf.length !== providedBuf.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const session: CoordinatorSession = JSON.parse(jsonStr);

    if (Date.now() > session.expiresAt) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies coordinator session from request cookies or Authorization header.
 */
export function verifyCoordinatorAuth(req: NextRequest): CoordinatorSession | null {
  // 1. Check HTTP-only cookie
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifyCoordinatorSessionToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Check Bearer Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    return verifyCoordinatorSessionToken(bearerToken);
  }

  return null;
}
