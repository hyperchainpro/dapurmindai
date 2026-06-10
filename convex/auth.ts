import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Helper Functions ─────────────────────────────────────────

// Simple hash function (in production, use proper bcrypt via Node action)
function simpleHash(password: string): string {
  // Convex V8 runtime does not support Buffer by default
  return btoa(unescape(encodeURIComponent(password)));
}

function verifyPassword(password: string, hash: string): boolean {
  // This is a placeholder - you should use bcrypt in a Node action
  return simpleHash(password) === hash;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ─── Register ─────────────────────────────────────────────────

export const register = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUsername) {
      throw new Error("Username already taken");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      password: simpleHash(args.password),
      name: args.name,
      avatar: undefined,
      language: "id",
      role: "user",
      isActive: true,
      lastLoginAt: Date.now(),
      deletedAt: undefined,
    });

    // Create session token
    const token = generateToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId,
      token,
      userAgent: undefined,
      ipAddress: undefined,
      expiresAt,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId,
      action: "register",
      target: "user",
      detail: `Registered with email: ${args.email}`,
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { 
      userId, 
      token,
      user: {
        id: userId,
        username: args.username,
        email: args.email,
        name: args.name,
        avatar: undefined,
        role: "user",
        language: "id",
      }
    };
  },
});

// ─── Login ────────────────────────────────────────────────────

export const login = mutation({
  args: {
    identifier: v.string(), // Can be username or email
    password: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find user by email first
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.identifier))
      .first();

    // If not found, try by username
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.identifier))
        .first();
    }

    if (!user) {
      throw new Error("Invalid username/email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is disabled");
    }

    // Verify password
    if (!user.password || !verifyPassword(args.password, user.password)) {
      throw new Error("Invalid username/email or password");
    }

    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      expiresAt,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: user._id,
      action: "login",
      target: "user",
      detail: "User logged in",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return {
      userId: user._id,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        language: user.language,
      },
    };
  },
});

// ─── Logout ───────────────────────────────────────────────────

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);

      // Log activity
      await ctx.db.insert("activityLogs", {
        userId: session.userId,
        action: "logout",
        target: "user",
        detail: "User logged out",
        ipAddress: undefined,
        userAgent: undefined,
      });
    }

    return { success: true };
  },
});

// ─── Verify Token ─────────────────────────────────────────────

export const verifyToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < Date.now()) {
      // Note: Can't delete in query, should be cleaned up periodically
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      language: user.language,
    };
  },
});

// ─── Get Current User ─────────────────────────────────────────

export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<{
    userId: string;
    username: string;
    email: string;
    name: string | undefined;
    avatar: string | undefined;
    role: string;
    language: string;
  } | null> => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      language: user.language,
    };
  },
});

// ─── Change Password ──────────────────────────────────────────

export const changePassword = mutation({
  args: {
    token: v.string(),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.password) {
      throw new Error("User not found");
    }

    // Verify old password
    if (!verifyPassword(args.oldPassword, user.password)) {
      throw new Error("Invalid old password");
    }

    // Update password
    await ctx.db.patch(user._id, {
      password: simpleHash(args.newPassword),
    });

    // Delete all sessions except current
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const s of allSessions) {
      if (s._id !== session._id) {
        await ctx.db.delete(s._id);
      }
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: user._id,
      action: "change_password",
      target: "user",
      detail: "Password changed",
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

// ─── Update Profile ───────────────────────────────────────────

export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const { token, ...updates } = args;

    await ctx.db.patch(session.userId, updates);

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: session.userId,
      action: "update_profile",
      target: "user",
      detail: "Profile updated",
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});

// ─── Delete All User Sessions ─────────────────────────────────

export const deleteAllUserSessions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true, deletedCount: sessions.length };
  },
});

// Create new session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      expiresAt: args.expiresAt,
    });
    return sessionId;
  },
});

// Reset password by email (requires verification or admin bypass)
export const resetPasswordByEmail = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Email tidak ditemukan");
    }

    await ctx.db.patch(user._id, {
      password: btoa(unescape(encodeURIComponent(args.newPassword))), // matches simpleHash
    });

    // Delete all sessions for user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      userId: user._id,
      action: "reset_password",
      target: "user",
      detail: "Password reset by email",
      ipAddress: undefined,
      userAgent: undefined,
    });

    return { success: true };
  },
});


