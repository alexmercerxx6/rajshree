import { supabase } from '../../utils/supabase';

function getTodayDateIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

// GET /api/results/slots - Get used time slots for a specified date
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const dateStr = (query.date as string) || getTodayDateIST();

    setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');

    // Fetch time_slot for the given date
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

    const usedSlots = (results || []).map((r: any) => r.time_slot);

    return { 
        date: dateStr,
        usedSlots 
    };
});
