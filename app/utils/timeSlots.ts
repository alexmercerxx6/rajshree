// All 39 time slots for the day
// 9:00 AM - 11:00 AM: 15-minute intervals (9 slots)
// 11:20 AM - 9:40 PM: 20-minute intervals (30 slots)

export interface TimeSlot {
    value: string;      // 24-hour format for sorting (e.g., "09:00")
    display: string;    // Display format (e.g., "09:00 A.M")
}

export const ALL_TIME_SLOTS: TimeSlot[] = [
    // Morning slots - 15 minute intervals (9:00 AM - 11:00 AM)
    { value: "09:00", display: "09:00 A.M" },
    { value: "09:15", display: "09:15 A.M" },
    { value: "09:30", display: "09:30 A.M" },
    { value: "09:45", display: "09:45 A.M" },
    { value: "10:00", display: "10:00 A.M" },
    { value: "10:15", display: "10:15 A.M" },
    { value: "10:30", display: "10:30 A.M" },
    { value: "10:45", display: "10:45 A.M" },
    { value: "11:00", display: "11:00 A.M" },

    // Rest of day - 20 minute intervals (11:20 AM - 9:40 PM)
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

// Result codes
export const RESULT_CODES = ['XA', 'XB', 'XC', 'XD', 'XE', 'XF', 'XG', 'XH', 'XI', 'XJ'] as const;
export type ResultCode = typeof RESULT_CODES[number];

// Result entry interface
export interface ResultEntry {
    id: string;
    date: string;           // YYYY-MM-DD
    timeSlot: string;       // 24-hour format
    displayTime: string;    // Display format
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

// Get today's date in YYYY-MM-DD format (IST)
export function getTodayIST(): string {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

// Get available slots (filter out used ones)
export function getAvailableSlots(usedSlotValues: string[]): TimeSlot[] {
    return ALL_TIME_SLOTS.filter(slot => !usedSlotValues.includes(slot.value));
}

// Find slot display by value
export function getSlotDisplay(value: string): string {
    const slot = ALL_TIME_SLOTS.find(s => s.value === value);
    return slot?.display || value;
}
