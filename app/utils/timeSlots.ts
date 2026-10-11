// Exact schedule of 35 time slots
export interface TimeSlot {
    value: string;      // 24-hour format (e.g. "10:40", "13:00")
    display: string;    // Display format (e.g. "10:40 AM", "01:00 PM")
}

export const ALL_TIME_SLOTS: TimeSlot[] = [
    { value: "10:40", display: "10:40 AM" },
    { value: "11:00", display: "11:00 AM" },
    { value: "11:20", display: "11:20 AM" },
    { value: "11:40", display: "11:40 AM" },
    { value: "12:00", display: "12:00 PM" },
    { value: "12:20", display: "12:20 PM" },
    { value: "12:40", display: "12:40 PM" },
    { value: "13:00", display: "01:00 PM" },
    { value: "13:20", display: "01:20 PM" },
    { value: "13:40", display: "01:40 PM" },
    { value: "14:00", display: "02:00 PM" },
    { value: "14:20", display: "02:20 PM" },
    { value: "14:40", display: "02:40 PM" },
    { value: "15:00", display: "03:00 PM" },
    { value: "15:15", display: "03:15 PM" },
    { value: "15:30", display: "03:30 PM" },
    { value: "15:45", display: "03:45 PM" },
    { value: "16:00", display: "04:00 PM" },
    { value: "16:15", display: "04:15 PM" },
    { value: "16:30", display: "04:30 PM" },
    { value: "16:45", display: "04:45 PM" },
    { value: "17:00", display: "05:00 PM" },
    { value: "17:15", display: "05:15 PM" },
    { value: "17:30", display: "05:30 PM" },
    { value: "17:45", display: "05:45 PM" },
    { value: "18:00", display: "06:00 PM" },
    { value: "18:20", display: "06:20 PM" },
    { value: "18:40", display: "06:40 PM" },
    { value: "19:00", display: "07:00 PM" },
    { value: "19:20", display: "07:20 PM" },
    { value: "19:40", display: "07:40 PM" },
    { value: "20:00", display: "08:00 PM" },
    { value: "20:20", display: "08:20 PM" },
    { value: "20:40", display: "08:40 PM" },
    { value: "21:00", display: "09:00 PM" },
];

export const RESULT_CODES = ['RA', 'RB', 'RC', 'RD', 'RE'] as const;
export type ResultCode = typeof RESULT_CODES[number];

export interface ResultEntry {
    id: string;
    date: string;           // YYYY-MM-DD
    timeSlot: string;       // 24-hour format
    displayTime: string;    // Display format (e.g. "10:40 AM")
    RA: string;
    RB: string;
    RC: string;
    RD: string;
    RE: string;
    createdAt?: number | string;
}

// Get today's date in YYYY-MM-DD format (IST)
export function getTodayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

// Format date string from YYYY-MM-DD to DD-MM-YYYY
export function formatDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// Get available slots (filter out used ones)
export function getAvailableSlots(usedSlotValues: string[]): TimeSlot[] {
    return ALL_TIME_SLOTS.filter(slot => !usedSlotValues.includes(slot.value));
}

// Find slot display by value or normalize existing display time
export function getSlotDisplay(value: string, rawDisplay?: string): string {
    const slot = ALL_TIME_SLOTS.find(s => s.value === value);
    if (slot) return slot.display;

    if (rawDisplay) {
        return rawDisplay.replace(/\.([A-Za-z])/g, '$1').replace(/\./g, '').trim();
    }
    
    // Fallback parser if not directly found
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
