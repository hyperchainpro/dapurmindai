import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Create new user
export const create = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
    avatar: v.optional(v.string()),
    language: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      name: args.name,
      password: args.password,
      avatar: args.avatar,
      language: args.language || "id",
      role: args.role || "user",
      isActive: true,
      lastLoginAt: undefined,
      deletedAt: undefined,
    });
    return userId;
  },
});

// Update user
export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
    return userId;
  },
});

// Update last login time
export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastLoginAt: Date.now(),
    });
  },
});

// List users with pagination
export const list = query({
  args: {
    role: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("users");

    if (args.role) {
      return await query
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(args.limit || 50);
    }

    return await query
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(args.limit || 50);
  },
});

// Soft delete user
export const softDelete = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isActive: false,
      deletedAt: Date.now(),
    });
  },
});
