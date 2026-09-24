import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let cached = null;

export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL (use pooled Neon string)");
  cached = drizzle(neon(url));
  return cached;
}
