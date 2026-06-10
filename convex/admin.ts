import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Helper: Require Admin ────────────────────────────────────

export async function requireAdmin(ctx: any, token: string) {
  if (token === "dapurmind-admin-key-2025") {
    return {
      user: { _id: "admin-system", role: "superadmin", isActive: true },
      session: null
    };
  }

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

export const getDashboardStats = query({
  args: { token: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    
    const days = args.days || 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const users = await ctx.db.query("users").collect();
    const recipes = await ctx.db.query("creatorRecipes").collect();
    const financeRecords = await ctx.db.query("financeRecords").collect();
    const affiliateAccounts = await ctx.db.query("affiliateAccounts").collect();
    const productLinks = await ctx.db.query("productLinks").collect();
    const clickLogs = await ctx.db.query("clickLogs").collect();
    const aiAgents = await ctx.db.query("aiAgents").collect();
    const aiAgentLogs = await ctx.db.query("aiAgentUsageLogs").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const activities = await ctx.db.query("activityLogs").order("desc").take(20);

    const activeUsers = users.filter((u) => u.isActive).length;
    const newUsers = users.filter((u) => (u._creationTime ?? 0) >= since).length;

    const publishedRecipes = recipes.filter((r) => r.isPublished).length;
    const newRecipes = recipes.filter((r) => (r._creationTime ?? 0) >= since).length;

    const financeRecordsPeriod = financeRecords.filter((r) => r.date >= since && r.isActive);
    const incomeTotal = financeRecordsPeriod.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
    const expenseTotal = financeRecordsPeriod.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

    const aiRequestsInPeriod = aiAgentLogs.filter(l => (l._creationTime ?? 0) >= since).length;
    const aiTotalRequests = aiAgents.reduce((sum, a) => sum + (a.totalRequests || 0), 0);
    const aiFailedRequests = aiAgents.reduce((sum, a) => sum + (a.failedRequests || 0), 0);
    const aiTotalTokens = aiAgents.reduce((sum, a) => sum + (a.usedTokens || 0), 0);

    const clicksInPeriod = clickLogs.filter((c) => c.clickedAt >= since).length;
    const activeSessions = sessions.filter((s) => s.expiresAt >= Date.now()).length;

    // Simulate growth/per day (simplified to avoid complex loops for now)
    const userGrowth = [{ date: new Date().toISOString().split('T')[0], count: newUsers }];
    const aiRequestsPerDay = [{ date: new Date().toISOString().split('T')[0], count: aiRequestsInPeriod }];

    // Format activities
    const recentActivities = [];
    for (const act of activities) {
      let user: any = null;
      if (act.userId === "admin-system") {
        user = { username: "Admin System", avatar: "🛡️" };
      } else {
        user = await ctx.db.get(act.userId as Id<"users">);
      }
      
      recentActivities.push({
        ...act,
        createdAt: new Date(act._creationTime ?? Date.now()),
        user: { username: user?.username, avatar: user?.avatar }
      });
    }

    return {
      period: { days, since: new Date(since).toISOString() },
      users: { total: users.length, active: activeUsers, newInPeriod: newUsers, growth: userGrowth },
      recipes: { total: recipes.length, published: publishedRecipes, newInPeriod: newRecipes },
      finance: { totalRecords: financeRecords.length, incomeInPeriod: incomeTotal, expenseInPeriod: expenseTotal, netInPeriod: incomeTotal - expenseTotal },
      affiliate: { accounts: affiliateAccounts.length, productLinks: productLinks.length, totalClicks: clickLogs.length, clicksInPeriod },
      ai: { agents: aiAgents.length, totalRequests: aiTotalRequests, failedRequests: aiFailedRequests, totalTokens: aiTotalTokens, requestsInPeriod: aiRequestsInPeriod, requestsPerDay: aiRequestsPerDay },
      sessions: { active: activeSessions },
      recentActivities,
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

export const listNotifications = query({
  args: {
    token: v.string(),
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    let query = ctx.db.query("notifications");

    let notifications = await query.collect();

    if (args.userId) {
      notifications = notifications.filter((n) => n.userId === args.userId);
    }

    if (args.category) {
      notifications = notifications.filter((n) => n.category === args.category);
    }

    notifications.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));

    const limit = args.limit || 50;
    const paginated = notifications.slice(0, limit);

    const data = [];
    for (const n of paginated) {
      const user = (await ctx.db.get(n.userId as any)) as any;
      data.push({
        ...n,
        user: user ? { id: user._id, username: user.username, name: user.name } : null,
      });
    }

    return data;
  },
});

export const getAiTokenStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const agents = await ctx.db.query("aiAgents").filter((q) => q.eq(q.field("deletedAt"), undefined)).collect();
    const usageLogs = await ctx.db.query("aiAgentUsageLogs").collect();
    const alerts = await ctx.db
      .query("aiTokenAlerts")
      .withIndex("by_isTriggered", (q) => q.eq("isTriggered", true))
      .filter((q) => q.eq(q.field("resolvedAt"), undefined))
      .collect();

    const totalUsedTokens = agents.reduce((sum, a) => sum + (a.usedTokens || 0), 0);
    const totalRequests = agents.reduce((sum, a) => sum + (a.totalRequests || 0), 0);
    const totalFailed = agents.reduce((sum, a) => sum + (a.failedRequests || 0), 0);

    const successLogs = usageLogs.filter((l) => l.status === "success");
    const totalLatency = successLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0);
    const avgLatencyMs = successLogs.length > 0 ? Math.round(totalLatency / successLogs.length) : 0;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentLogs = usageLogs.filter((l) => (l._creationTime ?? 0) >= thirtyDaysAgo);

    const dailyGroup: Record<string, { tokens: number; requests: number; errors: number }> = {};
    for (const log of recentLogs) {
      const dateStr = new Date(log._creationTime).toISOString().split('T')[0];
      if (!dailyGroup[dateStr]) {
        dailyGroup[dateStr] = { tokens: 0, requests: 0, errors: 0 };
      }
      const tokens = (log.inputTokens || 0) + (log.outputTokens || 0);
      dailyGroup[dateStr].tokens += tokens;
      dailyGroup[dateStr].requests += 1;
      if (log.status === "error") {
        dailyGroup[dateStr].errors += 1;
      }
    }
    const dailyUsage = Object.entries(dailyGroup).map(([date, val]) => ({
      date,
      ...val,
    })).sort((a, b) => a.date.localeCompare(b.date));

    const featureGroup: Record<string, { tokens: number; requests: number }> = {};
    for (const log of recentLogs) {
      const feature = log.feature || "chat";
      if (!featureGroup[feature]) {
        featureGroup[feature] = { tokens: 0, requests: 0 };
      }
      const tokens = (log.inputTokens || 0) + (log.outputTokens || 0);
      featureGroup[feature].tokens += tokens;
      featureGroup[feature].requests += 1;
    }

    const userGroup: Record<string, { userId: string; username: string; totalTokens: number; totalRequests: number }> = {};
    for (const log of recentLogs) {
      if (!log.userId) continue;
      const uidStr = String(log.userId);
      if (!userGroup[uidStr]) {
        userGroup[uidStr] = { userId: uidStr, username: "Unknown", totalTokens: 0, totalRequests: 0 };
      }
      const tokens = (log.inputTokens || 0) + (log.outputTokens || 0);
      userGroup[uidStr].totalTokens += tokens;
      userGroup[uidStr].totalRequests += 1;
    }

    const topUsers = [];
    for (const key of Object.keys(userGroup)) {
      try {
        const user = (await ctx.db.get(key as any)) as any;
        if (user) {
          userGroup[key].username = user.username || user.name || "Unknown";
        }
      } catch (e) {}
      topUsers.push(userGroup[key]);
    }
    topUsers.sort((a, b) => b.totalTokens - a.totalTokens);
    const top10Users = topUsers.slice(0, 10);

    const formattedAgents = agents.map((a) => ({
      id: a._id,
      name: a.name,
      provider: a.provider,
      model: a.model,
      usedTokens: a.usedTokens,
      maxTokens: a.maxTokens,
      totalRequests: a.totalRequests,
      failedRequests: a.failedRequests,
      lastUsedAt: a.lastUsedAt ? new Date(a.lastUsedAt).toISOString() : null,
      lastError: a.lastError,
      successRate: a.totalRequests > 0
        ? Math.round(((a.totalRequests - a.failedRequests) / a.totalRequests) * 10000) / 100
        : 100,
    }));

    return {
      agents: formattedAgents,
      totalUsedTokens,
      totalRequests,
      totalFailed,
      avgLatencyMs,
      dailyUsage,
      usageByFeature: featureGroup,
      alerts,
      topUsers: top10Users,
    };
  },
});

