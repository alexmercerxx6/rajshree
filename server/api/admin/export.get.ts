import { supabase } from '../../utils/supabase';

export default defineEventHandler(async (event) => {
    // 1. Authentication Check (cookie or header)
    const authCookie = getCookie(event, 'admin_auth');
    const authHeader = getHeader(event, 'authorization');
    const customHeader = getHeader(event, 'x-admin-auth');

    const isAuth =
        authCookie === 'authenticated' ||
        authHeader === 'Bearer authenticated' ||
        customHeader === 'authenticated';

    if (!isAuth) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    // 2. Check query param for format (default: sql)
    const query = getQuery(event);
    const format = query.format as string || 'sql';

    // 3. Fetch all results from Supabase using pagination
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
        setHeader(event, 'Content-Type', 'application/json');
        setHeader(event, 'Content-Disposition', `attachment; filename="rajshree-backup-${dateStr}.json"`);
        return { results, exportedAt: new Date().toISOString(), count: results?.length || 0 };
    }

    // SQL format (default)
    const sqlLines: string[] = [
        '-- Rajshree Results Backup',
        `-- Exported: ${new Date().toISOString()}`,
        `-- Total rows: ${results?.length || 0}`,
        '',
        '-- To import: Run this in SQL Editor',
        '-- DELETE FROM results;',
        '',
    ];

    if (results && results.length > 0) {
        sqlLines.push('INSERT INTO results (date, time_slot, display_time, ra, rb, rc, rd, re, created_at) VALUES');

        const valueRows = results.map((r, i) => {
            const isLast = i === results.length - 1;
            const createdAt = r.created_at || new Date().toISOString();
            return `  ('${r.date}', '${r.time_slot}', '${r.display_time}', '${r.ra}', '${r.rb}', '${r.rc}', '${r.rd}', '${r.re}', '${createdAt}')${isLast ? ';' : ','}`;
        });

        sqlLines.push(...valueRows);
    } else {
        sqlLines.push('-- No data to export');
    }

    const sqlContent = sqlLines.join('\n');

    setHeader(event, 'Content-Type', 'text/sql');
    setHeader(event, 'Content-Disposition', `attachment; filename="rajshree-backup-${dateStr}.sql"`);

    return sqlContent;
});
