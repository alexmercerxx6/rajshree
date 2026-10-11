import type { ResultEntry } from '../utils/timeSlots';
import { getAvailableSlots } from '../utils/timeSlots';

// Results composable for managing results data
export const useResults = () => {
    const results = useState<ResultEntry[]>('results', () => []);
    const usedSlots = useState<string[]>('usedSlots', () => []);
    const isLoading = useState<boolean>('resultsLoading', () => false);
    const currentDate = useState<string>('currentDate', () => '');

    // Polling state
    const pollingInterval = ref<NodeJS.Timeout | null>(null);
    const lastWriteTime = ref<number>(0); // Track when we last wrote to DB

    const getAuthHeaders = () => {
        let token = '';
        if (import.meta.client) {
            try {
                token = localStorage.getItem('admin_token') || '';
            } catch {}
        }
        return token ? { 'Authorization': `Bearer ${token}`, 'x-admin-auth': token } : {};
    };

    // Fetch today's results
    const fetchResults = async (showLoading = true) => {
        if (showLoading) isLoading.value = true;
        try {
            const bucket = Math.floor(Date.now() / 3000);
            const data = await $fetch<{ results: ResultEntry[], date: string }>('/api/results', {
                query: { _t: bucket }
            });
            if (data) {
                const timeSinceWrite = Date.now() - lastWriteTime.value;
                const isWriting = timeSinceWrite < 10000;

                if (isWriting && data.results.length < results.value.length) {
                    return;
                }

                results.value = data.results;
                currentDate.value = data.date;
                usedSlots.value = data.results.map((r: ResultEntry) => r.timeSlot);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            if (showLoading) isLoading.value = false;
        }
    };

    // Start polling for results
    const startPolling = (intervalMs = 3000) => {
        fetchResults(true);

        if (pollingInterval.value) clearInterval(pollingInterval.value);

        pollingInterval.value = setInterval(() => {
            fetchResults(false);
        }, intervalMs);
    };

    // Stop polling
    const stopPolling = () => {
        if (pollingInterval.value) {
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
        }
    };

    // Get available slots
    const availableSlots = computed(() => {
        return getAvailableSlots(usedSlots.value);
    });

    // Add a result
    const addResult = async (timeSlot: string, codes: Record<string, string>, customDate?: string) => {
        try {
            const data = await $fetch<{ success: boolean, result: ResultEntry }>('/api/results/add', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: { timeSlot, date: customDate, ...codes },
            });

            if (data && data.result) {
                lastWriteTime.value = Date.now();
                results.value.push(data.result);
                results.value.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                usedSlots.value.push(data.result.timeSlot);
            }

            return data;
        } catch (error: any) {
            throw new Error(error?.data?.statusMessage || error?.data?.message || error?.statusMessage || 'Failed to add result');
        }
    };

    // Delete a result
    const deleteResult = async (id: string) => {
        try {
            await $fetch(`/api/results/delete/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            await fetchResults(false);
        } catch (error: any) {
            throw new Error(error?.data?.statusMessage || error?.data?.message || error?.statusMessage || 'Failed to delete result');
        }
    };

    return {
        results,
        usedSlots,
        isLoading,
        currentDate,
        availableSlots,
        fetchResults,
        addResult,
        deleteResult,
        startPolling,
        stopPolling,
    };
};
