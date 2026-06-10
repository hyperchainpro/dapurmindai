# Contoh Penggunaan Convex di Next.js

## Setup sudah selesai ✅

- ✅ Convex Provider sudah ditambahkan di `layout.tsx`
- ✅ Helper hooks sudah dibuat di `src/lib/convex-client.ts`
- ✅ Schema Convex sudah di-deploy

## Cara Menggunakan Convex di Components

### 1. Query Data (Read)

```tsx
"use client";

import { useRecipes, useUser } from "@/lib/convex-client";

export function RecipeList() {
  // Query recipes dengan pagination
  const recipes = useRecipes({
    category: "Sarapan",
    isPublished: true,
    numItems: 20,
    cursor: null,
  });

  if (!recipes) return <div>Loading...</div>;

  return (
    <div>
      {recipes.page.map((recipe) => (
        <div key={recipe._id}>
          <h3>{recipe.name}</h3>
          <p>{recipe.description}</p>
        </div>
      ))}
      
      {/* Load more button */}
      {!recipes.isDone && (
        <button onClick={() => {
          // Implement pagination with continueCursor
        }}>
          Load More
        </button>
      )}
    </div>
  );
}
```

### 2. Mutation (Create/Update/Delete)

```tsx
"use client";

import { useCreateRecipe, useUpdateRecipe } from "@/lib/convex-client";
import { useState } from "react";

export function CreateRecipeForm() {
  const createRecipe = useCreateRecipe();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const recipeId = await createRecipe({
        userId: "user-id-here" as any, // Get from auth
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        image: formData.get("image") as string,
        category: formData.get("category") as string,
        difficulty: "Mudah",
        cookTime: 30,
        prepTime: 15,
        servings: 4,
        ingredients: JSON.stringify([]),
        steps: JSON.stringify([]),
        tags: JSON.stringify([]),
      });

      console.log("Recipe created:", recipeId);
      // Handle success (e.g., redirect, show toast)
    } catch (error) {
      console.error("Error creating recipe:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Recipe Name" required />
      <textarea name="description" placeholder="Description" />
      <input name="image" placeholder="Image URL" />
      <select name="category">
        <option value="Sarapan">Sarapan</option>
        <option value="Makan Siang">Makan Siang</option>
        <option value="Makan Malam">Makan Malam</option>
      </select>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Recipe"}
      </button>
    </form>
  );
}
```

### 3. Search dengan Full-Text Search

```tsx
"use client";

import { useSearchRecipes } from "@/lib/convex-client";
import { useState } from "react";

export function RecipeSearch() {
  const [query, setQuery] = useState("");
  const results = useSearchRecipes(query);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search recipes..."
      />

      {results && (
        <div>
          <p>Found {results.length} recipes</p>
          {results.map((recipe) => (
            <div key={recipe._id}>
              <h3>{recipe.name}</h3>
              <p>{recipe.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Finance Dashboard dengan Real-time Updates

```tsx
"use client";

import { useFinanceRecords, useFinanceBudgets, useFinanceGoals } from "@/lib/convex-client";
import { Id } from "@/lib/convex-client";

