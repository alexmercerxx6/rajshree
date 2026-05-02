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

    // Fetch today's results
    const fetchResults = async (showLoading = true) => {
        if (showLoading) isLoading.value = true;
        try {
            // Add time-bucket to query to bust browser cache every 3 seconds
            // This forces the browser to check the network/edge cache instead of its local cache
            const bucket = Math.floor(Date.now() / 3000); // Change URL every 3 seconds
            const data = await $fetch<{ results: ResultEntry[], date: string }>('/api/results', {
                query: { _t: bucket }
            });
            if (data) {
                // SMART LOGIC: If we recently wrote data (within 10s), DO NOT accept a list that is smaller/stale
                // This prevents the "disappearing data" bug caused by SWR cache
                const timeSinceWrite = Date.now() - lastWriteTime.value;
                const isWriting = timeSinceWrite < 10000; // 10 seconds protection

                if (isWriting && data.results.length < results.value.length) {
                    console.log("Ignoring stale cache update (Protected by Smart Logic)");
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
        // Initial fetch
        fetchResults(true);

        // Clear any existing interval
        if (pollingInterval.value) clearInterval(pollingInterval.value);

        // Start new interval
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
    const addResult = async (timeSlot: string, codes: Record<string, string>) => {
        try {
            const data = await $fetch<{ success: boolean, result: ResultEntry }>('/api/results/add', {
                method: 'POST',
                body: { timeSlot, ...codes },
            });



            // Manually update state (Optimistic update) to avoid hitting stale cache
            if (data && data.result) {
                lastWriteTime.value = Date.now(); // Mark this write timestamp
                results.value.push(data.result);
                // Sort results by time
                results.value.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                usedSlots.value.push(data.result.timeSlot);
            }

            return data;
        } catch (error: any) {
            throw new Error(error?.data?.message || error?.statusMessage || 'Failed to add result');
        }
    };

    // Delete a result
    const deleteResult = async (id: string) => {
        try {
            await $fetch(`/api/results/delete/${id}`, {
                method: 'DELETE',
            });
            // Refresh results
            await fetchResults(false);
        } catch (error: any) {
            throw new Error(error?.data?.message || error?.statusMessage || 'Failed to delete result');
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
