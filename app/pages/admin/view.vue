<template>
  <div class="admin-container">
    <AdminTopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="admin-content">
      <AdminSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1>View Results</h1>
            <p class="subtitle">Manage and delete published answers</p>
          </div>
          <div class="header-actions">
            <NuxtLink to="/admin/add" class="add-btn">+ Add New Result</NuxtLink>
            <NuxtLink to="/" class="view-board-btn" target="_blank">View Live Board ↗</NuxtLink>
          </div>
        </div>

        <!-- Date filter selector -->
        <div class="filter-card">
          <div class="date-filter-group">
            <label for="viewDate">Select Date:</label>
            <input
              id="viewDate"
              v-model="selectedDate"
              type="date"
              class="date-input"
              @change="handleDateChange"
            />
            <button type="button" class="refresh-btn" @click="handleDateChange" :disabled="isLoading">
              {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
          <div class="summary-badge">
            Showing {{ sortedResults.length }} result(s) for {{ formatDisplayDate(selectedDate) }}
          </div>
        </div>

        <!-- Success & Error feedback banners -->
        <div v-if="successMsg" class="success-message">
          {{ successMsg }}
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="table-card">
          <table class="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Date</th>
                <th>Timeslot</th>
                <th>RA</th>
                <th>RB</th>
                <th>RC</th>
                <th>RD</th>
                <th>RE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="9" class="loading-cell">Loading results...</td>
              </tr>
              <tr v-else-if="sortedResults.length === 0">
                <td colspan="9" class="empty-cell">
                  No results published for {{ formatDisplayDate(selectedDate) }}
                </td>
              </tr>
              <tr v-for="(result, index) in sortedResults" :key="result.id">
                <td class="index-cell">{{ index + 1 }}</td>
                <td class="action-cell">
                  <!-- Inline Iframe-Safe Delete Confirmation -->
                  <div v-if="confirmingId === result.id" class="confirm-box">
                    <button
                      class="btn-confirm-delete"
                      @click="executeDelete(result.id, result.displayTime)"
                      :disabled="deletingId === result.id"
                    >
                      {{ deletingId === result.id ? 'Deleting...' : 'Confirm' }}
                    </button>
                    <button
                      class="btn-cancel-delete"
                      @click="confirmingId = null"
                      :disabled="deletingId === result.id"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    v-else
                    class="delete-btn"
                    @click="confirmingId = result.id"
                  >
                    Delete
                  </button>
                </td>
                <td>{{ formatDate(result.date) }}</td>
                <td>{{ result.displayTime }}</td>
                <!-- Cleaned Code Formats: Never duplicate prefixes like RARA34 -->
                <td class="code-val">{{ formatCode('RA', result.RA) }}</td>
                <td class="code-val">{{ formatCode('RB', result.RB) }}</td>
                <td class="code-val">{{ formatCode('RC', result.RC) }}</td>
                <td class="code-val">{{ formatCode('RD', result.RD) }}</td>
                <td class="code-val">{{ formatCode('RE', result.RE) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTodayIST } from '../../utils/timeSlots';

definePageMeta({
  middleware: 'auth',
});

const { results, isLoading, fetchResults, deleteResult, currentDate } = useResults();

const sidebarOpen = ref(false);
const confirmingId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const error = ref('');
const successMsg = ref('');

const selectedDate = ref(getTodayIST());

// Helper to guarantee clean RAxx without repeats like RARA34
const formatCode = (code: string, val: string | undefined | null): string => {
  if (!val) return '';
  const clean = String(val).trim().toUpperCase();
  // Strip any leading code letters (handles "RARA34", "RA34", or "34")
  const digits = clean.replace(/^[A-Z]+/i, '');
  return `${code}${digits}`;
};

// Format date for display in table (DD-MM-YYYY)
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Sort results chronologically by timeSlot
const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
});

// Load results for selected date
const handleDateChange = async () => {
  error.value = '';
  successMsg.value = '';
  confirmingId.value = null;

  try {
    const bucket = Math.floor(Date.now() / 2000);
    const data = await $fetch<{ results: any[]; date: string }>('/api/results', {
      query: {
        date: selectedDate.value,
        _t: bucket,
      },
    });

    if (data && Array.isArray(data.results)) {
      results.value = data.results;
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'Failed to load results';
  }
};

onMounted(async () => {
  await fetchResults(false);
  if (currentDate.value) {
    selectedDate.value = currentDate.value;
  }
});

// Iframe-safe delete action
const executeDelete = async (id: string, slotTime: string) => {
  error.value = '';
  successMsg.value = '';
  deletingId.value = id;

  try {
    await deleteResult(id);
    successMsg.value = `Result for ${slotTime || 'slot'} deleted successfully!`;
    confirmingId.value = null;
  } catch (e: any) {
    error.value = e.message || 'Failed to delete result';
  } finally {
    deletingId.value = null;
  }
};
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #0f1115;
}

.admin-content {
  display: flex;
}

.main-content {
  flex: 1;
  padding: 24px 32px;
  overflow-x: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #f9fafb;
  margin: 0;
}

.subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.add-btn {
  background: #0000c8;
  color: #ffff00;
  border: 1px solid #ffff00;
  padding: 7px 14px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #1a1aff;
}

.view-board-btn {
  color: #60a5fa;
  text-decoration: none;
  font-size: 13px;
  padding: 7px 12px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 4px;
  transition: all 0.2s;
}

.view-board-btn:hover {
  background: rgba(96, 165, 250, 0.1);
}

.filter-card {
  background: #161a22;
  border: 1px solid #222836;
  border-radius: 6px;
  padding: 12px 18px;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.date-filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
}

.date-input {
  background: #0d1117;
  color: #f3f4f6;
  border: 1px solid #2a3142;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
}

.refresh-btn {
  background: #2a3142;
  color: #f3f4f6;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.refresh-btn:hover:not(:disabled) {
  background: #374151;
}

.summary-badge {
  font-size: 13px;
  color: #9ca3af;
}

.table-card {
  background: #161a22;
  border: 1px solid #222836;
  border-radius: 6px;
  overflow-x: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.results-table th {
  background: #8b0000;
  color: white;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-right: 1px solid #6b0000;
}

.results-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #222836;
  color: #e5e7eb;
  white-space: nowrap;
}

.results-table tbody tr:hover {
  background: #1c2230;
}

.index-cell {
  color: #9ca3af;
  font-weight: 600;
}

.action-cell {
  min-width: 130px;
}

.code-val {
  color: #38bdf8;
  font-weight: 700;
}

/* Delete Action Buttons */
.delete-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  transition: all 0.15s;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

.confirm-box {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-confirm-delete {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-confirm-delete:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-cancel-delete {
  background: #4b5563;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-cancel-delete:hover:not(:disabled) {
  background: #6b7280;
}

.loading-cell,
.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 30px !important;
}

.error-message {
  color: #f87171;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
}

.success-message {
  color: #4ade80;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px 14px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px 12px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .header-actions {
    width: 100%;
  }
  .filter-card {
    flex-direction: column;
    align-items: stretch;
  }
  .date-filter-group {
    width: 100%;
  }
  .date-input {
    flex: 1;
  }
  .results-table {
    min-width: 580px;
  }
}
</style>
