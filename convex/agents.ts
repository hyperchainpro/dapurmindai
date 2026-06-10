import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to require admin (copied from admin.ts pattern if we need auth in the future)
// For now, since the Next.js route already does some auth (or should), we can just expose these.
// If we want it secure, we can require a token.

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("aiAgents")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    provider: v.string(),
    model: v.string(),
    apiKey: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    description: v.optional(v.string()),
    purpose: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const finalPurpose = args.purpose || "all";

    if (args.isDefault) {
      // Unset other defaults for this purpose
      const existingDefaults = await ctx.db
        .query("aiAgents")
        .withIndex("by_purpose", (q) => q.eq("purpose", finalPurpose))
        .collect();
      
      for (const agent of existingDefaults) {
        if (agent.isDefault) {
          await ctx.db.patch(agent._id, { isDefault: false });
        }
      }
    }

    const agentId = await ctx.db.insert("aiAgents", {
      name: args.name,
      provider: args.provider,
      model: args.model,
      apiKey: args.apiKey,
      apiBaseUrl: args.apiBaseUrl,
      maxTokens: args.maxTokens || 2000,
      description: args.description || "",
      purpose: finalPurpose,
      isDefault: args.isDefault || false,
      isActive: args.isActive !== false,
      usedTokens: 0,
      totalRequests: 0,
      failedRequests: 0,
    });

    return await ctx.db.get(agentId);
  },
});

export const get = query({
  args: { id: v.id("aiAgents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("aiAgents"),
    name: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    description: v.optional(v.string()),
    purpose: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Agent not found");

    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.provider !== undefined) updateData.provider = args.provider;
    if (args.model !== undefined) updateData.model = args.model;
    if (args.apiKey !== undefined) updateData.apiKey = args.apiKey;
    if (args.apiBaseUrl !== undefined) updateData.apiBaseUrl = args.apiBaseUrl;
    if (args.maxTokens !== undefined) updateData.maxTokens = args.maxTokens;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.purpose !== undefined) updateData.purpose = args.purpose;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    if (args.isDefault) {
      const targetPurpose = args.purpose || existing.purpose;
      const existingDefaults = await ctx.db
        .query("aiAgents")
        .withIndex("by_purpose", (q) => q.eq("purpose", targetPurpose))
        .collect();
      
      for (const agent of existingDefaults) {
        if (agent.isDefault && agent._id !== args.id) {
          await ctx.db.patch(agent._id, { isDefault: false });
        }
      }
      updateData.isDefault = true;
    } else if (args.isDefault === false) {
      updateData.isDefault = false;
    }

    await ctx.db.patch(args.id, updateData);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("aiAgents") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Agent not found");
    
    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      isActive: false,
      isDefault: false
    });
    return { success: true };
  },
});

