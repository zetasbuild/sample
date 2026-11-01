import { cookies } from 'next/headers';
import { getAdminCredentials } from './store';

export const AUTH_COOKIE_NAME = 'dualview_admin_session';
const SECRET_SALT = 'dualview_secure_token_secret_2026';

export function createSessionToken(username: string): string {
  const payload = Buffer.from(`${username}:${Date.now()}:${SECRET_SALT}`).toString('base64');
  return payload;
}

export function verifySessionToken(token: string | undefined): { valid: boolean; username?: string } {
  if (!token) return { valid: false };
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user, , salt] = decoded.split(':');
    const creds = getAdminCredentials();
    if (user === creds.username && salt === SECRET_SALT) {
      return { valid: true, username: user };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const result = verifySessionToken(sessionToken);
  if (result.valid && result.username) {
    return { username: result.username, role: 'admin' as const };
  }
  return null;
}
