import { logger } from '../../utils/logger';

// Admin login endpoint with hardcoded credentials
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { username, password, rememberMe } = body;
    const ip = getRequestIP(event);

    // Hardcoded admin credentials
    const ADMIN_USERNAME = 'adminlogin';
    const ADMIN_PASSWORD = 'rajsree101';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        logger.info('AUTH', `Login successful`, { username, ip });

        // Cookie options based on "Remember Me"
        // Cookie options (set to expire in 10 years)
        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
        };

        setCookie(event, 'admin_auth', 'authenticated', cookieOptions);

        return { success: true, message: 'Login successful' };
    }

    logger.warn('AUTH', `Login failed (Invalid credentials)`, { username, ip });
    throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
    });
});
