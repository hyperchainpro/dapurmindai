export type Language = 'id' | 'en';

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  name: string;
  familySize: number;
  allergies: string[];
  restrictions: string[];
  tastePreferences: string[];
  weeklyBudget: number;
  isOnboarded: boolean;
  createdAt: string;
  avatar?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  category: RecipeCategory;
  difficulty: 'Mudah' | 'Sedang' | 'Susah';
  cookTime: number;
  prepTime: number;
  servings: number;
  calories?: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  rating: number;
  isFavorite?: boolean;
  youtubeUrl?: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export type RecipeCategory =
  | 'Sarapan'
  | 'Makan Siang'
  | 'Makan Malam'
  | 'Snack'
  | 'Minuman'
  | 'Dessert'
  | 'Western';

export interface MealPlan {
  id: string;
  weekStart: string;
  days: MealDay[];
  totalPrice: number;
  createdAt: string;
  budget?: number;
}

export interface MealDay {
  day: string;
  meals: {
    sarapan?: MealItem;
    makanSiang?: MealItem;
    makanMalam?: MealItem;
    snack?: MealItem;
  };
  totalCalories?: number;
}

export interface MealItem {
  recipe: Recipe;
  scaledServings: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
  affiliateUrl?: string;
  estimatedPrice?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mealPlan?: MealPlan;
  editedAt?: string;
}

export interface ZeroWasteInput {
  ingredients: string[];
  expiryDays: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: string;
}

export type AppScreen =
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'onboarding'
  | 'dashboard'
  | 'chat'
  | 'zero-waste'
  | 'recipes'
  | 'shopping'
  | 'profile'
  | 'recipe-detail'
  | 'meal-plan-detail'
  | 'marketplace'
  | 'admin-login'
  | 'admin-affiliate'
  | 'admin-analytics'
  | 'favorites'
  | 'creator'
  | 'financial-planner';

/* ── Auth Types ────────────────────────────────────── */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: string;
  isOnboarded: boolean;
  avatar?: string;
  language?: Language;
}

/* ── Affiliate Types ──────────────────────────────────── */

export interface AffiliateAccount {
  id: string;
  platform: string;
  affiliateId: string;
  apiKey?: string;
  baseUrlTemplate: string;
  isActive: boolean;
  createdAt: number;
}

export interface ProductLink {
  id: string;
  productName: string;
  category: string;
  imageUrl?: string;
  platform: string;
  affiliateUrl: string;
  originalPrice?: number;
  createdByAi: boolean;
  lastVerified?: number;
  createdAt: number;
  accountId: string;
}

export interface ClickLog {
  id: string;
  productLinkId: string;
  platform: string;
  userId?: string;
  context: string;
  clickedAt: number;
}

export interface AffiliateAnalytics {
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
  clicksByContext: Record<string, number>;
  clicksByDay: { date: string; count: number }[];
  topProducts: { productName: string; platform: string; clicks: number }[];
  totalAffiliateAccounts: number;
  totalProductLinks: number;
  activePlatforms: string[];
}

/* ── Creator Types ──────────────────────────────────── */

export interface CreatorRecipeItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  image: string;
  category: string;
  difficulty: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  ingredients: string; // JSON string
  steps: string; // JSON string
  tags: string; // JSON string
  youtubeUrl?: string;
  likes: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorProfileData {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatar: string;
  totalRecipes: number;
  totalLikes: number;
  followers: number;
}

/* ── Financial Planner Types ──────────────────────────── */

export interface FinanceRecord {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface FinanceBudget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
}

export interface FinanceGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  icon: string;
}
