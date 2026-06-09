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
  AffiliateAccount,
  ProductLink,
  AuthUser,
  Language,
  CreatorRecipeItem,
  CreatorProfileData,
  FinanceRecord,
  FinanceBudget,
  FinanceGoal,
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
  deleteChatMessage: (id: string) => void;
  updateChatMessage: (id: string, content: string) => void;
  clearChat: () => void;

  // Meal Plans
  mealPlans: MealPlan[];
  currentMealPlan: MealPlan | null;
  setCurrentMealPlan: (plan: MealPlan | null) => void;
  addMealPlan: (plan: MealPlan) => void;
  removeMealPlan: (index: number) => void;

  // Shopping
  shoppingItems: ShoppingItem[];
  setShoppingItems: (items: ShoppingItem[]) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearShoppingItems: () => void;

  // Recipes
  favoriteRecipes: string[];
  toggleFavorite: (recipeId: string) => void;

  // Achievements
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  checkAndUnlockAchievements: () => void;

  // Selected recipe for detail view
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Pending chat prompt (for Dashboard quick action -> Chat auto-send)
  pendingChatPrompt: string | null;
  setPendingChatPrompt: (prompt: string | null) => void;

  // Loading states
  isAILoading: boolean;
  setAILoading: (loading: boolean) => void;

  // Admin auth
  isAdminLoggedIn: boolean;
  setAdminLoggedIn: (val: boolean) => void;

  // User auth
  authUser: AuthUser | null;
  isLoggedIn: boolean;
  firstLaunch: boolean;
  setAuthUser: (user: AuthUser | null) => void;
  setLoggedIn: (val: boolean) => void;
  setFirstLaunch: (val: boolean) => void;
  logout: () => void;

  // Affiliate
  affiliateAccounts: AffiliateAccount[];
  setAffiliateAccounts: (accounts: AffiliateAccount[]) => void;
  addAffiliateAccount: (account: AffiliateAccount) => void;
  removeAffiliateAccount: (id: string) => void;
  productLinks: ProductLink[];
  setProductLinks: (links: ProductLink[]) => void;
  addProductLink: (link: ProductLink) => void;
  isGeneratingLinks: boolean;
  setGeneratingLinks: (loading: boolean) => void;

  // Creator
  creatorRecipes: CreatorRecipeItem[];
  creatorProfile: CreatorProfileData | null;
  isCreatorLoading: boolean;
  setCreatorRecipes: (recipes: CreatorRecipeItem[]) => void;
  addCreatorRecipe: (recipe: CreatorRecipeItem) => void;
  updateCreatorRecipe: (id: string, updates: Partial<CreatorRecipeItem>) => void;
  removeCreatorRecipe: (id: string) => void;
  setCreatorProfile: (profile: CreatorProfileData | null) => void;
  setCreatorLoading: (loading: boolean) => void;

  // Finance
  financeRecords: FinanceRecord[];
  financeBudgets: FinanceBudget[];
  financeGoals: FinanceGoal[];
  isFinanceLoading: boolean;
  setFinanceRecords: (records: FinanceRecord[]) => void;
  addFinanceRecord: (record: FinanceRecord) => void;
  updateFinanceRecord: (id: string, updates: Partial<FinanceRecord>) => void;
  removeFinanceRecord: (id: string) => void;
  setFinanceBudgets: (budgets: FinanceBudget[]) => void;
  addFinanceBudget: (budget: FinanceBudget) => void;
  updateFinanceBudget: (id: string, updates: Partial<FinanceBudget>) => void;
  removeFinanceBudget: (id: string) => void;
  setFinanceGoals: (goals: FinanceGoal[]) => void;
  addFinanceGoal: (goal: FinanceGoal) => void;
  updateFinanceGoal: (id: string, updates: Partial<FinanceGoal>) => void;
  removeFinanceGoal: (id: string) => void;
  setFinanceLoading: (loading: boolean) => void;
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
      deleteChatMessage: (id) =>
        set((state) => ({
          chatMessages: state.chatMessages.filter((m) => m.id !== id),
        })),
      updateChatMessage: (id, content) =>
        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === id ? { ...m, content, editedAt: new Date().toISOString() } : m
          ),
        })),
      clearChat: () => set({ chatMessages: [] }),

      // Meal Plans
      mealPlans: [],
      currentMealPlan: null,
      setCurrentMealPlan: (plan) => set({ currentMealPlan: plan }),
      addMealPlan: (plan) => {
        set((state) => ({
          mealPlans: [plan, ...state.mealPlans],
          currentMealPlan: plan,
        }));
        // Trigger achievement check after meal plan is added
        setTimeout(() => get().checkAndUnlockAchievements(), 0);
      },
      removeMealPlan: (index) =>
        set((state) => ({
          mealPlans: state.mealPlans.filter((_, i) => i !== index),
        })),

      // Shopping
      shoppingItems: [],
      setShoppingItems: (items) => set({ shoppingItems: items }),
      addShoppingItem: (item) => {
        set((state) => ({
          shoppingItems: [...state.shoppingItems, item],
        }));
        // Trigger achievement check after shopping item is added
        setTimeout(() => get().checkAndUnlockAchievements(), 0);
      },
      toggleShoppingItem: (id) =>
        set((state) => ({
          shoppingItems: state.shoppingItems.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        })),
      removeShoppingItem: (id) =>
        set((state) => ({
          shoppingItems: state.shoppingItems.filter((item) => item.id !== id),
        })),
      clearShoppingItems: () => set({ shoppingItems: [] }),

      // Recipes
      favoriteRecipes: [],
      toggleFavorite: (recipeId) => {
        set((state) => ({
          favoriteRecipes: state.favoriteRecipes.includes(recipeId)
            ? state.favoriteRecipes.filter((id) => id !== recipeId)
            : [...state.favoriteRecipes, recipeId],
        }));
        // Trigger achievement check after favorite is toggled
        setTimeout(() => get().checkAndUnlockAchievements(), 0);
      },

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
      checkAndUnlockAchievements: () => {
        const state = get();
        const user = state.user;
        if (!user) return;

        // 🎯 Perencana Pertama — has at least 1 meal plan
        if (state.mealPlans.length >= 1) {
          get().unlockAchievement('first_plan');
        }
        // 👨‍🍳 Chef Rumahan — 5 or more favorites
        if (state.favoriteRecipes.length >= 5) {
          get().unlockAchievement('chef_5');
        }
        // 💰 Ahli Budget — has a meal plan under budget (check latest)
        if (state.mealPlans.length > 0) {
          const latest = state.mealPlans[state.mealPlans.length - 1];
          if (latest.budget && latest.totalPrice && latest.totalPrice <= latest.budget) {
            get().unlockAchievement('budget_master');
          }
        }
      },

      // Selected recipe
      selectedRecipe: null,
      setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),

      // Language
      language: 'id' as Language,
      setLanguage: (lang) => set({ language: lang }),

      // Theme
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

      // Pending chat prompt
      pendingChatPrompt: null,
      setPendingChatPrompt: (prompt) => set({ pendingChatPrompt: prompt }),

      // Loading
      isAILoading: false,
      setAILoading: (loading) => set({ isAILoading: loading }),

      // Admin auth
      isAdminLoggedIn: false,
      setAdminLoggedIn: (val) => set({ isAdminLoggedIn: val }),

      // User auth
      authUser: null,
      isLoggedIn: false,
      firstLaunch: true,
      setAuthUser: (user) => set({ authUser: user }),
      setLoggedIn: (val) => set({ isLoggedIn: val }),
      setFirstLaunch: (val) => set({ firstLaunch: val }),
      logout: () => {
        set({
          authUser: null,
          isLoggedIn: false,
          currentScreen: 'login',
          previousScreen: null,
        });
      },

      // Affiliate
      affiliateAccounts: [],
      setAffiliateAccounts: (accounts) => set({ affiliateAccounts: accounts }),
      addAffiliateAccount: (account) =>
        set((state) => ({
          affiliateAccounts: [...state.affiliateAccounts, account],
        })),
      removeAffiliateAccount: (id) =>
        set((state) => ({
          affiliateAccounts: state.affiliateAccounts.filter((a) => a.id !== id),
        })),
      productLinks: [],
      setProductLinks: (links) => set({ productLinks: links }),
      addProductLink: (link) =>
        set((state) => ({
          productLinks: [...state.productLinks, link],
        })),
      isGeneratingLinks: false,
      setGeneratingLinks: (loading) => set({ isGeneratingLinks: loading }),

      // Creator
      creatorRecipes: [],
      creatorProfile: null,
      isCreatorLoading: false,
      setCreatorRecipes: (recipes) => set({ creatorRecipes: recipes }),
      addCreatorRecipe: (recipe) =>
        set((state) => ({
          creatorRecipes: [...state.creatorRecipes, recipe],
        })),
      updateCreatorRecipe: (id, updates) =>
        set((state) => ({
          creatorRecipes: state.creatorRecipes.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      removeCreatorRecipe: (id) =>
        set((state) => ({
          creatorRecipes: state.creatorRecipes.filter((r) => r.id !== id),
        })),
      setCreatorProfile: (profile) => set({ creatorProfile: profile }),
      setCreatorLoading: (loading) => set({ isCreatorLoading: loading }),

      // Finance
      financeRecords: [],
      financeBudgets: [],
      financeGoals: [],
      isFinanceLoading: false,
      setFinanceRecords: (records) => set({ financeRecords: records }),
      addFinanceRecord: (record) =>
        set((state) => ({
          financeRecords: [...state.financeRecords, record],
        })),
      updateFinanceRecord: (id, updates) =>
        set((state) => ({
          financeRecords: state.financeRecords.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      removeFinanceRecord: (id) =>
        set((state) => ({
          financeRecords: state.financeRecords.filter((r) => r.id !== id),
        })),
      setFinanceBudgets: (budgets) => set({ financeBudgets: budgets }),
      addFinanceBudget: (budget) =>
        set((state) => ({
          financeBudgets: [...state.financeBudgets, budget],
        })),
      updateFinanceBudget: (id, updates) =>
        set((state) => ({
          financeBudgets: state.financeBudgets.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      removeFinanceBudget: (id) =>
        set((state) => ({
          financeBudgets: state.financeBudgets.filter((b) => b.id !== id),
        })),
      setFinanceGoals: (goals) => set({ financeGoals: goals }),
      addFinanceGoal: (goal) =>
        set((state) => ({
          financeGoals: [...state.financeGoals, goal],
        })),
      updateFinanceGoal: (id, updates) =>
        set((state) => ({
          financeGoals: state.financeGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),
      removeFinanceGoal: (id) =>
        set((state) => ({
          financeGoals: state.financeGoals.filter((g) => g.id !== id),
        })),
      setFinanceLoading: (loading) => set({ isFinanceLoading: loading }),
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
        language: state.language,
        isDark: state.isDark,
        authUser: state.authUser,
        isLoggedIn: state.isLoggedIn,
        firstLaunch: state.firstLaunch,
        currentScreen: state.currentScreen === 'splash'
          ? 'login'
          : state.currentScreen,
      }),
    }
  )
);
