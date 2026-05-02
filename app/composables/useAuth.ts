// Auth composable for managing authentication state
export const useAuth = () => {
    const isAuthenticated = useState<boolean>('isAuthenticated', () => false);
    const isLoading = useState<boolean>('authLoading', () => true);

    // Check authentication status
    const checkAuth = async () => {
        try {
            const data = await $fetch('/api/auth/check');
            isAuthenticated.value = data?.authenticated || false;
        } catch {
            isAuthenticated.value = false;
        } finally {
            isLoading.value = false;
        }
    };

    // Login
    const login = async (username: string, password: string, rememberMe: boolean = false) => {
        try {
            const data = await $fetch('/api/auth/login', {
                method: 'POST',
                body: { username, password, rememberMe },
            });
            isAuthenticated.value = true;
            return data;
        } catch (error: any) {
            throw new Error(error?.data?.message || error?.statusMessage || 'Login failed');
        }
    };

    // Logout
    const logout = async () => {
        await $fetch('/api/auth/logout', { method: 'POST' });
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

