import { NextRequest, NextResponse } from 'next/server';
import { getHistory, addHistory, clearHistory } from '@/lib/store';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const history = getHistory(20);
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

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  clearHistory();
  return NextResponse.json({ success: true, message: 'History cleared' });
}

