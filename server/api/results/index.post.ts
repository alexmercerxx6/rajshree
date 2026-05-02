import { supabase } from "../../utils/supabase";

// Helper to get today's date string in IST
function getTodayDateIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
}

// Types for results
export interface ResultEntry {
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
  createdAt: number;
}

export const RESULT_CODES = [
  "XA",
  "XB",
  "XC",
  "XD",
  "XE",
  "XF",
  "XG",
  "XH",
  "XI",
  "XJ",
] as const;

const ALL_TIME_SLOTS = [
  { value: "09:00", display: "09:00 A.M" },
  { value: "09:15", display: "09:15 A.M" },
  { value: "09:30", display: "09:30 A.M" },
  { value: "09:45", display: "09:45 A.M" },
  { value: "10:00", display: "10:00 A.M" },
  { value: "10:15", display: "10:15 A.M" },
  { value: "10:30", display: "10:30 A.M" },
  { value: "10:45", display: "10:45 A.M" },
  { value: "11:00", display: "11:00 A.M" },
  { value: "11:20", display: "11:20 A.M" },
  { value: "11:40", display: "11:40 A.M" },
  { value: "12:00", display: "12:00 P.M" },
  { value: "12:20", display: "12:20 P.M" },
  { value: "12:40", display: "12:40 P.M" },
  { value: "13:00", display: "01:00 P.M" },
  { value: "13:20", display: "01:20 P.M" },
  { value: "13:40", display: "01:40 P.M" },
  { value: "14:00", display: "02:00 P.M" },
  { value: "14:20", display: "02:20 P.M" },
  { value: "14:40", display: "02:40 P.M" },
  { value: "15:00", display: "03:00 P.M" },
  { value: "15:20", display: "03:20 P.M" },
  { value: "15:40", display: "03:40 P.M" },
  { value: "16:00", display: "04:00 P.M" },
  { value: "16:20", display: "04:20 P.M" },
  { value: "16:40", display: "04:40 P.M" },
  { value: "17:00", display: "05:00 P.M" },
  { value: "17:20", display: "05:20 P.M" },
  { value: "17:40", display: "05:40 P.M" },
  { value: "18:00", display: "06:00 P.M" },
  { value: "18:20", display: "06:20 P.M" },
  { value: "18:40", display: "06:40 P.M" },
  { value: "19:00", display: "07:00 P.M" },
  { value: "19:20", display: "07:20 P.M" },
  { value: "19:40", display: "07:40 P.M" },
  { value: "20:00", display: "08:00 P.M" },
  { value: "20:20", display: "08:20 P.M" },
  { value: "20:40", display: "08:40 P.M" },
  { value: "21:00", display: "09:00 P.M" },
  { value: "21:20", display: "09:20 P.M" },
  { value: "21:40", display: "09:40 P.M" },
];

function getSlotDisplay(value: string): string {
  const slot = ALL_TIME_SLOTS.find((s) => s.value === value);
  return slot?.display || value;
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
  const { timeSlot, ...codes } = body;

  // Validate time slot
  if (!timeSlot) {
    throw createError({
      statusCode: 400,
      statusMessage: "Time slot is required",
    });
  }

  // Validate codes (XA-XJ should be 2-digit strings)
  for (const code of RESULT_CODES) {
    const value = codes[code];
    if (!value || !/^\d{2}$/.test(value)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${code} must be a 2-digit number`,
      });
    }
  }

  const dateStr = getTodayDateIST();

  // Create new entry
  const displayTime = getSlotDisplay(timeSlot);

  const { data: newEntry, error } = await supabase
    .from('results')
    .insert({
      date: dateStr,
      time_slot: timeSlot,
      display_time: displayTime,
      xa: codes.XA,
      xb: codes.XB,
      xc: codes.XC,
      xd: codes.XD,
      xe: codes.XE,
      xf: codes.XF,
      xg: codes.XG,
      xh: codes.XH,
      xi: codes.XI,
      xj: codes.XJ,
    })
    .select()
    .single();

  if (error) {
    // Unique violation (23505)
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

  // Map back to camelCase return type matches interface
  const formattedEntry: ResultEntry = {
    id: newEntry.id,
    date: newEntry.date,
    timeSlot: newEntry.time_slot,
    displayTime: newEntry.display_time,
    XA: newEntry.xa,
    XB: newEntry.xb,
    XC: newEntry.xc,
    XD: newEntry.xd,
    XE: newEntry.xe,
    XF: newEntry.xf,
    XG: newEntry.xg,
    XH: newEntry.xh,
    XI: newEntry.xi,
    XJ: newEntry.xj,
    createdAt: Date.parse(newEntry.created_at) // Convert ISO string to timestamp number per interface
  };

  return { success: true, result: formattedEntry };
});
