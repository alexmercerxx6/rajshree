// Auth composable for managing authentication state across iframes and windows
export const useAuth = () => {
    const isAuthenticated = useState<boolean>('isAuthenticated', () => false);
    const isLoading = useState<boolean>('authLoading', () => true);

    const getStoredToken = () => {
        if (import.meta.client) {
            try {
                return localStorage.getItem('admin_token') || '';
            } catch {
                return '';
            }
        }
        return '';
    };

    // Check authentication status
    const checkAuth = async () => {
        const token = getStoredToken();
        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['x-admin-auth'] = token;
            }

            const data = await $fetch<{ authenticated: boolean }>('/api/auth/check', {
                headers,
            });

            isAuthenticated.value = data?.authenticated || false;

            if (!isAuthenticated.value && import.meta.client) {
                try {
                    localStorage.removeItem('admin_token');
                } catch {}
            }
        } catch {
            isAuthenticated.value = false;
        } finally {
            isLoading.value = false;
        }
    };

    // Login
    const login = async (username: string, password: string, rememberMe: boolean = false) => {
        try {
            const data = await $fetch<{ success: boolean; token?: string; message?: string }>('/api/auth/login', {
                method: 'POST',
                body: { username, password, rememberMe },
            });

            if (data?.token && import.meta.client) {
                try {
                    localStorage.setItem('admin_token', data.token);
                } catch {}
            }

            isAuthenticated.value = true;
            return data;
        } catch (error: any) {
            throw new Error(error?.data?.statusMessage || error?.data?.message || error?.statusMessage || 'Login failed');
        }
    };

    // Logout
    const logout = async () => {
        if (import.meta.client) {
            try {
                localStorage.removeItem('admin_token');
            } catch {}
        }
        try {
            await $fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        isAuthenticated.value = false;
        navigateTo('/admin');
    };

    return {
        isAuthenticated,
        isLoading,
        checkAuth,
        login,
        logout,
    };
};
