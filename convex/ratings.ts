import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// GET - get ratings by recipeId or userId
export const getRatings = query({
  args: {
    recipeId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.recipeId) {
      return await ctx.db
        .query("recipeRatings")
        .withIndex("by_recipeId", (q) => q.eq("recipeId", args.recipeId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
    if (args.userId) {
      return await ctx.db
        .query("recipeRatings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
    return [];
  },
});

// POST - Create a rating
export const createRating = mutation({
  args: {
    recipeId: v.string(),
    userId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recipeRatings")
      .withIndex("by_recipeId_and_userId", (q) => q.eq("recipeId", args.recipeId).eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      throw new Error("Anda sudah memberikan rating untuk resep ini");
    }

    const ratingId = await ctx.db.insert("recipeRatings", {
      recipeId: args.recipeId,
      userId: args.userId,
      rating: args.rating,
      comment: args.comment,
      isActive: true,
    });

    return await ctx.db.get(ratingId);
  },
});

// PUT - Update a rating
export const updateRating = mutation({
  args: {
    ratingId: v.id("recipeRatings"),
    userId: v.id("users"),
    rating: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.ratingId);
    if (!existing || existing.userId !== args.userId || !existing.isActive) {
      throw new Error("Rating tidak ditemukan atau bukan milik Anda");
    }

    const updates: any = {};
    if (args.rating !== undefined) updates.rating = args.rating;
    if (args.comment !== undefined) updates.comment = args.comment;

    await ctx.db.patch(args.ratingId, updates);
    return await ctx.db.get(args.ratingId);
  },
});

// DELETE - Soft delete a rating
export const deleteRating = mutation({
  args: {
    ratingId: v.id("recipeRatings"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.ratingId);
    if (!existing || existing.userId !== args.userId || !existing.isActive) {
      throw new Error("Rating tidak ditemukan atau bukan milik Anda");
    }

    await ctx.db.patch(args.ratingId, {
      isActive: false,
      deletedAt: Date.now(),
    });

    return { success: true };
  },
});
