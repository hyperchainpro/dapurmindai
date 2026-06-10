import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Get recipe by ID
export const getById = query({
  args: { recipeId: v.id("creatorRecipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recipeId);
  },
});

// List recipes with filters and pagination
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("creatorRecipes")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    if (args.isPublished !== undefined) {
      return await ctx.db
        .query("creatorRecipes")
        .withIndex("by_isPublished", (q) => q.eq("isPublished", args.isPublished!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("creatorRecipes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Search recipes by name
export const search = query({
  args: {
    searchQuery: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("creatorRecipes")
      .withSearchIndex("search_name", (q) => {
        let search = q.search("name", args.searchQuery);
        if (args.category) {
          search = search.eq("category", args.category);
        }
        search = search.eq("isPublished", true);
        return search;
      });

    return await query.take(args.limit || 20);
  },
});

// Get recipes by user
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creatorRecipes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(args.limit || 50);
  },
});

// Create recipe
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    image: v.string(),
    category: v.string(),
    difficulty: v.string(),
    cookTime: v.number(),
    prepTime: v.number(),
    servings: v.number(),
    ingredients: v.string(), // JSON string
    steps: v.string(), // JSON string
    tags: v.string(), // JSON string
    youtubeUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recipeId = await ctx.db.insert("creatorRecipes", {
      ...args,
      likes: 0,
      isPublished: false,
      isActive: true,
      deletedAt: undefined,
    });
    return recipeId;
  },
});

// Update recipe
export const update = mutation({
  args: {
    recipeId: v.id("creatorRecipes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    cookTime: v.optional(v.number()),
    prepTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    ingredients: v.optional(v.string()),
    steps: v.optional(v.string()),
    tags: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recipeId, ...updates } = args;
    await ctx.db.patch(recipeId, updates);
    return recipeId;
  },
});

// Publish/unpublish recipe
export const togglePublish = mutation({
  args: {
    recipeId: v.id("creatorRecipes"),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipeId, {
      isPublished: args.isPublished,
    });
  },
});

// Increment likes
export const incrementLikes = mutation({
  args: { recipeId: v.id("creatorRecipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");

    await ctx.db.patch(args.recipeId, {
      likes: recipe.likes + 1,
    });
  },
});

// Soft delete recipe
export const softDelete = mutation({
  args: { recipeId: v.id("creatorRecipes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipeId, {
      isActive: false,
      deletedAt: Date.now(),
    });
  },
});
