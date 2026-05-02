// Check if user is authenticated
export default defineEventHandler(async (event) => {
    const authCookie = getCookie(event, 'admin_auth');

    return {
        authenticated: authCookie === 'authenticated',
    };
});
