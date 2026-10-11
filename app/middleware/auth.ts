// Auth middleware to protect admin routes
export default defineNuxtRouteMiddleware(async (to, from) => {
    // Only run on client
    if (import.meta.server) return;

    let token = '';
    try {
        token = localStorage.getItem('admin_token') || '';
    } catch {}

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-admin-auth'] = token;
    }

    try {
        const data = await $fetch<{ authenticated: boolean }>('/api/auth/check', {
            headers,
        });

        if (!data?.authenticated) {
            try {
                localStorage.removeItem('admin_token');
            } catch {}
            return navigateTo('/admin');
        }
    } catch {
        return navigateTo('/admin');
    }
});