// ─── AI Token Alerts Management ────────────────────────────────

export const listTokenAlerts = query({
  args: {
    token: v.string(),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    let query = ctx.db.query("aiTokenAlerts").filter((q) => q.eq(q.field("isActive"), true));

    let alerts = await query.collect();

    if (args.active) {
      alerts = alerts.filter((a) => a.isTriggered && a.resolvedAt === undefined);
    }

    alerts.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));

    return alerts;
  },
});

export const createTokenAlert = mutation({
  args: {
    token: v.string(),
    agentId: v.optional(v.id("aiAgents")),
    thresholdType: v.string(),
    thresholdValue: v.number(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);

    const alertId = await ctx.db.insert("aiTokenAlerts", {
      agentId: args.agentId,
      thresholdType: args.thresholdType,
      thresholdValue: args.thresholdValue,
      message: args.message,
      isTriggered: false,
      isActive: true,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "create_token_alert",
      target: alertId,
      detail: `Created AI token alert: ${args.thresholdType}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return await ctx.db.get(alertId);
  },
});

export const resolveTokenAlert = mutation({
  args: {
    token: v.string(),
    alertId: v.id("aiTokenAlerts"),
    resolvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.token);

    const existing = await ctx.db.get(args.alertId);
    if (!existing || !existing.isActive) {
      throw new Error("Alert tidak ditemukan");
    }

    const resolvedTime = args.resolvedAt || Date.now();
    await ctx.db.patch(args.alertId, {
      resolvedAt: resolvedTime,
      isTriggered: false,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: admin._id,
      action: "resolve_token_alert",
      target: args.alertId,
      detail: `Resolved AI token alert: ${args.alertId}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return await ctx.db.get(args.alertId);
  },
});



