import { NextRequest, NextResponse } from 'next/server';
import { getHistory, addHistory, clearHistory } from '@/lib/store';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'youtube' | 'website' | null;
  const history = getHistory(50, type || undefined);
  return NextResponse.json({ success: true, history });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type, title } = body;

    if (!url || !type) {
      return NextResponse.json({ success: false, message: 'Missing url or type' }, { status: 400 });
    }

    const item = addHistory({ url, type, title });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') as 'youtube' | 'website' | null;
  clearHistory(type || undefined);
  return NextResponse.json({ success: true, message: 'History cleared' });
}
