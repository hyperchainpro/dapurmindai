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

// POST /api/financial/goals — Create a new finance goal
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.userId;
    const body = await req.json();
    const { title, targetAmount, deadline, icon } = body;

    if (!title || !targetAmount) {
      return NextResponse.json({ error: 'title and targetAmount are required' }, { status: 400 });
    }

    const db = getPrisma();
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const goal = await db.financeGoal.create({
      data: {
        userId,
        title,
        targetAmount: Number(targetAmount),
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || '🎯',
      },
    });

    return NextResponse.json({
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      deadline: goal.deadline?.toISOString() || null,
      icon: goal.icon,
      createdAt: goal.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Failed to create goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/financial/goals — List finance goals
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.userId;

    const db = getPrisma();
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const goals = await db.financeGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      goals.map((g) => ({
        id: g.id,
        userId: g.userId,
        title: g.title,
        targetAmount: g.targetAmount,
        savedAmount: g.savedAmount,
        deadline: g.deadline?.toISOString() || null,
        icon: g.icon,
        createdAt: g.createdAt.toISOString(),
      }))
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch goals';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/financial/goals — Update a goal (add savings)
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.userId;
    const body = await req.json();
    const { id, savedAmount } = body;

    if (!id || savedAmount === undefined) {
      return NextResponse.json({ error: 'id and savedAmount are required' }, { status: 400 });
    }

    const db = getPrisma();
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    // Check ownership
    const existing = await db.financeGoal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Goal not found or not owned by you' }, { status: 404 });
    }

    const goal = await db.financeGoal.update({
      where: { id },
      data: { savedAmount: Number(savedAmount) },
    });

    return NextResponse.json({
      id: goal.id,
      savedAmount: goal.savedAmount,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Failed to update goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
