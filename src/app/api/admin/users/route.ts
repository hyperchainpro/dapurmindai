import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, hashPassword, deleteAllUserSessions, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/users — List all users (admin only)
   Query params: page, limit, search, role, sortBy, sortOrder
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    // Validate sort field
    const validSortFields = ['createdAt', 'username', 'email', 'lastLoginAt', 'role'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatar: true,
          language: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              creatorRecipes: { where: { isActive: true } },
              financeRecords: { where: { isActive: true } },
              sessions: true,
              activityLogs: true,
            },
          },
        },
        orderBy: { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    await logActivity(auth.userId, 'admin.list_users', 'User', `Listed users (page ${page}, total ${total})`, request);

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
  } catch (error) {
    console.error('[Admin Users GET] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   POST /api/admin/users — Create user (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { username, email, name, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, dan password wajib diisi' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: username.trim().toLowerCase() },
          { email: email.trim().toLowerCase() },
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Username atau email sudah digunakan' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const validRoles = ['user', 'admin', 'superadmin'];
    const userRole = validRoles.includes(role) ? role : 'user';

    const user = await db.user.create({
      data: {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        name: name?.trim() || username.trim(),
        password: hashedPassword,
        role: userRole,
      },
    });

    await logActivity(auth.userId, 'admin.create_user', 'User', `Created user: ${user.username} (role: ${userRole})`, request);

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('[Admin Users POST] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}