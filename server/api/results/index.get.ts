import { supabase } from "../../utils/supabase";

// Helper to get today's date string in IST
function getTodayDateIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
}

// Result entry type matching Supabase schema (mix of snake_case DB and camelCase response?)
// Actually we will map it back to camelCase for frontend compatibility
interface ResultEntry {
  id: string;
  date: string;
  timeSlot: string;
  displayTime: string;
  XA: string;
  XB: string;
  XC: string;
  XD: string;
  XE: string;
  XF: string;
  XG: string;
  XH: string;
  XI: string;
  XJ: string;
  createdAt: string;
}

// GET /api/results - Get today's results
export default defineEventHandler(async (event) => {
  const dateStr = getTodayDateIST();

  // Set Cache-Control to replace SWR (3 seconds cache)
  // s-maxage=3 controls the CDN/Edge cache
  // stale-while-revalidate=3 allows serving stale for a brief moment
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3, s-maxage=3, stale-while-revalidate=3'); const { data: results, error } = await supabase
    .from("results")
    .select("*")
    .eq("date", dateStr)
    .order("time_slot", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch results",
      data: error,
    });
  }

  // Map snake_case DB columns to camelCase for frontend
  const mappedResults = (results || []).map((r) => ({
    id: r.id,
    date: r.date,
    timeSlot: r.time_slot,
    displayTime: r.display_time,
    XA: r.xa,
    XB: r.xb,
    XC: r.xc,
    XD: r.xd,
    XE: r.xe,
    XF: r.xf,
    XG: r.xg,
    XH: r.xh,
    XI: r.xi,
    XJ: r.xj,
    createdAt: r.created_at,
  }));

  return {
    date: dateStr,
    results: mappedResults,
  };
});
