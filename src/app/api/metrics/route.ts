import { getMetrics } from "@/lib/metrics";

export async function GET() {
  try {
    const metricsData = await getMetrics();
    return new Response(metricsData, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    return new Response("Failed to fetch metrics", { status: 500 });
  }
}
