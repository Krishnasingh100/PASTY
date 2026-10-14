export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let db = "unconfigured";
  if (process.env.DATABASE_URL) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      await neon(process.env.DATABASE_URL)`select 1`;
      db = "up";
    } catch {
      db = "down";
    }
  }
  const status = db === "down" ? 503 : 200;
  return Response.json(
    {
      success: db !== "down",
      message: db === "down" ? "Database unreachable" : "Server is healthy",
      db,
      timestamp: new Date().toISOString(),
      uptime: process.uptime().toFixed(2) + " seconds",
    },
    { status }
  );
}
