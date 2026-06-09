import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get creator profile or list all profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const list = searchParams.get('list');

    // List all creator profiles with published recipe counts
    if (list === 'all') {
      const profiles = await db.creatorProfile.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              creatorRecipes: {
                where: { isActive: true, isPublished: true },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const mapped = profiles.map((p) => ({
        ...p,
        publishedRecipeCount: p.user.creatorRecipes.length,
        user: undefined,
      }));

      return NextResponse.json({ success: true, data: { profiles: mapped } });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const profile = await db.creatorProfile.findFirst({
      where: { userId, isActive: true },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: 'Gagal memuat profil creator' },
      { status: 500 }
    );
  }
}

// POST - Create or update creator profile (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, displayName, bio, avatar } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const profile = await db.creatorProfile.upsert({
      where: { userId },
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      create: {
        userId,
        displayName: displayName || '',
        bio: bio || '',
        avatar: avatar || '',
      },
    });

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating creator profile:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan profil creator' },
      { status: 500 }
    );
  }
}

// PUT - Update creator profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, displayName, bio, avatar } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const existing = await db.creatorProfile.findFirst({
      where: { userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Profil creator tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const profile = await db.creatorProfile.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error updating creator profile:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate profil creator' },
      { status: 500 }
    );
  }
}
