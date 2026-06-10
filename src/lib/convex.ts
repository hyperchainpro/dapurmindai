import { ConvexHttpClient } from "convex/browser";

const url = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://silent-ocelot-29.convex.cloud';

export const client = new ConvexHttpClient(url);
