"use client";
/**
 * Convex Client Utilities
 * 
 * Helper functions untuk menggunakan Convex queries dan mutations
 * di Next.js components.
 * 
 * Ada 2 cara menggunakan Convex:
 * 1. React Hooks (Real-time) - Recommended untuk client components
 * 2. HTTP API (REST-like) - Untuk server components atau external calls
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// ─── HTTP API Client ──────────────────────────────────────────

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

export async function convexFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${CONVEX_SITE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// ─── User Hooks ───────────────────────────────────────────────

export function useUser(userId: Id<"users"> | null) {
  return useQuery(
    api.users.getById,
    userId ? { userId } : "skip"
  );
}

export function useUserByUsername(username: string | null) {
  return useQuery(
    api.users.getByUsername,
    username ? { username } : "skip"
  );
}

export function useUserByEmail(email: string | null) {
  return useQuery(
    api.users.getByEmail,
    email ? { email } : "skip"
  );
}

export function useCreateUser() {
  return useMutation(api.users.create);
}

export function useUpdateUser() {
  return useMutation(api.users.update);
}

// ─── Recipe Hooks ─────────────────────────────────────────────

export function useRecipe(recipeId: Id<"creatorRecipes"> | null) {
  return useQuery(
    api.recipes.getById,
    recipeId ? { recipeId } : "skip"
  );
}

export function useRecipes(args: {
  category?: string;
  isPublished?: boolean;
  numItems: number;
  cursor?: string | null;
}) {
  return useQuery(api.recipes.list, {
    paginationOpts: {
      numItems: args.numItems,
      cursor: args.cursor ?? null,
    },
    category: args.category,
    isPublished: args.isPublished,
  });
}

export function useSearchRecipes(searchQuery: string, category?: string) {
  return useQuery(
    api.recipes.search,
    searchQuery ? { searchQuery, category } : "skip"
  );
}

export function useRecipesByUser(userId: Id<"users"> | null, limit?: number) {
  return useQuery(
    api.recipes.getByUser,
    userId ? { userId, limit } : "skip"
  );
}

export function useCreateRecipe() {
  return useMutation(api.recipes.create);
}

export function useUpdateRecipe() {
  return useMutation(api.recipes.update);
}

export function useTogglePublishRecipe() {
  return useMutation(api.recipes.togglePublish);
}

export function useIncrementRecipeLikes() {
  return useMutation(api.recipes.incrementLikes);
}

// ─── Finance Hooks ────────────────────────────────────────────

export function useFinanceRecords(
  userId: Id<"users"> | null,
  filters?: {
    type?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }
) {
  return useQuery(
    api.finance.getRecordsByUser,
    userId ? { userId, ...filters } : "skip"
  );
}

export function useFinanceBudgets(userId: Id<"users"> | null) {
  return useQuery(
    api.finance.getBudgetsByUser,
    userId ? { userId } : "skip"
  );
}

export function useFinanceGoals(userId: Id<"users"> | null) {
  return useQuery(
    api.finance.getGoalsByUser,
    userId ? { userId } : "skip"
  );
}

export function useCreateFinanceRecord() {
  return useMutation(api.finance.createRecord);
}

export function useUpdateFinanceRecord() {
  return useMutation(api.finance.updateRecord);
}

export function useDeleteFinanceRecord() {
  return useMutation(api.finance.deleteRecord);
}

export function useCreateFinanceBudget() {
  return useMutation(api.finance.createBudget);
}

export function useCreateFinanceGoal() {
  return useMutation(api.finance.createGoal);
}

// ─── Type Exports ─────────────────────────────────────────────

export type { Id } from "../../convex/_generated/dataModel";
export type { Doc } from "../../convex/_generated/dataModel";
