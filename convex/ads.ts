import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./admin";

// ─── Get Ad Placements ────────────────────────────────────────

export const getAdsByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adPlacements")
      .withIndex("by_position", (q) => q.eq("position", args.position))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const listAllAds = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("adPlacements").collect();
  },
});

// ─── Create Ad Placement ──────────────────────────────────────

export const createAd = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    position: v.string(),
    scriptContent: v.string(),
    platform: v.string(),
    maxWidth: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { token, ...adData } = args;
    const adId = await ctx.db.insert("adPlacements", adData);
    return adId;
  },
});

// ─── Update Ad Placement ──────────────────────────────────────

export const updateAd = mutation({
  args: {
    token: v.string(),
    adId: v.id("adPlacements"),
    name: v.optional(v.string()),
    position: v.optional(v.string()),
    scriptContent: v.optional(v.string()),
    platform: v.optional(v.string()),
    maxWidth: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { token, adId, ...updates } = args;
    await ctx.db.patch(adId, updates);
    return { success: true };
  },
});

// ─── Delete Ad Placement ──────────────────────────────────────

export const deleteAd = mutation({
  args: {
    token: v.string(),
    adId: v.id("adPlacements"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.adId);
    return { success: true };
  },
});
