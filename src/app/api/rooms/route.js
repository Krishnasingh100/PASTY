import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { rooms } from "@/db/schema.js";
import { generateUniqueRoomCode } from "@/lib/ids.js";

export const MAX_ROOM_SIZE = 50 * 1024 * 1024;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name || "Untitled Room";
    let ttlHours = parseInt(body.ttlHours || "168", 10) || 168;
    ttlHours = Math.max(1, Math.min(168, ttlHours));

    const db = getDb();
    const code = await generateUniqueRoomCode();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await db.insert(rooms).values({
      code,
      name: typeof name === "string" ? name.trim().slice(0, 100) : "Untitled Room",
      ttlHours,
      totalSize: 0,
      expiresAt,
    });
    const saved = await db.select().from(rooms).where(eq(rooms.code, code));

    return Response.json(
      {
        success: true,
        data: {
          code,
          name: saved[0]?.name,
          ttlHours,
          totalSize: 0,
          maxSize: MAX_ROOM_SIZE,
          createdAt: saved[0]?.createdAt,
          expiresAt: saved[0]?.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return Response.json({ success: false, message: e.message || "Internal server error" }, { status: 500 });
  }
}
