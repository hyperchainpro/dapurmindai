import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Get User Notifications ───────────────────────────────────

export const getUserNotifications = query({
  args: {
    token: v.string(),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
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

    let query = ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", session.userId));

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    return await query.order("desc").take(args.limit || 50);
  },
});

// ─── Mark as Read ─────────────────────────────────────────────

export const markAsRead = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notifications"),
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

    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });

    return { success: true };
  },
});

// ─── Mark All as Read ─────────────────────────────────────────

export const markAllAsRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Verify token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", session.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true, count: notifications.length };
  },
});

// ─── Delete Notification ──────────────────────────────────────

export const deleteNotification = mutation({
  args: {
    token: v.string(),
    notificationId: v.id("notifications"),
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

    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

// ─── Get Unread Count ─────────────────────────────────────────

export const getUnreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Verify token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return 0;
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", session.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unread.length;
  },
});
