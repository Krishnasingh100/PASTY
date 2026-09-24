import crypto from "crypto";
import Gist from "@/models/Gist.js";
import Room from "@/models/Room.js";

export function generateGistId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export async function generateUniqueGistId(maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    const id = generateGistId();
    const exists = await Gist.findOne({ id }).lean();
    if (!exists) return id;
  }
  throw new Error("Unable to generate unique gist ID");
}

export async function generateUniqueRoomCode(maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = crypto.randomBytes(4).toString("hex").slice(0, 6).toLowerCase().padEnd(6, "0");
    const exists = await Room.findOne({ code }).lean();
    if (!exists) return code;
  }
  throw new Error("Unable to generate unique room code");
}
