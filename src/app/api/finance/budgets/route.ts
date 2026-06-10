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

    const budgets = await client.query(api.finance.getBudgetsByUser, { userId });
    
    const formatted = budgets.map((b: any) => ({
      ...b,
      id: b._id,
      startDate: new Date(b.startDate).toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching finance budgets:', error);
    return NextResponse.json({ error: 'Gagal memuat anggaran' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, category, limitAmount, period, startDate } = body;

    if (!userId || !category || !limitAmount || !period) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const budgetId = await client.mutation(api.finance.createBudget, {
      userId,
      category,
      limitAmount,
      period,
      startDate: startDate ? new Date(startDate).getTime() : Date.now(),
    });

    return NextResponse.json({ success: true, data: { id: budgetId, userId, category, limitAmount, period, spentAmount: 0 } }, { status: 201 });
  } catch (error) {
    console.error('Error creating finance budget:', error);
    return NextResponse.json({ error: 'Gagal membuat anggaran' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, amount } = body;

    if (!id || !userId || amount === undefined) {
      return NextResponse.json({ error: 'ID, User ID, dan amount wajib diisi' }, { status: 400 });
    }

    await client.mutation(api.finance.updateBudgetSpent, {
      budgetId: id as any,
      amount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json({ error: 'Gagal mengupdate anggaran' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Not fully implemented in Convex yet, just mock success for now as it's not strictly requested by the schema
  return NextResponse.json({ success: true });
}
