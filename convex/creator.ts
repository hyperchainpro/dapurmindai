import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// GET - creator profile by userId
export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creatorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

// GET - list all creator profiles
export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("creatorProfiles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Map profiles to include published recipe count
    const mappedProfiles = [];
    for (const profile of profiles) {
      const recipes = await ctx.db
        .query("creatorRecipes")
        .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
        .filter((q) => q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isPublished"), true)
        ))
        .collect();

      mappedProfiles.push({
        ...profile,
        publishedRecipeCount: recipes.length,
      });
    }

    return mappedProfiles;
  },
});

// POST - upsert creator profile
export const upsertProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      const updates: any = {};
      if (args.displayName !== undefined) updates.displayName = args.displayName;
      if (args.bio !== undefined) updates.bio = args.bio;
      if (args.avatar !== undefined) updates.avatar = args.avatar;

      await ctx.db.patch(existing._id, updates);
      return await ctx.db.get(existing._id);
    } else {
      const profileId = await ctx.db.insert("creatorProfiles", {
        userId: args.userId,
        displayName: args.displayName || "",
        bio: args.bio || "",
        avatar: args.avatar || "",
        totalRecipes: 0,
        totalLikes: 0,
        followers: 0,
        isActive: true,
      });
      return await ctx.db.get(profileId);
    }
  },
});

// PUT - update creator profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("creatorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      throw new Error("Profil creator tidak ditemukan");
    }

    const updates: any = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(existing._id, updates);
    return await ctx.db.get(existing._id);
  },
});

// GET - creator dashboard analytics
export const getCreatorAnalytics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const recipes = await ctx.db
      .query("creatorRecipes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const totalRecipes = recipes.length;
    const publishedRecipes = recipes.filter((r) => r.isPublished).length;
    const draftRecipes = totalRecipes - publishedRecipes;
    const totalLikes = recipes.reduce((sum, r) => sum + r.likes, 0);

    // Fetch ratings for user's recipes
    const recipeIds = new Set(recipes.map((r) => r._id as string));
    const allRatings = await ctx.db.query("recipeRatings").filter((q) => q.eq(q.field("isActive"), true)).collect();
    const userRecipeRatings = allRatings.filter((r) => recipeIds.has(r.recipeId));

    const totalRating = userRecipeRatings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = userRecipeRatings.length > 0 ? Math.round((totalRating / userRecipeRatings.length) * 10) / 10 : 0;

    // Recipes by category
    const recipesByCategory: Record<string, number> = {};
    for (const recipe of recipes) {
      recipesByCategory[recipe.category] = (recipesByCategory[recipe.category] || 0) + 1;
    }

    // Likes over time (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentRecipes = recipes.filter((r) => (r._creationTime ?? 0) >= thirtyDaysAgo);

    // Group likes by date
    const likesGrouped: Record<string, number> = {};
    for (const r of recentRecipes) {
      const dateStr = new Date(r._creationTime).toISOString().split('T')[0];
      likesGrouped[dateStr] = (likesGrouped[dateStr] || 0) + r.likes;
    }
    const likesOverTime = Object.entries(likesGrouped).map(([date, likes]) => ({
      date,
      likes,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Recent Activity (last 10 recipes updated/created)
    const sortedByTime = [...recipes].sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)).slice(0, 10);
    const recentActivity = sortedByTime.map((r) => ({
      date: new Date(r._creationTime).toISOString(),
      action: r.isPublished ? 'published' : 'updated',
      detail: r.name,
    }));

    return {
      totalRecipes,
      publishedRecipes,
      draftRecipes,
      totalLikes,
      avgRating,
      recipesByCategory,
      recentActivity,
      likesOverTime,
    };
  },
});

