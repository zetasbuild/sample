import { NextRequest, NextResponse } from 'next/server';
import { getActiveVideoUrl, setActiveVideoUrl } from '@/lib/store';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const url = getActiveVideoUrl();
  return NextResponse.json({ success: true, url });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin login required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ success: false, message: 'Please provide a valid YouTube link' }, { status: 400 });
    }

    const updated = setActiveVideoUrl(url.trim());
    return NextResponse.json({ success: true, url: updated, message: 'Active YouTube video updated successfully!' });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }
}
