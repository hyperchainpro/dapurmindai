import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List recurring transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    const items = await db.recurringTransaction.findMany({
      where: { userId, isActive: true },
      orderBy: { nextDate: 'asc' },
    });

    // Map frequency from English to Indonesian for the frontend
    const mapped = items.map((item) => ({
      ...item,
      date: item.nextDate.toISOString().split('T')[0],
      nextDate: item.nextDate.toISOString().split('T')[0],
      endDate: item.endDate ? item.endDate.toISOString().split('T')[0] : null,
      createdAt: item.createdAt.toISOString(),
    }));

    // Remap frequency to Indonesian labels for display
    const freqMap: Record<string, string> = {
      daily: 'Mingguan',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      yearly: 'Tahunan',
    };

    const remapped = mapped.map((item) => ({
      ...item,
      frequency: freqMap[item.frequency] || item.frequency,
    }));

    return NextResponse.json({ success: true, data: remapped });
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    return NextResponse.json({ error: 'Gagal memuat transaksi berulang' }, { status: 500 });
  }
}

// POST - Create a recurring transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, category, amount, description, frequency, nextDate, endDate } = body;

    if (!userId || !type || !category || amount === undefined || !frequency || !nextDate) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. User ID, tipe, kategori, jumlah, frekuensi, dan tanggal wajib diisi.' },
        { status: 400 },
      );
    }

    // Map Indonesian frequency back to English for DB storage
    const freqToDb: Record<string, string> = {
      Mingguan: 'weekly',
      Bulanan: 'monthly',
      Tahunan: 'yearly',
    };
    const dbFreq = freqToDb[frequency] || frequency;

    const item = await db.recurringTransaction.create({
      data: {
        userId,
        type,
        category,
        amount,
        description: description || '',
        frequency: dbFreq,
        nextDate: new Date(nextDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json({ error: 'Gagal membuat transaksi berulang' }, { status: 500 });
  }
}

// PUT - Update a recurring transaction
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, type, category, amount, description, frequency, nextDate, endDate, isActive } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID dan User ID wajib diisi' }, { status: 400 });
    }

    const existing = await db.recurringTransaction.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) {
      const freqToDb: Record<string, string> = { Mingguan: 'weekly', Bulanan: 'monthly', Tahunan: 'yearly' };
      updateData.frequency = freqToDb[frequency] || frequency;
    }
    if (nextDate !== undefined) updateData.nextDate = new Date(nextDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const item = await db.recurringTransaction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    return NextResponse.json({ error: 'Gagal mengupdate transaksi berulang' }, { status: 500 });
  }
}

// DELETE - Soft delete a recurring transaction
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID dan User ID wajib diisi' }, { status: 400 });
    }

    const existing = await db.recurringTransaction.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    await db.recurringTransaction.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi berulang' }, { status: 500 });
  }
}