export function FinanceDashboard({ userId }: { userId: Id<"users"> }) {
  // Real-time queries - otomatis update saat data berubah
  const records = useFinanceRecords(userId, {
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
    endDate: Date.now(),
  });

  const budgets = useFinanceBudgets(userId);
  const goals = useFinanceGoals(userId);

  if (!records || !budgets || !goals) {
    return <div>Loading dashboard...</div>;
  }

  // Calculate totals
  const totalIncome = records
    .filter(r => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter(r => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold">Income</h3>
          <p className="text-2xl">Rp {totalIncome.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold">Expenses</h3>
          <p className="text-2xl">Rp {totalExpense.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Budgets</h3>
        {budgets.map((budget) => (
          <div key={budget._id} className="mb-2">
            <div className="flex justify-between">
              <span>{budget.category}</span>
              <span>
                Rp {budget.spentAmount.toLocaleString()} / Rp {budget.limitAmount.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(budget.spentAmount / budget.limitAmount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Goals</h3>
        {goals.map((goal) => (
          <div key={goal._id} className="p-4 border rounded-lg mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{goal.icon}</span>
              <div className="flex-1">
                <h4 className="font-medium">{goal.title}</h4>
                <p className="text-sm text-gray-600">
                  Rp {goal.savedAmount.toLocaleString()} / Rp {goal.targetAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Server-side Usage (Next.js App Router)

```tsx
// app/recipes/[id]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default async function RecipePage({
  params,
}: {
  params: { id: string };
}) {
  // Server-side query
  const recipe = await fetchQuery(api.recipes.getById, {
    recipeId: params.id as Id<"creatorRecipes">,
  });

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div>
      <h1>{recipe.name}</h1>
      <p>{recipe.description}</p>
      <img src={recipe.image} alt={recipe.name} />
      
      <div>
        <h2>Ingredients</h2>
        <ul>
          {JSON.parse(recipe.ingredients).map((ingredient: string, i: number) => (
            <li key={i}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Steps</h2>
        <ol>
          {JSON.parse(recipe.steps).map((step: string, i: number) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

### 6. Optimistic Updates

```tsx
"use client";

import { useIncrementRecipeLikes, useRecipe } from "@/lib/convex-client";
import { Id } from "@/lib/convex-client";
import { useState } from "react";

export function LikeButton({ recipeId }: { recipeId: Id<"creatorRecipes"> }) {
  const recipe = useRecipe(recipeId);
  const incrementLikes = useIncrementRecipeLikes();
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);

  const handleLike = async () => {
    if (!recipe) return;

    // Optimistic update
    setOptimisticLikes((recipe.likes ?? 0) + 1);

    try {
      await incrementLikes({ recipeId });
      // Reset optimistic state after server confirms
      setOptimisticLikes(null);
    } catch (error) {
      console.error("Failed to like recipe:", error);
      // Revert optimistic update
      setOptimisticLikes(null);
    }
  };

  const displayLikes = optimisticLikes ?? recipe?.likes ?? 0;

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg"
    >
      ❤️ {displayLikes} Likes
    </button>
  );
}
```

## Tips & Best Practices

### 1. Conditional Queries

Gunakan `"skip"` untuk conditional queries:

```tsx
const user = useQuery(
  api.users.getById,
  userId ? { userId } : "skip"
);
```

### 2. Error Handling

```tsx
const createRecipe = useCreateRecipe();

try {
  await createRecipe({ ... });
} catch (error) {
  if (error instanceof Error) {
    console.error("Error:", error.message);
  }
}
```

### 3. Loading States

```tsx
const recipes = useRecipes({ numItems: 20, cursor: null });

if (recipes === undefined) {
  return <div>Loading...</div>;
}

if (recipes === null) {
  return <div>Error loading recipes</div>;
}

return <div>{/* Render recipes */}</div>;
```

### 4. Pagination Best Practices

```tsx
const [cursor, setCursor] = useState<string | null>(null);
const recipes = useRecipes({ numItems: 20, cursor });

const loadMore = () => {
  if (recipes && !recipes.isDone) {
    setCursor(recipes.continueCursor);
  }
};
```

## Migration dari Prisma

### Before (Prisma)

```tsx
// pages/api/recipes.ts
import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  const recipes = await prisma.creatorRecipe.findMany({
    where: { isPublished: true },
    take: 20,
  });
  res.json(recipes);
}
```

### After (Convex)

```tsx
// convex/recipes.ts (backend)
export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creatorRecipes")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .take(args.limit || 20);
  },
});

// Component (frontend)
"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function RecipeList() {
  const recipes = useQuery(api.recipes.listPublished, { limit: 20 });
  // ...
}
```

## Keunggulan Convex

1. **Real-time by default** - Data otomatis sync tanpa polling
2. **Type-safe** - Full TypeScript support dengan generated types
3. **No API routes needed** - Direct function calls dari client
4. **Optimistic updates** - Built-in support untuk UX yang lebih baik
5. **Automatic caching** - Queries di-cache dan invalidate otomatis
6. **Built-in pagination** - Simple dan efficient
7. **Full-text search** - Search indexes sudah built-in
8. **Serverless** - No server management needed

## Resources

- [Convex Docs](https://docs.convex.dev/)
- [Convex React Guide](https://docs.convex.dev/client/react)
- [Convex Next.js Guide](https://docs.convex.dev/client/react/nextjs)
