import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List budgets
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

    const budgets = await db.financeBudget.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: budgets });
  } catch (error) {
    console.error('Error fetching finance budgets:', error);
    return NextResponse.json(
      { error: 'Gagal memuat anggaran keuangan' },
      { status: 500 }
    );
  }
}

// POST - Create a budget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, category, limitAmount, period, startDate } = body;

    if (!userId || !category || limitAmount === undefined || !period) {
      return NextResponse.json(
        { error: 'User ID, kategori, batas jumlah, dan periode wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof limitAmount !== 'number' || limitAmount < 0) {
      return NextResponse.json(
        { error: 'Batas jumlah harus berupa angka positif' },
        { status: 400 }
      );
    }

    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return NextResponse.json(
        { error: 'Periode harus "weekly", "monthly", atau "yearly"' },
        { status: 400 }
      );
    }

    const budget = await db.financeBudget.create({
      data: {
        userId,
        category,
        limitAmount,
        spentAmount: 0,
        period,
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    return NextResponse.json({ success: true, data: budget }, { status: 201 });
  } catch (error) {
    console.error('Error creating finance budget:', error);
    return NextResponse.json(
      { error: 'Gagal membuat anggaran keuangan' },
      { status: 500 }
    );
  }
}

// PUT - Update a budget
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
    const existing = await db.financeBudget.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Anggaran tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.limitAmount !== undefined) updateData.limitAmount = fields.limitAmount;
    if (fields.spentAmount !== undefined) updateData.spentAmount = fields.spentAmount;
    if (fields.period !== undefined) updateData.period = fields.period;
    if (fields.startDate !== undefined) updateData.startDate = fields.startDate ? new Date(fields.startDate) : undefined;

    const budget = await db.financeBudget.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    console.error('Error updating finance budget:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate anggaran keuangan' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a budget
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
    const existing = await db.financeBudget.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Anggaran tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    await db.financeBudget.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting finance budget:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus anggaran keuangan' },
      { status: 500 }
    );
  }
}
