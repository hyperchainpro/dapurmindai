import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppScreen,
  ChatMessage,
  UserProfile,
  MealPlan,
  ShoppingItem,
  Achievement,
  Recipe,
} from '@/types';

interface AppState {
  // Navigation
  currentScreen: AppScreen;
  previousScreen: AppScreen | null;
  setScreen: (screen: AppScreen) => void;
  goBack: () => void;

  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateOnboarding: (data: Partial<UserProfile>) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Meal Plans
  mealPlans: MealPlan[];
  currentMealPlan: MealPlan | null;
  setCurrentMealPlan: (plan: MealPlan | null) => void;
  addMealPlan: (plan: MealPlan) => void;

  // Shopping
  shoppingItems: ShoppingItem[];
  setShoppingItems: (items: ShoppingItem[]) => void;
  toggleShoppingItem: (id: string) => void;

  // Recipes
  favoriteRecipes: string[];
  toggleFavorite: (recipeId: string) => void;

  // Achievements
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;

  // Selected recipe for detail view
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Loading states
  isAILoading: boolean;
  setAILoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentScreen: 'splash',
      previousScreen: null,
      setScreen: (screen) =>
        set({ currentScreen: screen, previousScreen: get().currentScreen }),
      goBack: () => {
        const prev = get().previousScreen;
        if (prev) set({ currentScreen: prev, previousScreen: null });
      },

      // User
      user: null,
      setUser: (user) => set({ user }),
      updateOnboarding: (data) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...data }
            : {
                id: crypto.randomUUID(),
                name: '',
                familySize: 4,
                allergies: [],
                restrictions: [],
                tastePreferences: [],
                weeklyBudget: 300000,
                isOnboarded: false,
                createdAt: new Date().toISOString(),
                ...data,
              },
        })),

      // Chat
      chatMessages: [],
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),
      clearChat: () => set({ chatMessages: [] }),

      // Meal Plans
      mealPlans: [],
      currentMealPlan: null,
      setCurrentMealPlan: (plan) => set({ currentMealPlan: plan }),
      addMealPlan: (plan) =>
        set((state) => ({
          mealPlans: [plan, ...state.mealPlans],
          currentMealPlan: plan,
        })),

      // Shopping
      shoppingItems: [],
      setShoppingItems: (items) => set({ shoppingItems: items }),
      toggleShoppingItem: (id) =>
        set((state) => ({
          shoppingItems: state.shoppingItems.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        })),

      // Recipes
      favoriteRecipes: [],
      toggleFavorite: (recipeId) =>
        set((state) => ({
          favoriteRecipes: state.favoriteRecipes.includes(recipeId)
            ? state.favoriteRecipes.filter((id) => id !== recipeId)
            : [...state.favoriteRecipes, recipeId],
        })),

      // Achievements
      achievements: [
        { id: 'first_plan', title: 'Perencana Pertama', description: 'Buat rencana menu pertamamu', icon: '🎯', condition: 'first_plan', unlockedAt: undefined },
        { id: 'chef_5', title: 'Chef Rumahan', description: 'Simpan 5 resep favorit', icon: '👨‍🍳', condition: 'favorites_5', unlockedAt: undefined },
        { id: 'waste_hero', title: 'Pahlawan Zero Waste', description: 'Gunakan fitur Zero Waste 3 kali', icon: '♻️', condition: 'zerowaste_3', unlockedAt: undefined },
        { id: 'budget_master', title: 'Ahli Budget', description: 'Buat menu di bawah budget', icon: '💰', condition: 'under_budget', unlockedAt: undefined },
        { id: 'explorer', title: 'Penjelajah Rasa', description: 'Coba 10 resep berbeda', icon: '🌍', condition: 'recipes_10', unlockedAt: undefined },
      ],
      unlockAchievement: (id) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id && !a.unlockedAt
              ? { ...a, unlockedAt: new Date().toISOString() }
              : a
          ),
        })),

      // Selected recipe
      selectedRecipe: null,
      setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),

      // Theme
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

      // Loading
      isAILoading: false,
      setAILoading: (loading) => set({ isAILoading: loading }),
    }),
    {
      name: 'dapurmind-store',
      partialize: (state) => ({
        user: state.user,
        chatMessages: state.chatMessages,
        mealPlans: state.mealPlans,
        shoppingItems: state.shoppingItems,
        favoriteRecipes: state.favoriteRecipes,
        achievements: state.achievements,
        isDark: state.isDark,
        currentScreen: state.currentScreen === 'splash' ? 'onboarding' : state.currentScreen,
      }),
    }
  )
);
