import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// ─── Helper Functions ─────────────────────────────────────────

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

async function parseBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// ─── Auth Routes ──────────────────────────────────────────────

http.route({
  path: "/api/auth/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await parseBody(request);
    
    try {
      const result = await ctx.runMutation(api.auth.register, {
        username: body.username,
        email: body.email,
        password: body.password,
        name: body.name,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/api/auth/login",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await parseBody(request);
    
    try {
      const result = await ctx.runMutation(api.auth.login, {
        email: body.email,
        password: body.password,
        userAgent: request.headers.get("User-Agent") || undefined,
        ipAddress: request.headers.get("X-Forwarded-For") || undefined,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/api/auth/logout",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    
    if (!token) {
      return new Response(JSON.stringify({ error: "No token provided" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runMutation(api.auth.logout, { token });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/auth/me",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    
    if (!token) {
      return new Response(JSON.stringify({ error: "No token provided" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await ctx.runQuery(api.auth.getCurrentUser, { token });

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Recipe Routes ────────────────────────────────────────────

http.route({
  path: "/api/recipes",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || undefined;
    const search = url.searchParams.get("search");
    const numItems = parseInt(url.searchParams.get("limit") || "20");

    if (search) {
      const results = await ctx.runQuery(api.recipes.search, {
        searchQuery: search,
        category,
        limit: numItems,
      });

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = await ctx.runQuery(api.recipes.list, {
      paginationOpts: { numItems, cursor: null },
      category,
      isPublished: true,
    });

    return new Response(JSON.stringify(results.page), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/recipes",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await ctx.runQuery(api.auth.getCurrentUser, { token });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await parseBody(request);

    try {
      const recipeId = await ctx.runMutation(api.recipes.create, {
        userId: user.userId as Id<"users">,
        name: body.name,
        description: body.description || "",
        image: body.image || "",
        category: body.category || "Lainnya",
        difficulty: body.difficulty || "Mudah",
        cookTime: body.cookTime || 30,
        prepTime: body.prepTime || 15,
        servings: body.servings || 4,
        ingredients: body.ingredients || "[]",
        steps: body.steps || "[]",
        tags: body.tags || "[]",
        youtubeUrl: body.youtubeUrl,
      });

      return new Response(JSON.stringify({ id: recipeId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ─── Finance Routes ───────────────────────────────────────────

http.route({
  path: "/api/finance/records",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await ctx.runQuery(api.auth.getCurrentUser, { token });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || undefined;

    const records = await ctx.runQuery(api.finance.getRecordsByUser, {
      userId: user.userId as Id<"users">,
      type,
      limit: 100,
    });

    return new Response(JSON.stringify(records), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/finance/records",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await ctx.runQuery(api.auth.getCurrentUser, { token });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await parseBody(request);

    const recordId = await ctx.runMutation(api.finance.createRecord, {
      userId: user.userId as Id<"users">,
      type: body.type,
      category: body.category,
      amount: body.amount,
      description: body.description || "",
      date: body.date,
    });

    return new Response(JSON.stringify({ id: recordId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Notifications Routes ─────────────────────────────────────

http.route({
  path: "/api/notifications",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    const notifications = await ctx.runQuery(api.notifications.getUserNotifications, {
      token,
      unreadOnly,
      limit: 50,
    });

    return new Response(JSON.stringify(notifications), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Admin Routes ─────────────────────────────────────────────

http.route({
  path: "/api/admin/stats",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const stats = await ctx.runQuery(api.admin.getStats, { token });

      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/api/admin/users",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(request.url);
      const role = url.searchParams.get("role") || undefined;
      const search = url.searchParams.get("search") || undefined;

      const users = await ctx.runQuery(api.admin.listUsers, {
        token,
        role,
        search,
        limit: 100,
      });

      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ─── Health Check ─────────────────────────────────────────────

http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({ 
      status: "ok",
      timestamp: Date.now(),
      service: "DapurMind AI - Convex Backend"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Export the router
export default http;
