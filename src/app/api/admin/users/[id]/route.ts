import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to extract token
function getToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey) return adminKey;
  
  return "dapurmind-admin-key-2025"; // fallback for admin scripts
}

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/users/[id]
   ═══════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);

    // Instead of a specific getUser in admin, we can just use listUsers and find the one.
    // Or we can add getUser to convex/admin.ts. 
    // Wait! Since listUsers returns all, let's just do it. (This is backend, it's fast)
    const allUsers = await client.query(api.admin.listUsers, { token });
    const user = allUsers.find(u => u._id === id);

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Map to Prisma format for frontend compatibility
    const formattedUser = {
      ...user,
      id: user._id,
      createdAt: new Date(user._creationTime).toISOString(),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    };

    return NextResponse.json({ success: true, user: formattedUser });
  } catch (error: any) {
    console.error('[Admin Users GET id] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/admin/users/[id] — Update user
   ═══════════════════════════════════════════════════════════ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const token = getToken(request);

    // Call convex mutation
    await client.mutation(api.admin.updateUser, {
      token,
      userId: id as Id<"users">,
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive,
      language: body.language,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Users PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   DELETE /api/admin/users/[id] — Soft delete user
   ═══════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);

    await client.mutation(api.admin.deleteUser, {
      token,
      userId: id as Id<"users">,
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error('[Admin Users DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}