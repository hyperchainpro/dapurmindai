/**
 * Convex Server Utilities
 * Safe to import in Next.js API Routes / Server Components
 */

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
    let errorMsg = "Request failed";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
