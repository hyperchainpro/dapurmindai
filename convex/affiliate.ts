import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./admin";

// ─── Affiliate Accounts ───────────────────────────────────────

export const getAffiliateAccounts = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.token) {
      await requireAdmin(ctx, args.token);
      return await ctx.db.query("affiliateAccounts").collect();
    }
    return await ctx.db
      .query("affiliateAccounts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createAffiliateAccount = mutation({
  args: {
    token: v.string(),
    platform: v.string(),
    affiliateId: v.string(),
    apiKey: v.optional(v.string()),
    baseUrlTemplate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { token, ...accountData } = args;
    const accountId = await ctx.db.insert("affiliateAccounts", {
      ...accountData,
      isActive: true,
      deletedAt: undefined,
    });
    return accountId;
  },
});

export const updateAffiliateAccount = mutation({
  args: {
    token: v.string(),
    accountId: v.id("affiliateAccounts"),
    platform: v.optional(v.string()),
    affiliateId: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    baseUrlTemplate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { token, accountId, ...updates } = args;
    await ctx.db.patch(accountId, updates);
    return { success: true };
  },
});

export const deleteAffiliateAccount = mutation({
  args: {
    token: v.string(),
    accountId: v.id("affiliateAccounts"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.accountId);
    return { success: true };
  },
});

// ─── Product Links ────────────────────────────────────────────

export const getProductLinks = query({
  args: {
    category: v.optional(v.string()),
    platform: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("productLinks")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(args.limit || 50);
    }
    if (args.platform) {
      return await ctx.db
        .query("productLinks")
        .withIndex("by_platform", (q) => q.eq("platform", args.platform!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(args.limit || 50);
    }
    return await ctx.db
      .query("productLinks")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(args.limit || 50);
  },
});

export const createProductLink = mutation({
  args: {
    token: v.string(),
    accountId: v.id("affiliateAccounts"),
    productName: v.string(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    platform: v.string(),
    affiliateUrl: v.string(),
    originalPrice: v.optional(v.number()),
    createdByAi: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { token, ...linkData } = args;
    const linkId = await ctx.db.insert("productLinks", {
      ...linkData,
      createdByAi: linkData.createdByAi || false,
      isActive: true,
      deletedAt: undefined,
    });
    return linkId;
  },
});

export const updateProductLink = mutation({
  args: {
    token: v.string(),
    linkId: v.id("productLinks"),
    productName: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    affiliateUrl: v.optional(v.string()),
    originalPrice: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { token, linkId, ...updates } = args;
    await ctx.db.patch(linkId, updates);
    return { success: true };
  },
});

// ─── Click Logging ────────────────────────────────────────────

export const logClick = mutation({
  args: {
    productLinkId: v.id("productLinks"),
    platform: v.string(),
    context: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId: any = undefined;
    if (args.token) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.token!))
        .first();
      if (session) {
        userId = session.userId;
      }
    }
    await ctx.db.insert("clickLogs", {
      productLinkId: args.productLinkId,
      platform: args.platform,
      userId,
      context: args.context,
      clickedAt: Date.now(),
    });
    return { success: true };
  },
});

// ─── Analytics ────────────────────────────────────────────────

export const getAffiliateAnalytics = query({
  args: {
    token: v.string(),
    period: v.optional(v.string()), // 7d, 30d, 90d
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    
    // Calculate timestamp
    const now = Date.now();
    const periodDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = periodDays[args.period || '7d'] || 7;
    const since = now - (days * 24 * 60 * 60 * 1000);

    let clicks = await ctx.db.query("clickLogs")
      .withIndex("by_clickedAt", q => q.gte("clickedAt", since))
      .collect();

    const byPlatform: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    const byProductRaw: Record<string, number> = {};
    const clicksByDayMap: Record<string, number> = {};

    for (const click of clicks) {
      byPlatform[click.platform] = (byPlatform[click.platform] || 0) + 1;
      byContext[click.context] = (byContext[click.context] || 0) + 1;
      byProductRaw[click.productLinkId] = (byProductRaw[click.productLinkId] || 0) + 1;
      
      const date = new Date(click.clickedAt).toISOString().split('T')[0];
      clicksByDayMap[date] = (clicksByDayMap[date] || 0) + 1;
    }

    const clicksByDay = Object.entries(clicksByDayMap).map(([date, count]) => ({ date, count })).sort((a, b) => b.date.localeCompare(a.date));

    // Get top products details
    const topProductIds = Object.entries(byProductRaw)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);

    const topProducts = [];
    for (const pid of topProductIds) {
      const product = (await ctx.db.get(pid as any)) as any;
      topProducts.push({
        productName: product?.productName || "Unknown",
        platform: product?.platform || "unknown",
        clicks: byProductRaw[pid],
      });
    }

    const accounts = await ctx.db.query("affiliateAccounts").filter(q => q.eq(q.field("deletedAt"), undefined)).collect();
    const activePlatforms = [...new Set(accounts.filter(a => a.isActive).map(a => a.platform))];
    
    const linksCount = (await ctx.db.query("productLinks").filter(q => q.eq(q.field("deletedAt"), undefined)).collect()).length;

    return {
      totalClicks: clicks.length,
      clicksByPlatform: byPlatform,
      clicksByContext: byContext,
      clicksByDay,
      topProducts,
      totalAffiliateAccounts: accounts.length,
      totalProductLinks: linksCount,
      activePlatforms,
    };
  },
});

export const getClickLogs = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    
    let query = ctx.db.query("clickLogs").order("desc");
    
    let logs = await query.collect();

    if (args.platform) {
      logs = logs.filter((l) => l.platform === args.platform);
    }
    
    if (args.limit) {
      logs = logs.slice(0, args.limit);
    }

    return await Promise.all(logs.map(async (l) => {
      const product = (await ctx.db.get(l.productLinkId)) as any;
      return {
        ...l,
        id: l._id,
        productName: product?.productName || "Unknown",
      };
    }));
  },
});

