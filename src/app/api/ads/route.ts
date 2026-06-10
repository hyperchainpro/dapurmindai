import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/convex';
import { api } from '../../../../convex/_generated/api';

// GET - List all ad placements (admin) or get active by position (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    // Public: get active ad for a specific position
    if (position) {
      const ad = await client.query(api.ads.getAdsByPosition, { position });
      if (!ad) {
        return NextResponse.json({ success: true, data: null });
      }
      return NextResponse.json({ success: true, data: { id: ad._id, scriptContent: ad.scriptContent, maxWidth: ad.maxWidth, platform: ad.platform } });
    }

    // Admin: list all
    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    const allAds = await client.query(api.ads.listAllAds, { token });
    const ads = allAds.map((ad: any) => ({
      ...ad,
      id: ad._id,
      createdAt: new Date(ad._creationTime).toISOString(),
    }));
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

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    const adId = await client.mutation(api.ads.createAd, {
      token,
      name,
      position,
      scriptContent: scriptContent || '',
      platform: platform || 'custom',
      isActive: isActive ?? true,
      maxWidth: maxWidth || '100%',
    });

    return NextResponse.json({ success: true, data: { id: adId, name, position, scriptContent, platform, isActive, maxWidth } }, { status: 201 });
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

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    const updateData: any = { token, adId: id as any };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.position !== undefined) updateData.position = fields.position;
    if (fields.scriptContent !== undefined) updateData.scriptContent = fields.scriptContent;
    if (fields.platform !== undefined) updateData.platform = fields.platform;
    if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
    if (fields.maxWidth !== undefined) updateData.maxWidth = fields.maxWidth;

    await client.mutation(api.ads.updateAd, updateData);

    return NextResponse.json({ success: true, data: { id, ...fields } });
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json({ error: 'Gagal mengupdate iklan' }, { status: 500 });
  }
}