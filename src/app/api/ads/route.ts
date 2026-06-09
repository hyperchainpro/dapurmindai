import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all ad placements (admin) or get active by position (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    // Public: get active ad for a specific position
    if (position) {
      const ad = await db.adPlacement.findFirst({
        where: { position, isActive: true },
      });
      if (!ad) {
        return NextResponse.json({ success: true, data: null });
      }
      return NextResponse.json({ success: true, data: { id: ad.id, scriptContent: ad.scriptContent, maxWidth: ad.maxWidth, platform: ad.platform } });
    }

    // Admin: list all
    const ads = await db.adPlacement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ error: 'Gagal memuat iklan' }, { status: 500 });
  }
}

// POST - Create ad placement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, position, scriptContent, platform, isActive, maxWidth } = body;

    if (!name || !position) {
      return NextResponse.json({ error: 'Nama dan posisi wajib diisi' }, { status: 400 });
    }

    const ad = await db.adPlacement.create({
      data: {
        name,
        position,
        scriptContent: scriptContent || '',
        platform: platform || 'custom',
        isActive: isActive ?? true,
        maxWidth: maxWidth || '100%',
      },
    });

    return NextResponse.json({ success: true, data: ad }, { status: 201 });
  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json({ error: 'Gagal membuat iklan' }, { status: 500 });
  }
}

// PUT - Update ad placement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.position !== undefined) updateData.position = fields.position;
    if (fields.scriptContent !== undefined) updateData.scriptContent = fields.scriptContent;
    if (fields.platform !== undefined) updateData.platform = fields.platform;
    if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
    if (fields.maxWidth !== undefined) updateData.maxWidth = fields.maxWidth;

    const ad = await db.adPlacement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json({ error: 'Gagal mengupdate iklan' }, { status: 500 });
  }
}