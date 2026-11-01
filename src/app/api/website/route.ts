import { NextRequest, NextResponse } from 'next/server';
import { getActiveWebsiteUrl, setActiveWebsiteUrl } from '@/lib/store';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const url = getActiveWebsiteUrl();
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
      return NextResponse.json({ success: false, message: 'Please provide a valid website URL' }, { status: 400 });
    }

    const updated = setActiveWebsiteUrl(url.trim());
    return NextResponse.json({ success: true, url: updated, message: 'Active website link updated successfully!' });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }
}
