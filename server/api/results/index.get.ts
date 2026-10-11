import { supabase } from "../../utils/supabase";

function getTodayDateIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
}

function normalizeDisplayTime(timeSlot: string, rawDisplay?: string): string {
  if (rawDisplay) {
    const cleaned = rawDisplay.replace(/\.([A-Za-z])/g, '$1').replace(/\./g, '').trim();
    if (cleaned) return cleaned;
  }
  const parts = timeSlot.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (!isNaN(h)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const padH = displayH < 10 ? `0${displayH}` : `${displayH}`;
      return `${padH}:${m} ${ampm}`;
    }
  }
  return timeSlot;
}

function cleanCodeValue(code: string, val: any): string {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim().toUpperCase();
  const digits = str.replace(/^[A-Z]+/i, '');
  return `${code}${digits}`;
}

// GET /api/results - Get today's or latest available results
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const requestedDate = query.date as string | undefined;

  let dateStr = requestedDate || getTodayDateIST();

  setResponseHeader(event, 'Cache-Control', 'public, max-age=2, s-maxage=2, stale-while-revalidate=2');

  let results: any[] = [];

  // Query for requested or today's date
  const { data: dateResults, error } = await supabase
    .from("results")
    .select("*")
    .eq("date", dateStr)
    .order("time_slot", { ascending: true });

  if (error) {
    console.warn("Supabase query error for date", dateStr, error);
  } else if (dateResults && dateResults.length > 0) {
    results = dateResults;
  }

  // If no date was explicitly asked and today has 0 results, find the latest date in DB
  if (!requestedDate && results.length === 0) {
    const { data: latestDateData } = await supabase
      .from("results")
      .select("date")
      .order("date", { ascending: false })
      .limit(1);

    if (latestDateData && latestDateData.length > 0 && latestDateData[0].date) {
      dateStr = latestDateData[0].date;
      const { data: latestResults } = await supabase
        .from("results")
        .select("*")
        .eq("date", dateStr)
        .order("time_slot", { ascending: true });

      if (latestResults && latestResults.length > 0) {
        results = latestResults;
      }
    }
  }

  // If still empty and no explicit date, fallback to all available results sorted
  if (!requestedDate && results.length === 0) {
    const { data: allResults } = await supabase
      .from("results")
      .select("*")
      .order("date", { ascending: false })
      .order("time_slot", { ascending: true })
      .limit(50);

    if (allResults && allResults.length > 0) {
      dateStr = allResults[0].date;
      results = allResults.filter((r: any) => r.date === dateStr);
    }
  }

  // Map snake_case DB columns to frontend fields with guaranteed clean code format
  const mappedResults = results.map((r: any) => ({
    id: r.id,
    date: r.date,
    timeSlot: r.time_slot,
    displayTime: normalizeDisplayTime(r.time_slot, r.display_time),
    RA: cleanCodeValue('RA', r.ra ?? r.RA),
    RB: cleanCodeValue('RB', r.rb ?? r.RB),
    RC: cleanCodeValue('RC', r.rc ?? r.RC),
    RD: cleanCodeValue('RD', r.rd ?? r.RD),
    RE: cleanCodeValue('RE', r.re ?? r.RE),
    createdAt: r.created_at,
  }));

  return {
    date: dateStr,
    results: mappedResults,
  };
});
