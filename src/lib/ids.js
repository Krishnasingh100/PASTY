import crypto from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { gists, rooms } from "@/db/schema.js";

export function generateGistId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export async function generateUniqueGistId(maxAttempts = 50) {
  const db = getDb();
  for (let i = 0; i < maxAttempts; i++) {
    const id = generateGistId();
    const rows = await db.select({ id: gists.id }).from(gists).where(eq(gists.id, id));
    if (rows.length === 0) return id;
  }
  throw new Error("Unable to generate unique gist ID");
}

export async function generateUniqueRoomCode(maxAttempts = 50) {
  const db = getDb();
  for (let i = 0; i < maxAttempts; i++) {
    const code = crypto.randomBytes(4).toString("hex").slice(0, 6).toLowerCase().padEnd(6, "0");
    const rows = await db.select({ code: rooms.code }).from(rooms).where(eq(rooms.code, code));
    if (rows.length === 0) return code;
  }
  throw new Error("Unable to generate unique room code");
}
