export async function GET() {
  return Response.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2) + " seconds",
  });
}
