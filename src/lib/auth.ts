import { cookies } from 'next/headers';
import { getAdminCredentials } from './store';

export const AUTH_COOKIE_NAME = 'dualview_admin_session';
const SECRET_SALT = 'dualview_secure_token_secret_2026';

export function createSessionToken(username: string, role = 'admin'): string {
  const payload = Buffer.from(`${username}:${role}:${Date.now()}:${SECRET_SALT}`).toString('base64');
  return payload;
}

export function verifySessionToken(token: string | undefined): { valid: boolean; username?: string; role?: string } {
  if (!token) return { valid: false };
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    // Support new format: username:role:timestamp:salt
    if (parts.length >= 4) {
      const [user, role, , salt] = parts;
      const creds = getAdminCredentials();
      if (salt === SECRET_SALT && (user === 'sample' || user === 'admin' || user === creds.username)) {
        return { valid: true, username: user, role: role || 'admin' };
      }
    }
    
    // Fallback for older format: username:timestamp:salt
    if (parts.length === 3) {
      const [user, , salt] = parts;
      const creds = getAdminCredentials();
      if (salt === SECRET_SALT && (user === 'sample' || user === 'admin' || user === creds.username)) {
        return { valid: true, username: user, role: 'admin' };
      }
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
