// Auth middleware to protect admin routes
export default defineNuxtRouteMiddleware(async (to, from) => {
    // Only run on client
    if (import.meta.server) return;

    // Check auth status
    try {
        const data = await $fetch('/api/auth/check');
        if (!data?.authenticated) {
            return navigateTo('/admin');
        }
    } catch {
        return navigateTo('/admin');
    }
});
