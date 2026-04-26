export interface UserProfile {
  id: string;
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
  | 'admin-analytics';

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
