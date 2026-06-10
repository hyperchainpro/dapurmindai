import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Affiliate Accounts ───────────────────────────────────────

export const getAffiliateAccounts = query({
  args: {},
  handler: async (ctx) => {
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
    // Verify admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden");
    }

    const { token, ...accountData } = args;

    const accountId = await ctx.db.insert("affiliateAccounts", {
      ...accountData,
      isActive: true,
      deletedAt: undefined,
    });

    return accountId;
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
    // Verify admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden");
    }

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
    // Verify admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden");
    }

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

    // Get user if token provided
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
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden");
    }

    let clicks = await ctx.db.query("clickLogs").collect();

    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      clicks = clicks.filter(
        (c) => c.clickedAt >= args.startDate! && c.clickedAt <= args.endDate!
      );
    }

    // Group by platform
    const byPlatform: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    const byProduct: Record<string, number> = {};

    for (const click of clicks) {
      byPlatform[click.platform] = (byPlatform[click.platform] || 0) + 1;
      byContext[click.context] = (byContext[click.context] || 0) + 1;
      byProduct[click.productLinkId] =
        (byProduct[click.productLinkId] || 0) + 1;
    }

    return {
      totalClicks: clicks.length,
      uniqueUsers: new Set(clicks.filter((c) => c.userId).map((c) => c.userId))
        .size,
      byPlatform,
      byContext,
      byProduct,
    };
  },
});
