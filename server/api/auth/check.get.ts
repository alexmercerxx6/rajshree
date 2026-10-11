// Check if user is authenticated via cookie or authorization header
export default defineEventHandler(async (event) => {
    const authCookie = getCookie(event, 'admin_auth');
    const authHeader = getHeader(event, 'authorization');
    const customHeader = getHeader(event, 'x-admin-auth');

    const isAuthenticated =
        authCookie === 'authenticated' ||
        authHeader === 'Bearer authenticated' ||
        customHeader === 'authenticated';

    return {
        authenticated: isAuthenticated,
    };
});
