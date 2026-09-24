import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-server';

let prisma: InstanceType<typeof import('@prisma/client').PrismaClient> | null = null;
function getPrisma() {
  if (!prisma) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
    } catch {
      return null;
    }
  }
  return prisma;
}

// POST /api/financial/records — Create a new finance record
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.userId;
    const body = await req.json();
    const { type, category, amount, description, date } = body;

    if (!type || !category || !amount) {
      return NextResponse.json({ error: 'type, category, and amount are required' }, { status: 400 });
    }

    const db = getPrisma();
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const record = await db.financeRecord.create({
      data: {
        userId,
        type,
        category,
        amount: Number(amount),
        description: description || '',
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({
      id: record.id,
      userId: record.userId,
      type: record.type,
      category: record.category,
      amount: record.amount,
      description: record.description,
      date: record.date.toISOString(),
      createdAt: record.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Failed to create record';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/financial/records — List finance records
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.userId;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;

    const db = getPrisma();
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const records = await db.financeRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(
      records.map((r) => ({
        id: r.id,
        userId: r.userId,
        type: r.type,
        category: r.category,
        amount: r.amount,
        description: r.description,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch records';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
