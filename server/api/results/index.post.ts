import { supabase } from "../../utils/supabase";

function getTodayDateIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
}

export interface ResultEntry {
  id: string;
  date: string;
  timeSlot: string;
  displayTime: string;
  RA: string;
  RB: string;
  RC: string;
  RD: string;
  RE: string;
  createdAt: number;
}

export const RESULT_CODES = ["RA", "RB", "RC", "RD", "RE"] as const;

function formatSlotDisplay(value: string): string {
  const parts = value.split(':');
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
  return value;
}

// POST /api/results - Add a new result
export default defineEventHandler(async (event) => {
  // Check auth
  const authCookie = getCookie(event, "admin_auth");
  if (authCookie !== "authenticated") {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { timeSlot, date: customDate, ...codes } = body;

  if (!timeSlot) {
    throw createError({
      statusCode: 400,
      statusMessage: "Time slot is required",
    });
  }

  const cleanCodes: Record<string, string> = {};
  for (const code of RESULT_CODES) {
    let rawVal = (codes[code] ?? "").toString().trim().toUpperCase();
    if (rawVal.startsWith(code)) {
      rawVal = rawVal.slice(code.length).trim();
    }
    if (!/^\d{2}$/.test(rawVal)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${code} must be a 2-digit number (e.g. 01 or 75)`,
      });
    }
    cleanCodes[code] = `${code}${rawVal}`;
  }

  const dateStr = customDate || getTodayDateIST();
  const displayTime = formatSlotDisplay(timeSlot);

  const { data: newEntry, error } = await supabase
    .from('results')
    .insert({
      date: dateStr,
      time_slot: timeSlot,
      display_time: displayTime,
      ra: cleanCodes.RA,
      rb: cleanCodes.RB,
      rc: cleanCodes.RC,
      rd: cleanCodes.RD,
      re: cleanCodes.RE,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 400,
        statusMessage: "This time slot already has a result",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create result",
      data: error
    });
  }

  if (!newEntry) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create result (no data returned)",
    });
  }

  const formattedEntry: ResultEntry = {
    id: newEntry.id,
    date: newEntry.date,
    timeSlot: newEntry.time_slot,
    displayTime: newEntry.display_time,
    RA: newEntry.ra,
    RB: newEntry.rb,
    RC: newEntry.rc,
    RD: newEntry.rd,
    RE: newEntry.re,
    createdAt: Date.parse(newEntry.created_at) || Date.now(),
  };

  return { success: true, result: formattedEntry };
});
