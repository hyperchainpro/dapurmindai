import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30d';

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default: // 30d
        startDate.setDate(now.getDate() - 30);
    }

    const records = await client.query(api.finance.getRecordsByUser, {
      userId,
      startDate: startDate.getTime(),
      endDate: now.getTime(),
      limit: 10000,
    });

    // Summary
    const totalIncome = records.filter((r: any) => r.type === 'income').reduce((s: number, r: any) => s + r.amount, 0);
    const totalExpense = records.filter((r: any) => r.type === 'expense').reduce((s: number, r: any) => s + r.amount, 0);

    // Category breakdown (expenses only)
    const catMap = new Map<string, { amount: number; count: number }>();
    for (const r of records) {
      if (r.type !== 'expense') continue;
      const existing = catMap.get(r.category) ?? { amount: 0, count: 0 };
      existing.amount += r.amount;
      existing.count += 1;
      catMap.set(r.category, existing);
    }
    const categoryBreakdown = Array.from(catMap.entries())
      .map(([category, { amount, count }]) => ({
        category,
        amount: Math.round(amount),
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly comparison (last 6 months)
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyRecords = await client.query(api.finance.getRecordsByUser, {
      userId,
      startDate: sixMonthsAgo.getTime(),
      endDate: now.getTime(),
      limit: 10000,
    });

    for (const r of monthlyRecords) {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      if (r.type === 'income') monthlyData[key].income += r.amount;
      else monthlyData[key].expense += r.amount;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyComparison = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        return {
          month: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
          income: Math.round(data.income),
          expense: Math.round(data.expense),
        };
      });

    // Daily trend (last 14 days, expenses only)
    const dailyTrend: { date: string; amount: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const dayExpenses = records
        .filter((r: any) => r.type === 'expense' && new Date(r.date).toISOString().split('T')[0] === dayStr)
        .reduce((s: number, r: any) => s + r.amount, 0);
      dailyTrend.push({ date: dayStr, amount: Math.round(dayExpenses), label: dayLabel });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        balance: Math.round(totalIncome - totalExpense),
        totalTransactions: records.length,
        categoryBreakdown,
        monthlyComparison,
        dailyTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching finance report:', error);
    return NextResponse.json({ error: 'Gagal memuat laporan' }, { status: 500 });
  }
}