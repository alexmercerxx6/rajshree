import { supabase } from '../../utils/supabase';

export default defineEventHandler(async (event) => {
    // 1. Authentication Check
    const authCookie = getCookie(event, 'admin_auth');
    if (authCookie !== 'authenticated') {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    // 2. Check query param for format (default: sql)
    const query = getQuery(event);
    const format = query.format as string || 'sql';

    // 3. Fetch all results from Supabase using pagination (default limit is 1000)
    const PAGE_SIZE = 1000;
    let allResults: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: pageData, error } = await supabase
            .from('results')
            .select('*')
            .order('date', { ascending: true })
            .order('time_slot', { ascending: true })
            .range(from, to);

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to export data',
                data: error
            });
        }

        if (pageData && pageData.length > 0) {
            allResults = allResults.concat(pageData);
            page++;
            // If we got less than PAGE_SIZE, we've reached the end
            if (pageData.length < PAGE_SIZE) {
                hasMore = false;
            }
        } else {
            hasMore = false;
        }
    }

    const results = allResults;

    const dateStr = new Date().toISOString().split('T')[0];

    // 4. Generate output based on format
    if (format === 'json') {
        // JSON format (legacy)
        setHeader(event, 'Content-Type', 'application/json');
        setHeader(event, 'Content-Disposition', `attachment; filename="bhagyalaxmi-backup-${dateStr}.json"`);
        return { results, exportedAt: new Date().toISOString(), count: results?.length || 0 };
    }

    // SQL format (default) - can be directly imported into Supabase SQL Editor
    const sqlLines: string[] = [
        '-- GoBhagyalaxmi Database Backup',
        `-- Exported: ${new Date().toISOString()}`,
        `-- Total rows: ${results?.length || 0}`,
        '',
        '-- To import: Run this in Supabase SQL Editor',
        '-- WARNING: This will add data. Clear existing data first if needed:',
        '-- DELETE FROM results;',
        '',
    ];

    if (results && results.length > 0) {
        sqlLines.push('INSERT INTO results (date, time_slot, display_time, xa, xb, xc, xd, xe, xf, xg, xh, xi, xj, created_at) VALUES');

        const valueRows = results.map((r, i) => {
            const isLast = i === results.length - 1;
            const createdAt = r.created_at || new Date().toISOString();
            return `  ('${r.date}', '${r.time_slot}', '${r.display_time}', '${r.xa}', '${r.xb}', '${r.xc}', '${r.xd}', '${r.xe}', '${r.xf}', '${r.xg}', '${r.xh}', '${r.xi}', '${r.xj}', '${createdAt}')${isLast ? ';' : ','}`;
        });

        sqlLines.push(...valueRows);
    } else {
        sqlLines.push('-- No data to export');
    }

    const sqlContent = sqlLines.join('\n');

    setHeader(event, 'Content-Type', 'text/sql');
    setHeader(event, 'Content-Disposition', `attachment; filename="bhagyalaxmi-backup-${dateStr}.sql"`);

    return sqlContent;
});
