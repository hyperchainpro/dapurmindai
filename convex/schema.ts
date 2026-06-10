import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── User ──────────────────────────────────────────────────────
  users: defineTable({
    username: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    password: v.optional(v.string()), // bcrypt hashed
    avatar: v.optional(v.string()),
    language: v.string(),
    role: v.string(), // user, admin, superadmin
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ── Session (JWT-based) ──────────────────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    expiresAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_token", ["token"]),

  // ── Post (legacy) ─────────────────────────────────────────────
  posts: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    published: v.boolean(),
    authorId: v.id("users"),
    deletedAt: v.optional(v.number()),
  }).index("by_authorId", ["authorId"]),

  // ── Affiliate System ──────────────────────────────────────────
  affiliateAccounts: defineTable({
    platform: v.string(),
    affiliateId: v.string(),
    apiKey: v.optional(v.string()),
    baseUrlTemplate: v.string(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index("by_platform", ["platform"]),

  productLinks: defineTable({
    productName: v.string(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    platform: v.string(),
    affiliateUrl: v.string(),
    originalPrice: v.optional(v.number()),
    createdByAi: v.boolean(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
    accountId: v.id("affiliateAccounts"),
  })
    .index("by_accountId", ["accountId"])
    .index("by_category", ["category"])
    .index("by_platform", ["platform"]),

  clickLogs: defineTable({
    productLinkId: v.id("productLinks"),
    platform: v.string(),
    userId: v.optional(v.id("users")),
    context: v.string(),
    clickedAt: v.number(),
  })
    .index("by_productLinkId", ["productLinkId"])
    .index("by_userId", ["userId"])
    .index("by_clickedAt", ["clickedAt"]),

  // ── Creator Feature ───────────────────────────────────────────
  creatorRecipes: defineTable({
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
    likes: v.number(),
    isPublished: v.boolean(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_category", ["category"])
    .index("by_isPublished", ["isPublished"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "isPublished"],
    }),

  creatorProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.string(),
    avatar: v.string(),
    totalRecipes: v.number(),
    totalLikes: v.number(),
    followers: v.number(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // ── Ad Placements ──────────────────────────────────────────────
  adPlacements: defineTable({
    name: v.string(),
    position: v.string(),
    scriptContent: v.string(),
    platform: v.string(),
    isActive: v.boolean(),
    maxWidth: v.string(),
  })
    .index("by_position", ["position"])
    .index("by_isActive", ["isActive"]),

  // ── Financial Planner Feature ─────────────────────────────────
  financeRecords: defineTable({
    userId: v.union(v.id("users"), v.string()),
    type: v.string(),
    category: v.string(),
    amount: v.number(),
    description: v.string(),
    date: v.number(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_date", ["date"])
    .index("by_userId_and_date", ["userId", "date"]),

  financeBudgets: defineTable({
    userId: v.union(v.id("users"), v.string()),
    category: v.string(),
    limitAmount: v.number(),
    spentAmount: v.number(),
    period: v.string(),
    startDate: v.number(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  financeGoals: defineTable({
    userId: v.union(v.id("users"), v.string()),
    title: v.string(),
    targetAmount: v.number(),
    savedAmount: v.number(),
    deadline: v.number(),
    icon: v.string(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // ── AI Agent Management ───────────────────────────────────────
  aiAgents: defineTable({
    name: v.string(),
    provider: v.string(),
    model: v.string(),
    apiKey: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),
    maxTokens: v.number(),
    usedTokens: v.number(),
    totalRequests: v.number(),
    failedRequests: v.number(),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    description: v.string(),
    purpose: v.string(),
    lastUsedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_purpose", ["purpose"])
    .index("by_isActive", ["isActive"]),

  aiAgentUsageLogs: defineTable({
    agentId: v.id("aiAgents"),
    userId: v.optional(v.union(v.id("users"), v.string())),
    feature: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    latencyMs: v.number(),
    status: v.string(),
    errorMsg: v.optional(v.string()),
  })
    .index("by_agentId", ["agentId"])
    .index("by_userId", ["userId"])
    .index("by_feature", ["feature"]),

  // ── Activity Log ──────────────────────────────────────────────
  activityLogs: defineTable({
    userId: v.union(v.id("users"), v.string()),
    action: v.string(),
    target: v.optional(v.string()),
    detail: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_action", ["action"]),


  // ── System Setting ────────────────────────────────────────────
  systemSettings: defineTable({
    key: v.string(),
    value: v.string(),
    type: v.string(), // string, number, boolean, json
    group: v.string(), // general, security, ai, notification
    isPublic: v.boolean(),
  }).index("by_key", ["key"]),

  // ── Notification ─────────────────────────────────────────────
  notifications: defineTable({
    userId: v.union(v.id("users"), v.string()),
    title: v.string(),
    message: v.string(),
    type: v.string(), // info, warning, success, error
    category: v.string(), // general, finance, creator, ai, system
    isRead: v.boolean(),
    link: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_isRead", ["isRead"])
    .index("by_category", ["category"]),

  // ── Recurring Transaction ───────────────────────────────────
  recurringTransactions: defineTable({
    userId: v.union(v.id("users"), v.string()),
    type: v.string(), // income, expense
    category: v.string(),
    amount: v.number(),
    description: v.string(),
    frequency: v.string(), // daily, weekly, monthly, yearly
    nextDate: v.number(),
    endDate: v.optional(v.number()),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_frequency", ["frequency"])
    .index("by_nextDate", ["nextDate"]),

  // ── Recipe Rating / Comment ──────────────────────────────────
  recipeRatings: defineTable({
    recipeId: v.string(),
    userId: v.id("users"),
    rating: v.number(), // 1-5
    comment: v.string(),
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_recipeId", ["recipeId"])
    .index("by_userId", ["userId"])
    .index("by_recipeId_and_userId", ["recipeId", "userId"]),

  // ── AI Token Quota / Alert ───────────────────────────────────
  aiTokenAlerts: defineTable({
    agentId: v.optional(v.id("aiAgents")),
    thresholdType: v.string(), // total_tokens, daily_tokens, error_rate
    thresholdValue: v.number(),
    isTriggered: v.boolean(),
    triggeredAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    message: v.string(),
    isActive: v.boolean(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_isTriggered", ["isTriggered"]),
});
