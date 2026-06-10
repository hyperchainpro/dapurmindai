import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to format profile
function formatProfile(p: any) {
  if (!p) return null;
  return {
    ...p,
    id: p._id,
    createdAt: new Date(p._creationTime).toISOString(),
  };
}

// GET - Get creator profile or list all profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const list = searchParams.get('list');

    // List all creator profiles with published recipe counts
    if (list === 'all') {
      const profiles = await client.query(api.creator.listProfiles);
      const formatted = profiles.map(p => formatProfile(p));
      return NextResponse.json({ success: true, data: { profiles: formatted } });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const profile = await client.query(api.creator.getProfileByUserId, {
      userId: userId as Id<"users">,
    });

    return NextResponse.json({ success: true, data: formatProfile(profile) });
  } catch (error: any) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat profil creator' },
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

    const profile = await client.mutation(api.creator.upsertProfile, {
      userId: userId as Id<"users">,
      displayName,
      bio,
      avatar,
    });

    return NextResponse.json({ success: true, data: formatProfile(profile) }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/updating creator profile:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan profil creator' },
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

    const profile = await client.mutation(api.creator.updateProfile, {
      userId: userId as Id<"users">,
      displayName,
      bio,
      avatar,
    });

    return NextResponse.json({ success: true, data: formatProfile(profile) });
  } catch (error: any) {
    console.error('Error updating creator profile:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate profil creator' },
      { status: 500 }
    );
  }
}