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
  | 'Dessert';

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
  | 'meal-plan-detail';
