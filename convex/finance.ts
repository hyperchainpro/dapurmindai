import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Finance Records ───────────────────────────────────────────

export const getRecordsByUser = query({
  args: {
    userId: v.union(v.id("users"), v.string()),
    type: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("financeRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.startDate && args.endDate) {
      query = query.filter(
        (q) =>
          q.gte(q.field("date"), args.startDate!) &&
          q.lte(q.field("date"), args.endDate!)
      );
    }

    return await query
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(args.limit || 100);
  },
});

export const createRecord = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    type: v.string(),
    category: v.string(),
    amount: v.number(),
    description: v.string(),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const recordId = await ctx.db.insert("financeRecords", {
      userId: args.userId,
      type: args.type,
      category: args.category,
      amount: args.amount,
      description: args.description,
      date: args.date || Date.now(),
      isActive: true,
      deletedAt: undefined,
    });
    return recordId;
  },
});

export const updateRecord = mutation({
  args: {
    recordId: v.id("financeRecords"),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { recordId, ...updates } = args;
    await ctx.db.patch(recordId, updates);
    return recordId;
  },
});

export const deleteRecord = mutation({
  args: { recordId: v.id("financeRecords") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      isActive: false,
      deletedAt: Date.now(),
    });
  },
});

// ─── Finance Budgets ───────────────────────────────────────────

export const getBudgetsByUser = query({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financeBudgets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createBudget = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    category: v.string(),
    limitAmount: v.number(),
    period: v.string(),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const budgetId = await ctx.db.insert("financeBudgets", {
      userId: args.userId,
      category: args.category,
      limitAmount: args.limitAmount,
      spentAmount: 0,
      period: args.period,
      startDate: args.startDate || Date.now(),
      isActive: true,
      deletedAt: undefined,
    });
    return budgetId;
  },
});

export const updateBudgetSpent = mutation({
  args: {
    budgetId: v.id("financeBudgets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget) throw new Error("Budget not found");

    await ctx.db.patch(args.budgetId, {
      spentAmount: budget.spentAmount + args.amount,
    });
  },
});

// ─── Finance Goals ─────────────────────────────────────────────

export const getGoalsByUser = query({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financeGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createGoal = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    title: v.string(),
    targetAmount: v.number(),
    deadline: v.number(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const goalId = await ctx.db.insert("financeGoals", {
      userId: args.userId,
      title: args.title,
      targetAmount: args.targetAmount,
      savedAmount: 0,
      deadline: args.deadline,
      icon: args.icon,
      isActive: true,
      deletedAt: undefined,
    });
    return goalId;
  },
});

export const updateGoalSaved = mutation({
  args: {
    goalId: v.id("financeGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    await ctx.db.patch(args.goalId, {
      savedAmount: goal.savedAmount + args.amount,
    });
  },
});

// ─── Recurring Transactions ─────────────────────────────────────

export const getRecurringTransactions = query({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recurringTransactions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect();
  },
});

export const createRecurringTransaction = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    type: v.string(),
    category: v.string(),
    amount: v.number(),
    description: v.string(),
    frequency: v.string(),
    nextDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recurringTransactions", {
      ...args,
      endDate: args.endDate || undefined,
      isActive: true,
    } as any);
  },
});

export const updateRecurringTransaction = mutation({
  args: {
    id: v.id("recurringTransactions"),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    frequency: v.optional(v.string()),
    nextDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteRecurringTransaction = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});
