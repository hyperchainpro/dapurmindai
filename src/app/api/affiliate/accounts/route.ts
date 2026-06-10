import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AffiliateAccount } from '@/types';

// GET - Fetch all affiliate accounts
import { client } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';

// GET all affiliate accounts (Admin)
export async function GET(request: NextRequest) {
  try {
    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    const accounts = await client.query(api.affiliate.getAffiliateAccounts, { token });
    const formatted = accounts.map((acc: any) => ({
      ...acc,
      id: acc._id,
      createdAt: new Date(acc._creationTime).toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[Affiliate GET] Error:', error);
    return NextResponse.json({ error: 'Gagal memuat akun afiliasi' }, { status: 500 });
  }
}

// POST create new affiliate account (Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, affiliateId, apiKey, baseUrlTemplate } = body;

    if (!platform || !affiliateId || !baseUrlTemplate) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    const accountId = await client.mutation(api.affiliate.createAffiliateAccount, {
      token,
      platform,
      affiliateId,
      apiKey: apiKey || undefined,
      baseUrlTemplate,
    });

    return NextResponse.json({ success: true, data: { id: accountId, platform, affiliateId, baseUrlTemplate } }, { status: 201 });
  } catch (error) {
    console.error('[Affiliate POST] Error:', error);
    return NextResponse.json({ error: 'Gagal membuat akun afiliasi' }, { status: 500 });
  }
}

// PUT update affiliate account (Admin)
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

    const updateData: any = { token, accountId: id as any };
    if (fields.platform !== undefined) updateData.platform = fields.platform;
    if (fields.affiliateId !== undefined) updateData.affiliateId = fields.affiliateId;
    if (fields.apiKey !== undefined) updateData.apiKey = fields.apiKey;
    if (fields.baseUrlTemplate !== undefined) updateData.baseUrlTemplate = fields.baseUrlTemplate;
    if (fields.isActive !== undefined) updateData.isActive = fields.isActive;

    await client.mutation(api.affiliate.updateAffiliateAccount, updateData);

    return NextResponse.json({ success: true, data: { id, ...fields } });
  } catch (error) {
    console.error('[Affiliate PUT] Error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate akun afiliasi' }, { status: 500 });
  }
}

// DELETE soft delete affiliate account (Admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    await client.mutation(api.affiliate.deleteAffiliateAccount, { token, accountId: id as any });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate account:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus akun afiliasi' },
      { status: 500 }
    );
  }
}
