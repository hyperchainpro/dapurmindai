import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword, deleteAllUserSessions, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/users/[id] — Get single user detail
   ═══════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        creatorProfile: true,
        _count: {
          select: {
            creatorRecipes: { where: { isActive: true } },
            financeRecords: { where: { isActive: true } },
            financeBudgets: { where: { isActive: true } },
            financeGoals: { where: { isActive: true } },
            sessions: true,
            activityLogs: true,
            clickLogs: true,
            aiAgentUsageLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    await logActivity(auth.userId, 'admin.view_user', 'User', `Viewed user: ${user.username}`, request);

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[Admin Users GET id] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/admin/users/[id] — Update user (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, isActive, password } = body;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Prevent modifying superadmin unless caller is superadmin
    if (existing.role === 'superadmin' && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Tidak dapat mengubah superadmin' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check email uniqueness
      if (email !== existing.email) {
        const emailExists = await db.user.findFirst({
          where: { email: email.trim().toLowerCase(), id: { not: id }, deletedAt: null },
        });
        if (emailExists) {
          return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 });
        }
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (role !== undefined) {
      const validRoles = ['user', 'admin', 'superadmin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
      }
      // Only superadmin can assign superadmin role
      if (role === 'superadmin' && auth.role !== 'superadmin') {
        return NextResponse.json({ error: 'Hanya superadmin yang dapat menetapkan role superadmin' }, { status: 403 });
      }
      updateData.role = role;
    }

    if (isActive !== undefined) updateData.isActive = isActive;

    if (password) {
      updateData.password = await hashPassword(password);
      // Force re-login after password change
      await deleteAllUserSessions(id);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    await logActivity(auth.userId, 'admin.update_user', 'User', `Updated user: ${user.username}`, request);

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[Admin Users PUT id] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   DELETE /api/admin/users/[id] — Soft delete user (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;

    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Prevent deleting superadmin
    if (existing.role === 'superadmin') {
      return NextResponse.json({ error: 'Tidak dapat menghapus superadmin' }, { status: 403 });
    }

    // Soft delete
    await db.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${existing.email}`, // Free up email
        username: `deleted_${Date.now()}_${existing.username}`, // Free up username
      },
    });

    // Delete all sessions
    await deleteAllUserSessions(id);

    await logActivity(auth.userId, 'admin.delete_user', 'User', `Soft-deleted user: ${existing.username}`, request);

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('[Admin Users DELETE id] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}