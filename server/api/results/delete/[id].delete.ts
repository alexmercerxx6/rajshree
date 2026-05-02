import { supabase } from '../../../utils/supabase';

// DELETE /api/results/:id - Delete a result
export default defineEventHandler(async (event) => {
    // Check auth
    const authCookie = getCookie(event, 'admin_auth');
    if (authCookie !== 'authenticated') {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Result ID is required',
        });
    }

    const { data: deleted, error } = await supabase
        .from('results')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete result',
            data: error
        });
    }

    if (!deleted) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Result not found',
        });
    }

    return { success: true, deleted };
});
