import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const goals = await db.financeGoal.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: goals });
  } catch (error) {
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
    const body = await request.json();
    const { userId, title, targetAmount, savedAmount, deadline, icon } = body;

    if (!userId || !title || targetAmount === undefined) {
      return NextResponse.json(
        { error: 'User ID, judul, dan jumlah target wajib diisi' },
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
    const body = await request.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID dan User ID wajib diisi' },
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
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID dan User ID wajib diisi' },
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
    console.error('Error deleting finance goal:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus tujuan keuangan' },
      { status: 500 }
    );
  }
}
