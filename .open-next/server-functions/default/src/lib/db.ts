/**
 * Database Client - Migrated to Convex
 * 
 * This file is kept for backward compatibility.
 * All database operations now use Convex functions.
 * 
 * To use database:
 * 1. Client-side: Use Convex hooks from @/lib/convex-client
 * 2. Server-side: Use HTTP actions via convexFetch
 * 
 * See DEPLOYMENT_STATUS.md for migration guide.
 */

// Placeholder export to prevent import errors during migration
export const db = {
  // This is a placeholder. Use Convex functions instead.
  // All API routes using this should be migrated to use Convex HTTP actions
  user: null,
  post: null,
  session: null,
  creatorRecipe: null,
  financeRecord: null,
  // ... other models
} as any;

// Export type for compatibility
export type PrismaClient = typeof db;

export default db;
