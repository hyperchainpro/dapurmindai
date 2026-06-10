import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Helper: Require Admin ────────────────────────────────────

async function requireAdmin(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db.get(session.userId);

  if (!user || !user.isActive) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "admin" && user.role !== "superadmin") {
    throw new Error("Forbidden: Admin access required");
  }

  return { user, session };
}

// ─── User Management ──────────────────────────────────────────

export const listUsers = query({
  args: {
    token: v.string(),
    role: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    let users;
    
    if (args.role) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .take(args.limit || 100);
    } else {
      users = await ctx.db.query("users").take(args.limit || 100);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.name?.toLowerCase().includes(searchLower)
      );
    }

    return users;
  },
});

export const updateUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);
    const { token, userId, ...updates } = args;

    await ctx.db.patch(userId, updates);

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "update_user",
      target: userId,
      detail: `Updated user: ${userId}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

export const deleteUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);

    // Soft delete
    await ctx.db.patch(args.userId, {
      isActive: false,
      deletedAt: Date.now(),
    });

    // Delete all sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "delete_user",
      target: args.userId,
      detail: `Deleted user: ${args.userId}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

// ─── Statistics ───────────────────────────────────────────────

export const getStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const users = await ctx.db.query("users").collect();
    const recipes = await ctx.db.query("creatorRecipes").collect();
    const financeRecords = await ctx.db.query("financeRecords").collect();

    const activeUsers = users.filter((u) => u.isActive).length;
    const publishedRecipes = recipes.filter((r) => r.isPublished).length;

    const totalIncome = financeRecords
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpense = financeRecords
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      users: {
        total: users.length,
        active: activeUsers,
        inactive: users.length - activeUsers,
      },
      recipes: {
        total: recipes.length,
        published: publishedRecipes,
        draft: recipes.length - publishedRecipes,
      },
      finance: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        transactionCount: financeRecords.length,
      },
    };
  },
});

// ─── AI Agents Management ─────────────────────────────────────

export const listAgents = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("aiAgents").collect();
  },
});

export const createAgent = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    provider: v.string(),
    model: v.string(),
    apiKey: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),
    maxTokens: v.number(),
    description: v.string(),
    purpose: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);
    const { token, ...agentData } = args;

    const agentId = await ctx.db.insert("aiAgents", {
      ...agentData,
      usedTokens: 0,
      totalRequests: 0,
      failedRequests: 0,
      isActive: true,
      isDefault: agentData.isDefault || false,
      lastUsedAt: undefined,
      lastError: undefined,
      deletedAt: undefined,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "create_agent",
      target: agentId,
      detail: `Created AI agent: ${agentData.name}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return agentId;
  },
});

export const updateAgent = mutation({
  args: {
    token: v.string(),
    agentId: v.id("aiAgents"),
    name: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    description: v.optional(v.string()),
    purpose: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);
    const { token, agentId, ...updates } = args;

    await ctx.db.patch(agentId, updates);

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "update_agent",
      target: agentId,
      detail: `Updated AI agent: ${agentId}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

export const deleteAgent = mutation({
  args: {
    token: v.string(),
    agentId: v.id("aiAgents"),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);

    await ctx.db.patch(args.agentId, {
      isActive: false,
      deletedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "delete_agent",
      target: args.agentId,
      detail: `Deleted AI agent: ${args.agentId}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

// ─── System Settings ──────────────────────────────────────────

export const getSettings = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("systemSettings").collect();
  },
});

export const updateSetting = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    value: v.string(),
    type: v.optional(v.string()),
    group: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);
    const { token, key, ...settingData } = args;

    // Check if setting exists
    const existing = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, settingData);
    } else {
      await ctx.db.insert("systemSettings", {
        key,
        ...settingData,
        type: settingData.type || "string",
        group: settingData.group || "general",
        isPublic: settingData.isPublic || false,
      });
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "update_setting",
      target: key,
      detail: `Updated setting: ${key}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

// ─── Activity Logs ────────────────────────────────────────────

export const getActivityLogs = query({
  args: {
    token: v.string(),
    userId: v.optional(v.id("users")),
    action: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    if (args.userId) {
      return await ctx.db
        .query("activityLogs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(args.limit || 100);
    }

    if (args.action) {
      return await ctx.db
        .query("activityLogs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .order("desc")
        .take(args.limit || 100);
    }

    return await ctx.db.query("activityLogs").order("desc").take(args.limit || 100);
  },
});

// ─── Notifications Management ─────────────────────────────────

export const sendNotification = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    category: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);
    const { token, ...notificationData } = args;

    const notificationId = await ctx.db.insert("notifications", {
      ...notificationData,
      isRead: false,
      deletedAt: undefined,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "send_notification",
      target: args.userId,
      detail: `Sent notification: ${args.title}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return notificationId;
  },
});

export const broadcastNotification = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    category: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);
    const { token, ...notificationData } = args;

    // Get all active users
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Send notification to each user
    for (const user of users) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        ...notificationData,
        isRead: false,
        deletedAt: undefined,
      });
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "broadcast_notification",
      target: "all_users",
      detail: `Broadcast notification: ${notificationData.title} to ${users.length} users`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true, sentTo: users.length };
  },
});
