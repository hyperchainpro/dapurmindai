import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List finance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      userId,
      isActive: true,
    };

    if (type) where.type = type;
    if (category) where.category = category;

    // Month filter: format "YYYY-MM"
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const records = await db.financeRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching finance records:', error);
    return NextResponse.json(
      { error: 'Gagal memuat catatan keuangan' },
      { status: 500 }
    );
  }
}

// POST - Create a finance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, category, amount, description, date } = body;

    if (!userId || !type || !category || amount === undefined) {
      return NextResponse.json(
        { error: 'User ID, tipe, kategori, dan jumlah wajib diisi' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Tipe harus "income" atau "expense"' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Jumlah harus berupa angka positif' },
        { status: 400 }
      );
    }

    const record = await db.financeRecord.create({
      data: {
        userId,
        type,
        category,
        amount,
        description: description || '',
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating finance record:', error);
    return NextResponse.json(
      { error: 'Gagal membuat catatan keuangan' },
      { status: 500 }
    );
  }
}

// PUT - Update a finance record
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
    const existing = await db.financeRecord.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Catatan tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (fields.type !== undefined) updateData.type = fields.type;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.amount !== undefined) updateData.amount = fields.amount;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.date !== undefined) updateData.date = fields.date ? new Date(fields.date) : undefined;

    const record = await db.financeRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating finance record:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate catatan keuangan' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a finance record
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
    const existing = await db.financeRecord.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Catatan tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    await db.financeRecord.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting finance record:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus catatan keuangan' },
      { status: 500 }
    );
  }
}
