import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth';
import { getAdminCredentials } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const creds = getAdminCredentials();

    if (username === creds.username && password === creds.passwordPlain) {
      const token = createSessionToken(username);
      const response = NextResponse.json({
        success: true,
        user: { username, role: 'admin' },
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid admin username or password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  }
}
