import { NextRequest, NextResponse } from 'next/server';
import { getPresets, addPreset, deletePreset } from '@/lib/store';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'youtube' | 'website' | null;
  const presets = getPresets(type || undefined);
  return NextResponse.json({ success: true, presets });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin login required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, url, type, description } = body;

    if (!title || !url || !type) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const created = addPreset({ title, url, type, description });
    return NextResponse.json({ success: true, preset: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Admin login required.' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing id parameter' }, { status: 400 });
  }

  const deleted = deletePreset(id);
  if (deleted) {
    return NextResponse.json({ success: true, message: 'Preset deleted' });
  }

  return NextResponse.json({ success: false, message: 'Preset not found' }, { status: 404 });
}

