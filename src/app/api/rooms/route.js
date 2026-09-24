import dbConnect from "@/lib/db.js";
import Room, { MAX_ROOM_SIZE } from "@/models/Room.js";
import RoomEntry from "@/models/RoomEntry.js";
import { generateUniqueRoomCode } from "@/lib/ids.js";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const name = body.name || "Untitled Room";
    let ttlHours = parseInt(body.ttlHours || "168", 10) || 168;
    ttlHours = Math.max(1, Math.min(168, ttlHours));

    const code = await generateUniqueRoomCode();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const room = new Room({
      code,
      name: typeof name === "string" ? name.trim().slice(0, 100) : "Untitled Room",
      ttlHours,
      totalSize: 0,
      expiresAt,
    });
    await room.save();

    return Response.json(
      {
        success: true,
        data: {
          code: room.code,
          name: room.name,
          ttlHours: room.ttlHours,
          totalSize: 0,
          maxSize: MAX_ROOM_SIZE,
          createdAt: room.createdAt,
          expiresAt: room.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
