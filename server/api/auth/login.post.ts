import { logger } from '../../utils/logger';

// Admin login endpoint with hardcoded credentials
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { username, password, rememberMe } = body || {};
    const ip = getRequestIP(event);

    // Configured admin credentials
    const ADMIN_USERNAME = 'yryr2020@outlook.com';
    const ADMIN_PASSWORD = 'yryr2020';

    const normalizedUser = (username || '').toString().trim().toLowerCase();
    const normalizedPass = (password || '').toString().trim();

    const isUserValid = normalizedUser === ADMIN_USERNAME.toLowerCase() || normalizedUser === 'yryr2020@outlook.com';
    const isPassValid = normalizedPass === ADMIN_PASSWORD || normalizedPass === 'yryr2020';

    if (isUserValid && isPassValid) {
        logger.info('AUTH', `Login successful`, { username, ip });

        // Cookie options configured to work across iframes and standalone windows
        const cookieOptions: any = {
            httpOnly: false, // Allows cross-context sync
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        };

        setCookie(event, 'admin_auth', 'authenticated', cookieOptions);

        return {
            success: true,
            token: 'authenticated',
            message: 'Login successful'
        };
    }

    logger.warn('AUTH', `Login failed (Invalid credentials)`, { username, ip });
    throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
    });
});
