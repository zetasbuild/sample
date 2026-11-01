import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth';
import { getAdminCredentials, updateAdminCredentials } from '@/lib/store';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const creds = getAdminCredentials();
  return NextResponse.json({
    success: true,
    credentials: {
      username: creds.username,
      password: creds.passwordPlain,
      updatedAt: creds.updatedAt
    }
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Username must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim().length < 4) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const updated = updateAdminCredentials(username, password);

    // Re-issue cookie with the new username
    const token = createSessionToken(updated.username);
    const response = NextResponse.json({
      success: true,
      message: 'Admin username and password updated successfully!',
      credentials: {
        username: updated.username,
        updatedAt: updated.updatedAt
      }
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid payload' },
      { status: 400 }
    );
  }
}

