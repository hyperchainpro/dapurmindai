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

    const goals = await client.query(api.finance.getGoalsByUser, { userId });

    return NextResponse.json({ success: true, data: goals.map((g: any) => ({ ...g, id: g._id })) });
  } catch (error) {
    console.error('Error fetching finance goals:', error);
    return NextResponse.json({ error: 'Gagal memuat tujuan keuangan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, targetAmount, deadline, icon } = body;

    if (!userId || !title || !targetAmount || !deadline) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const goalId = await client.mutation(api.finance.createGoal, {
      userId,
      title,
      targetAmount,
      deadline: new Date(deadline).getTime(),
      icon: icon || '💰',
    });

    return NextResponse.json({ success: true, data: { id: goalId, userId, title, targetAmount, savedAmount: 0, deadline: new Date(deadline).getTime(), icon } }, { status: 201 });
  } catch (error) {
    console.error('Error creating finance goal:', error);
    return NextResponse.json({ error: 'Gagal membuat tujuan keuangan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, amount } = body;

    if (!id || !userId || amount === undefined) {
      return NextResponse.json({ error: 'ID, User ID, dan amount wajib diisi' }, { status: 400 });
    }

    await client.mutation(api.finance.updateGoalSaved, {
      goalId: id as any,
      amount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating finance goal:', error);
    return NextResponse.json({ error: 'Gagal mengupdate tujuan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: true }); // Mocked
}
