import { supabase } from '../../utils/supabase';

// Helper to get today's date string in IST
function getTodayDateIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

// GET /api/results/slots - Get used time slots
export default defineEventHandler(async (event) => {
    const dateStr = getTodayDateIST();

    // Fetch time_slot only to check what's used
    const { data: results, error } = await supabase
        .from('results')
        .select('time_slot')
        .eq('date', dateStr);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch slots',
            data: error
        });
    }

    // Return used time slots
    const usedSlots = (results || []).map(r => r.time_slot);

    return { usedSlots };
});
