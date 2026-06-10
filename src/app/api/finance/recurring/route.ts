import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    const items = await client.query(api.finance.getRecurringTransactions, { userId });

    const mapped = items.map((item: any) => ({
      ...item,
      id: item._id,
      date: new Date(item.nextDate).toISOString().split('T')[0],
      nextDate: new Date(item.nextDate).toISOString().split('T')[0],
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : null,
      createdAt: new Date(item._creationTime).toISOString(),
    }));

    const freqMap: Record<string, string> = {
      daily: 'Mingguan', // Keeping old logic mapping
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      yearly: 'Tahunan',
    };

    const remapped = mapped.map((item: any) => ({
      ...item,
      frequency: freqMap[item.frequency] || item.frequency,
    }));

    return NextResponse.json({ success: true, data: remapped });
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    return NextResponse.json({ error: 'Gagal memuat transaksi berulang' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, category, amount, description, frequency, nextDate, endDate } = body;

    if (!userId || !type || !category || amount === undefined || !frequency || !nextDate) {
      return NextResponse.json({ error: 'Data tidak lengkap. User ID, tipe, kategori, jumlah, frekuensi, dan tanggal wajib diisi.' }, { status: 400 });
    }

    const freqToDb: Record<string, string> = {
      Mingguan: 'weekly',
      Bulanan: 'monthly',
      Tahunan: 'yearly',
    };
    const dbFreq = freqToDb[frequency] || frequency;

    const itemId = await client.mutation(api.finance.createRecurringTransaction, {
      userId,
      type,
      category,
      amount,
      description: description || '',
      frequency: dbFreq,
      nextDate: new Date(nextDate).getTime(),
      endDate: endDate ? new Date(endDate).getTime() : undefined,
    });

    return NextResponse.json({ success: true, data: { id: itemId, userId, type, category, amount, description, frequency: dbFreq, nextDate: new Date(nextDate).getTime(), endDate: endDate ? new Date(endDate).getTime() : undefined } }, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json({ error: 'Gagal membuat transaksi berulang' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, type, category, amount, description, frequency, nextDate, endDate, isActive } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID dan User ID wajib diisi' }, { status: 400 });
    }

    const updateData: any = { id: id as any };

    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) {
      const freqToDb: Record<string, string> = { Mingguan: 'weekly', Bulanan: 'monthly', Tahunan: 'yearly' };
      updateData.frequency = freqToDb[frequency] || frequency;
    }
    if (nextDate !== undefined) updateData.nextDate = new Date(nextDate).getTime();
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate).getTime() : undefined;
    if (isActive !== undefined) updateData.isActive = isActive;

    await client.mutation(api.finance.updateRecurringTransaction, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    return NextResponse.json({ error: 'Gagal mengupdate transaksi berulang' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID dan User ID wajib diisi' }, { status: 400 });
    }

    await client.mutation(api.finance.deleteRecurringTransaction, { id: id as any });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi berulang' }, { status: 500 });
  }
}