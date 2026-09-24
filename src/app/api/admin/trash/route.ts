import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-server';

/* == GET /api/admin/trash =============================== */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';

    const items: { id: string; type: string; label: string; deletedAt: string; [key: string]: unknown }[] = [];

    if (!type || type === 'users') {
      const deletedUsers = await db.user.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, email: true, name: true, deletedAt: true, createdAt: true },
        orderBy: { deletedAt: 'desc' },
      });
      for (const u of deletedUsers) {
        items.push({
          id: u.id,
          type: 'users',
          label: u.name || u.email,
          email: u.email,
          deletedAt: u.deletedAt!.toISOString(),
          createdAt: u.createdAt.toISOString(),
        });
      }
    }

    if (!type || type === 'recipes') {
      const deletedRecipes = await db.creatorRecipe.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, deletedAt: true, createdAt: true },
        orderBy: { deletedAt: 'desc' },
      });
      for (const r of deletedRecipes) {
        items.push({
          id: r.id,
          type: 'recipes',
          label: r.name,
          deletedAt: r.deletedAt!.toISOString(),
          createdAt: r.createdAt.toISOString(),
        });
      }
    }

    if (!type || type === 'affiliate_accounts') {
      const deletedAffiliates = await db.affiliateAccount.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, platform: true, affiliateId: true, deletedAt: true, createdAt: true },
        orderBy: { deletedAt: 'desc' },
      });
      for (const a of deletedAffiliates) {
        items.push({
          id: a.id,
          type: 'affiliate_accounts',
          label: `${a.platform} — ${a.affiliateId}`,
          platform: a.platform,
          deletedAt: a.deletedAt!.toISOString(),
          createdAt: new Date(a.createdAt * 1000).toISOString(),
        });
      }
    }

    if (!type || type === 'product_links') {
      const deletedLinks = await db.productLink.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, productName: true, platform: true, deletedAt: true, createdAt: true },
        orderBy: { deletedAt: 'desc' },
      });
      for (const p of deletedLinks) {
        items.push({
          id: p.id,
          type: 'product_links',
          label: `${p.productName} (${p.platform})`,
          platform: p.platform,
          deletedAt: p.deletedAt!.toISOString(),
          createdAt: new Date(p.createdAt * 1000).toISOString(),
        });
      }
    }

    // Sort by deletedAt descending
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching trash:', error);
    return NextResponse.json({ error: 'Gagal memuat trash' }, { status: 500 });
  }
}

/* == DELETE /api/admin/trash — Permanent delete ========= */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    switch (type) {
      case 'users':
        await db.user.delete({ where: { id } });
        break;
      case 'recipes':
        await db.creatorRecipe.delete({ where: { id } });
        break;
      case 'affiliate_accounts':
        // Delete related product links and click logs first
        await db.clickLog.deleteMany({ where: { productLink: { accountId: id } } });
        await db.productLink.deleteMany({ where: { accountId: id } });
        await db.affiliateAccount.delete({ where: { id } });
        break;
      case 'product_links':
        await db.clickLog.deleteMany({ where: { productLinkId: id } });
        await db.productLink.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error permanently deleting:', error);
    return NextResponse.json({ error: 'Gagal menghapus permanen' }, { status: 500 });
  }
}
