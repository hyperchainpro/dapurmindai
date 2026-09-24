import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth-server';
import type { AffiliateAccount } from '@/types';

// GET - Fetch all affiliate accounts
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const accounts = await db.affiliateAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const mapped: AffiliateAccount[] = accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      affiliateId: a.affiliateId,
      apiKey: a.apiKey ?? undefined,
      baseUrlTemplate: a.baseUrlTemplate,
      isActive: a.isActive,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ accounts: mapped });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching affiliate accounts:', error);
    return NextResponse.json(
      { error: 'Gagal memuat akun afiliasi' },
      { status: 500 }
    );
  }
}

// POST - Create a new affiliate account
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const { platform, affiliateId, apiKey, baseUrlTemplate } = body;

    if (!platform || !affiliateId || !baseUrlTemplate) {
      return NextResponse.json(
        { error: 'Platform, affiliate ID, dan URL template wajib diisi' },
        { status: 400 }
      );
    }

    const account = await db.affiliateAccount.create({
      data: {
        platform,
        affiliateId,
        apiKey: apiKey || null,
        baseUrlTemplate,
        isActive: true,
        createdAt: Math.floor(Date.now() / 1000),
      },
    });

    const mapped: AffiliateAccount = {
      id: account.id,
      platform: account.platform,
      affiliateId: account.affiliateId,
      apiKey: account.apiKey ?? undefined,
      baseUrlTemplate: account.baseUrlTemplate,
      isActive: account.isActive,
      createdAt: account.createdAt,
    };

    return NextResponse.json({ account: mapped }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating affiliate account:', error);
    return NextResponse.json(
      { error: 'Gagal membuat akun afiliasi' },
      { status: 500 }
    );
  }
}

// PUT - Update an affiliate account
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const { id, platform, affiliateId, apiKey, baseUrlTemplate, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID akun wajib diisi' },
        { status: 400 }
      );
    }

    const account = await db.affiliateAccount.update({
      where: { id },
      data: {
        ...(platform && { platform }),
        ...(affiliateId && { affiliateId }),
        ...(apiKey !== undefined && { apiKey }),
        ...(baseUrlTemplate && { baseUrlTemplate }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    const mapped: AffiliateAccount = {
      id: account.id,
      platform: account.platform,
      affiliateId: account.affiliateId,
      apiKey: account.apiKey ?? undefined,
      baseUrlTemplate: account.baseUrlTemplate,
      isActive: account.isActive,
      createdAt: account.createdAt,
    };

    return NextResponse.json({ account: mapped });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating affiliate account:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate akun afiliasi' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an affiliate account
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID akun wajib diisi' },
        { status: 400 }
      );
    }

    // Delete related product links and click logs first
    await db.clickLog.deleteMany({
      where: {
        productLink: { accountId: id },
      },
    });

    await db.productLink.deleteMany({
      where: { accountId: id },
    });

    await db.affiliateAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error deleting affiliate account:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus akun afiliasi' },
      { status: 500 }
    );
  }
}
