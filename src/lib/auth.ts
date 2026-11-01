import { cookies } from 'next/headers';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
export const AUTH_COOKIE_NAME = 'dualview_admin_session';

// A simple HMAC-like or signature string for local session
const SECRET_SALT = 'dualview_secure_token_secret_2026';

export function createSessionToken(username: string): string {
  const payload = Buffer.from(`${username}:${Date.now()}:${SECRET_SALT}`).toString('base64');
  return payload;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user, , salt] = decoded.split(':');
    return user === ADMIN_USERNAME && salt === SECRET_SALT;
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (verifySessionToken(sessionToken)) {
    return { username: ADMIN_USERNAME, role: 'admin' as const };
  }
  return null;
}

