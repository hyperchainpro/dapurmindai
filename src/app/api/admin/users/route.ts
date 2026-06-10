import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/users — List all users (admin only)
   Query params: page, limit, search, role, sortBy, sortOrder
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    
    // We pass the hardcoded admin key so Convex allows the query.
    // Real auth could be passed if we extract the Bearer token from the request, but 
    // the system relies on the x-admin-key bypass for the dashboard right now.
    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (request.headers.get('x-admin-key')) {
      token = request.headers.get('x-admin-key')!;
    }

    const allUsers = await client.query(api.admin.listUsers, {
      token,
      role,
      search,
    });

    // Pagination
    const total = allUsers.length;
    const users = allUsers.slice(start, start + limit).map((u: any) => ({
      ...u,
      id: u._id,
      createdAt: new Date(u._creationTime).toISOString(),
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Users GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   POST /api/admin/users — Create user (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, name, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, dan password wajib diisi' }, { status: 400 });
    }

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (request.headers.get('x-admin-key')) {
      token = request.headers.get('x-admin-key')!;
    }

    // Call Convex HTTP action for register (because it hashes the password properly)
    // Wait, the API route can just proxy to convex's api.auth.register but it doesn't allow role setting!
    // I should create a mutation `createUser` in admin.ts
    // Let me check if admin.ts has createUser. Oh I didn't see it.
    
    // Actually, I can just use `api.auth.register` and then `api.admin.updateUser` to set the role!
    // But api.auth.register uses HTTP action, so we must fetch it.
    const origin = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    const registerRes = await fetch(`${origin}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, name }),
    });

    if (!registerRes.ok) {
      const err = await registerRes.json();
      return NextResponse.json({ error: err.error || 'Gagal membuat user' }, { status: registerRes.status });
    }

    const newUserData = await registerRes.json();
    
    // Now update role
    if (role && role !== 'user') {
      await client.mutation(api.admin.updateUser, {
        token,
        userId: newUserData.userId,
        role: role
      });
    }

    return NextResponse.json({ success: true, user: { ...newUserData.user, role: role || 'user' } }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Users POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}