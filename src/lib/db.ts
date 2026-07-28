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

const dummyModel = {
  findFirst: async () => null,
  findMany: async () => [],
  findUnique: async () => null,
  create: async () => ({ id: 'mock-id' }),
  update: async () => ({ id: 'mock-id' }),
  upsert: async () => ({ id: 'mock-id' }),
  delete: async () => ({ id: 'mock-id' }),
  count: async () => 0,
  aggregate: async () => ({ _count: 0 }),
  groupBy: async () => [],
};

export const db: any = new Proxy({}, {
  get(_target, _prop) {
    return dummyModel;
  }
});

export type PrismaClient = typeof db;
export default db;
