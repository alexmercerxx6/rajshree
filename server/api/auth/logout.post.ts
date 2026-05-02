import { logger } from '../../utils/logger';

// Admin logout endpoint
export default defineEventHandler(async (event) => {
    const ip = getRequestIP(event);
    logger.info('AUTH', 'Logout successful', { ip });

    // Clear auth cookie
    deleteCookie(event, 'admin_auth', {
        path: '/',
    });

    return { success: true, message: 'Logged out successfully' };
});
