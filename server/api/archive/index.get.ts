import { supabase } from '../../utils/supabase';

// GET /api/archive - Get archived results for date range
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const startDate = query.startDate as string;
    const endDate = query.endDate as string;

    if (!startDate || !endDate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'startDate and endDate are required',
        });
    }

    const { data: results, error } = await supabase
        .from('results')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('time_slot', { ascending: true });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch archive',
            data: error
        });
    }

    // Map snake_case to camelCase
    const mappedResults = (results || []).map(r => ({
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
        createdAt: r.created_at
    }));

    return {
        startDate,
        endDate,
        results: mappedResults,
        count: mappedResults.length,
    };
});
