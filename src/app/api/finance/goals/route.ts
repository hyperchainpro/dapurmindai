import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth-server';

// GET - List goals
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const userId = auth.userId;

    const goals = await db.financeGoal.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: goals });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching finance goals:', error);
    return NextResponse.json(
      { error: 'Gagal memuat tujuan keuangan' },
      { status: 500 }
    );
  }
}

// POST - Create a goal
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const userId = auth.userId;
    const body = await request.json();
    const { title, targetAmount, savedAmount, deadline, icon } = body;

    if (!title || targetAmount === undefined) {
      return NextResponse.json(
        { error: 'Judul dan jumlah target wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof targetAmount !== 'number' || targetAmount < 0) {
      return NextResponse.json(
        { error: 'Jumlah target harus berupa angka positif' },
        { status: 400 }
      );
    }

    const goal = await db.financeGoal.create({
      data: {
        userId,
        title,
        targetAmount,
        savedAmount: typeof savedAmount === 'number' ? savedAmount : 0,
        deadline: deadline ? new Date(deadline) : new Date(),
        icon: icon || '',
      },
    });

    return NextResponse.json({ success: true, data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating finance goal:', error);
    return NextResponse.json(
      { error: 'Gagal membuat tujuan keuangan' },
      { status: 500 }
    );
  }
}

// PUT - Update a goal
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const userId = auth.userId;
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await db.financeGoal.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tujuan tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.targetAmount !== undefined) updateData.targetAmount = fields.targetAmount;
    if (fields.savedAmount !== undefined) updateData.savedAmount = fields.savedAmount;
    if (fields.deadline !== undefined) updateData.deadline = fields.deadline ? new Date(fields.deadline) : undefined;
    if (fields.icon !== undefined) updateData.icon = fields.icon;

    const goal = await db.financeGoal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating finance goal:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate tujuan keuangan' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const userId = auth.userId;
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await db.financeGoal.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tujuan tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    await db.financeGoal.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error deleting finance goal:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus tujuan keuangan' },
      { status: 500 }
    );
  }
}
