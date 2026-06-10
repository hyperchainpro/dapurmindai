import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';

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
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    let startDate: number | undefined;
    let endDate: number | undefined;

    // Month filter: format "YYYY-MM"
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1).getTime();
      endDate = new Date(year, monthNum, 0, 23, 59, 59, 999).getTime();
    }

    const records = await client.query(api.finance.getRecordsByUser, {
      userId,
      type: type || undefined,
      startDate,
      endDate,
      limit,
    });

    // Optionally filter by category since we didn't filter it in convex yet
    let filteredRecords = records;
    if (category) {
      filteredRecords = records.filter(r => r.category === category);
    }

    const formattedRecords = filteredRecords.map((r: any) => ({
      ...r,
      id: r._id,
      date: new Date(r.date).toISOString(),
    }));

    return NextResponse.json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('Error fetching finance records:', error);
    return NextResponse.json({ error: 'Gagal memuat catatan keuangan' }, { status: 500 });
  }
}

// POST - Create a finance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, category, amount, description, date } = body;

    if (!userId || !type || !category || amount === undefined) {
      return NextResponse.json({ error: 'User ID, tipe, kategori, dan jumlah wajib diisi' }, { status: 400 });
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({ error: 'Tipe harus "income" atau "expense"' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Jumlah harus berupa angka positif' }, { status: 400 });
    }

    const recordId = await client.mutation(api.finance.createRecord, {
      userId,
      type,
      category,
      amount,
      description: description || '',
      date: date ? new Date(date).getTime() : Date.now(),
    });

    return NextResponse.json({ success: true, data: { id: recordId, userId, type, category, amount, description, date } }, { status: 201 });
  } catch (error) {
    console.error('Error creating finance record:', error);
    return NextResponse.json({ error: 'Gagal membuat catatan keuangan' }, { status: 500 });
  }
}

// PUT - Update a finance record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID dan User ID wajib diisi' }, { status: 400 });
    }

    const updateData: any = { recordId: id as any };
    if (fields.type !== undefined) updateData.type = fields.type;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.amount !== undefined) updateData.amount = fields.amount;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.date !== undefined) updateData.date = fields.date ? new Date(fields.date).getTime() : undefined;

    await client.mutation(api.finance.updateRecord, updateData);

    return NextResponse.json({ success: true, data: { id, userId, ...fields } });
  } catch (error) {
    console.error('Error updating finance record:', error);
    return NextResponse.json({ error: 'Gagal mengupdate catatan keuangan' }, { status: 500 });
  }
}

// DELETE - Soft delete a finance record
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID dan User ID wajib diisi' }, { status: 400 });
    }

    await client.mutation(api.finance.deleteRecord, { recordId: id as any });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting finance record:', error);
    return NextResponse.json({ error: 'Gagal menghapus catatan keuangan' }, { status: 500 });
  }
}
