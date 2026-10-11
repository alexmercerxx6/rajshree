import { supabase } from '../../utils/supabase';

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

    // Map snake_case to uppercase RA, RB, RC, RD, RE with clean single prefix
    const mappedResults = (results || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        timeSlot: r.time_slot,
        displayTime: normalizeDisplayTime(r.time_slot, r.display_time),
        RA: cleanCodeValue('RA', r.ra ?? r.RA),
        RB: cleanCodeValue('RB', r.rb ?? r.RB),
        RC: cleanCodeValue('RC', r.rc ?? r.RC),
        RD: cleanCodeValue('RD', r.rd ?? r.RD),
        RE: cleanCodeValue('RE', r.re ?? r.RE),
        createdAt: r.created_at
    }));

    return {
        startDate,
        endDate,
        results: mappedResults,
        count: mappedResults.length,
    };
});
