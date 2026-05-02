<template>
  <div class="admin-container">
    <AdminTopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="admin-content">
      <AdminSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="main-content">
        <h1>View Result</h1>
        
        <div class="table-card">
          <table class="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Date</th>
                <th>Timeslot</th>
                <th>XA</th>
                <th>XB</th>
                <th>XC</th>
                <th>XD</th>
                <th>XE</th>
                <th>XF</th>
                <th>XG</th>
                <th>XH</th>
                <th>XI</th>
                <th>XJ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="14" class="loading-cell">Loading...</td>
              </tr>
              <tr v-else-if="results.length === 0">
                <td colspan="14" class="empty-cell">No results for today</td>
              </tr>
              <tr v-for="(result, index) in sortedResults" :key="result.id">
                <td class="index-cell">{{ index + 1 }}</td>
                <td>
                  <button 
                    class="delete-link" 
                    @click="handleDelete(result.id)"
                    :disabled="deletingId === result.id"
                  >
                    {{ deletingId === result.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </td>
                <td>{{ formatDate(result.date) }}</td>
                <td>{{ result.displayTime }}</td>
                <td>{{ result.XA }}</td>
                <td>{{ result.XB }}</td>
                <td>{{ result.XC }}</td>
                <td>{{ result.XD }}</td>
                <td>{{ result.XE }}</td>
                <td>{{ result.XF }}</td>
                <td>{{ result.XG }}</td>
                <td>{{ result.XH }}</td>
                <td>{{ result.XI }}</td>
                <td>{{ result.XJ }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

const { results, isLoading, fetchResults, deleteResult } = useResults();

const sidebarOpen = ref(false);
const deletingId = ref<string | null>(null);
const error = ref('');

// Sort results by time slot (latest first)
const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => b.timeSlot.localeCompare(a.timeSlot));
});

// Format date for display
const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

// Fetch results on mount
onMounted(async () => {
  await fetchResults(false);
});

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this result?')) {
    return;
  }

  error.value = '';
  deletingId.value = id;

  try {
    await deleteResult(id);
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
  background: #f5f5f5;
}

.admin-content {
  display: flex;
}

.main-content {
  flex: 1;
  padding: 20px 30px;
  overflow-x: auto;
}

.main-content h1 {
  font-size: 24px;
  font-weight: normal;
  color: #333;
  margin-bottom: 20px;
}

.table-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.results-table th {
  background: #337ab7;
  color: white;
  padding: 10px 12px;
  text-align: left;
  font-weight: normal;
  white-space: nowrap;
}

.results-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ddd;
  white-space: nowrap;
}

.results-table tbody tr:hover {
  background: #f9f9f9;
}

.index-cell {
  color: #337ab7;
  font-weight: bold;
}

.delete-link {
  background: none;
  border: none;
  color: #c9302c;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
}

.delete-link:hover:not(:disabled) {
  color: #a02622;
}

.delete-link:disabled {
  color: #999;
  cursor: not-allowed;
}

.loading-cell,
.empty-cell {
  text-align: center;
  color: #666;
  padding: 30px !important;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 15px;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
}
</style>
