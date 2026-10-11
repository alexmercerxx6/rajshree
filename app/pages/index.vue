<template>
  <div class="math-board-wrapper">
    <!-- Top Ribbon Banner with Learn Raj's Maths -->
    <header class="header-section">
      <div class="ribbon-container">
        <svg viewBox="0 0 850 115" class="ribbon-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <!-- Ribbon Shape matching logorajs2.png -->
          <path
            d="
              M 110 5
              Q 425 20 740 5
              L 850 36
              L 745 57
              L 850 78
              L 740 110
              Q 425 125 110 110
              L 0 78
              L 105 57
              L 0 36
              Z
            "
            fill="#0000C8"
          />

          <!-- 3D Navy Shadow Text Layer -->
          <text
            x="429"
            y="67"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#00005a"
            font-size="52"
            font-weight="900"
            font-family="'Arial Black', Arial, 'Segoe UI', system-ui, sans-serif"
            letter-spacing="0.5px"
          >
            Learn Raj's Maths
          </text>

          <!-- Foreground Bright Yellow Text -->
          <text
            x="425"
            y="63"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#FFFF00"
            font-size="52"
            font-weight="900"
            font-family="'Arial Black', Arial, 'Segoe UI', system-ui, sans-serif"
            letter-spacing="0.5px"
          >
            Learn Raj's Maths
          </text>
        </svg>
      </div>

      <!-- Subtitle ANSWERS -->
      <div class="subtitle-answers">ANSWERS</div>

      <!-- Action Navigation Buttons: HOME & PREVIOUS ANSWERS -->
      <nav class="nav-buttons">
        <button
          type="button"
          class="nav-btn"
          :class="{ active: !showArchivePicker && !searchMode }"
          @click="showHome"
        >
          HOME
        </button>
        <button
          type="button"
          class="nav-btn"
          :class="{ active: showArchivePicker || searchMode }"
          @click="toggleArchivePicker"
        >
          PREVIOUS ANSWERS
        </button>
      </nav>

      <!-- Date Range Filter when in Previous Answers Mode -->
      <div v-if="showArchivePicker" class="archive-bar">
        <div class="archive-inputs">
          <label>
            <span>Start Date:</span>
            <input type="date" v-model="startDate" class="date-input" />
          </label>
          <label>
            <span>End Date:</span>
            <input type="date" v-model="endDate" class="date-input" />
          </label>
          <button
            type="button"
            class="filter-submit-btn"
            @click="handleSearch"
            :disabled="isSearching || !startDate || !endDate"
          >
            {{ isSearching ? 'SEARCHING...' : 'SHOW ANSWERS' }}
          </button>
          <button
            v-if="searchMode"
            type="button"
            class="filter-clear-btn"
            @click="clearSearch"
          >
            BACK TO TODAY
          </button>
        </div>
      </div>
    </header>

    <!-- Main Table Section -->
    <main class="table-container">
      <table class="answers-table">
        <thead>
          <tr>
            <th class="col-date">DATE</th>
            <th class="col-time">TIME</th>
            <th class="col-code">RA</th>
            <th class="col-code">RB</th>
            <th class="col-code">RC</th>
            <th class="col-code">RD</th>
            <th class="col-code">RE</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading State -->
          <tr v-if="isLoading && displayedResults.length === 0">
            <td colspan="7" class="status-cell">Loading answers...</td>
          </tr>

          <!-- Results Rows -->
          <tr v-for="row in displayedResults" :key="row.id || row.timeSlot">
            <td class="cell-date">{{ row.dateFormatted }}</td>
            <td class="cell-time">{{ row.displayTime }}</td>
            <td class="cell-val">{{ formatValue('RA', row.RA) }}</td>
            <td class="cell-val">{{ formatValue('RB', row.RB) }}</td>
            <td class="cell-val">{{ formatValue('RC', row.RC) }}</td>
            <td class="cell-val">{{ formatValue('RD', row.RD) }}</td>
            <td class="cell-val">{{ formatValue('RE', row.RE) }}</td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!isLoading && displayedResults.length === 0">
            <td colspan="7" class="status-cell">No answers found for selected period</td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- Disclaimer Marquee Footer matching photo -->
    <footer class="marquee-footer">
      <div class="marquee-track">
        <div class="marquee-text">
          This website is intended strictly for entertainment purposes only. Any misuse of the content or involvement in illegal usage is prohibited. We are not responsible for any unlawful use or consequences arising from such misuse.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  RESULT_CODES,
  formatDDMMYYYY,
  getSlotDisplay,
  type ResultEntry,
} from '../utils/timeSlots';

const {
  results,
  isLoading,
  currentDate,
  fetchResults,
  startPolling,
  stopPolling,
} = useResults();

// Archive search state
const showArchivePicker = ref(false);
const searchMode = ref(false);
const isSearching = ref(false);
const startDate = ref('');
const endDate = ref('');
const archiveResults = ref<ResultEntry[]>([]);

// Fetch results immediately during SSR and client navigation
await fetchResults(true);

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

// Helper to format values cleanly as RA75, RB01, etc.
const formatValue = (code: string, val: string | undefined): string => {
  if (!val) return '';
  const clean = String(val).trim().toUpperCase();
  const digits = clean.replace(/^[A-Z]+/i, '');
  return `${code}${digits}`;
};

// Toggle archive picker
const toggleArchivePicker = () => {
  showArchivePicker.value = !showArchivePicker.value;
  if (!showArchivePicker.value && searchMode.value) {
    clearSearch();
  }
};

const showHome = () => {
  showArchivePicker.value = false;
  searchMode.value = false;
  fetchResults(false);
};

// Search historical answers
const handleSearch = async () => {
  if (!startDate.value || !endDate.value) return;

  isSearching.value = true;
  searchMode.value = true;

  try {
    const data = await $fetch<{ results: ResultEntry[] }>('/api/archive', {
      query: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    if (data && data.results) {
      archiveResults.value = data.results;
    }
  } catch (err) {
    console.error('Failed to fetch previous answers:', err);
  } finally {
    isSearching.value = false;
  }
};

const clearSearch = () => {
  searchMode.value = false;
  archiveResults.value = [];
  startDate.value = '';
  endDate.value = '';
};

// Formatted results list to display
const displayedResults = computed(() => {
  const source = searchMode.value ? archiveResults.value : results.value;

  return source.map((item) => ({
    ...item,
    dateFormatted: formatDDMMYYYY(item.date),
    displayTime: item.displayTime || getSlotDisplay(item.timeSlot),
  }));
});
</script>

<style scoped>
/* Page container matching image.png */
.math-board-wrapper {
  min-height: 100vh;
  background-color: #5d6673;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 40px 20px;
  box-sizing: border-box;
}

/* Header section */
.header-section {
  width: 100%;
  max-width: 1350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

/* Ribbon Banner */
.ribbon-container {
  width: 100%;
  max-width: 760px;
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.ribbon-svg {
  width: 100%;
  height: auto;
  max-height: 120px;
  display: block;
}

/* Subtitle ANSWERS */
.subtitle-answers {
  color: #ffff00;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-top: 6px;
  margin-bottom: 16px;
  text-align: center;
}

/* Action Navigation Buttons */
.nav-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 8px;
}

.nav-btn {
  background-color: #ffffff;
  color: #4b5563;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  padding: 7px 22px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 0.15s ease;
}

.nav-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.nav-btn.active {
  background-color: #ffffff;
  color: #1f2937;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Previous answers date filter panel */
.archive-bar {
  margin-top: 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px 18px;
  display: flex;
  justify-content: center;
  max-width: 100%;
  box-sizing: border-box;
}

.archive-inputs {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.archive-inputs label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
}

.date-input {
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
}

.filter-submit-btn {
  background: #0000c8;
  color: #ffff00;
  border: 1px solid #ffff00;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.filter-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-clear-btn {
  background: #4b5563;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Table Section */
.table-container {
  width: 100%;
  max-width: 1350px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.answers-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #0000c8;
}

/* Table Header */
.answers-table thead tr {
  background-color: #8b0000;
}

.answers-table th {
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: left;
  padding: 11px 14px;
  border-right: 1px solid #700000;
  white-space: nowrap;
}

.answers-table th:last-child {
  border-right: none;
}

.col-date {
  width: 14%;
  min-width: 95px;
}

.col-time {
  width: 14%;
  min-width: 85px;
}

.col-code {
  width: 14.4%;
  min-width: 60px;
}

/* Table Body */
.answers-table tbody tr {
  background-color: #0000c8;
}

.answers-table td {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  border: 1px solid #ffff00;
}

.cell-date,
.cell-time,
.cell-val {
  color: #67e8f9;
  letter-spacing: 0.3px;
}

.status-cell {
  text-align: center;
  color: #ffff00;
  padding: 28px !important;
  font-size: 14px;
}

/* Disclaimer Marquee Footer matching photo */
.marquee-footer {
  width: 100%;
  max-width: 1350px;
  margin-top: 24px;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.marquee-track {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

.marquee-text {
  display: inline-block;
  white-space: nowrap;
  color: #ff0000;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 0;
  letter-spacing: 0.2px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.4;
  animation: marquee-scroll 24s linear infinite;
  will-change: transform;
}

.marquee-text:hover {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* Tablet Responsive adjustments */
@media (max-width: 768px) {
  .math-board-wrapper {
    padding: 14px 8px 30px 8px;
  }

  .header-section {
    margin-bottom: 16px;
  }

  .ribbon-svg {
    max-height: 95px;
  }

  .subtitle-answers {
    font-size: 12px;
    margin-top: 4px;
    margin-bottom: 12px;
  }

  .nav-buttons {
    gap: 8px;
  }

  .nav-btn {
    padding: 6px 16px;
    font-size: 11px;
  }

  .archive-bar {
    padding: 10px 12px;
    width: 100%;
  }

  .archive-inputs {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .archive-inputs label {
    width: 100%;
    justify-content: space-between;
  }

  .filter-submit-btn,
  .filter-clear-btn {
    width: 100%;
    padding: 8px;
  }

  .answers-table th {
    padding: 8px 5px;
    font-size: 11.5px;
    text-align: center;
  }

  .answers-table td {
    padding: 8px 5px;
    font-size: 12px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .col-date, .cell-date {
    width: auto;
    min-width: 80px;
  }

  .col-time, .cell-time {
    width: auto;
    min-width: 68px;
  }

  .col-code, .cell-val {
    width: auto;
    min-width: 44px;
  }

  .marquee-footer {
    margin-top: 18px;
  }

  .marquee-text {
    font-size: 12.5px;
    padding: 6px 0;
  }
}

/* Mobile Screen adjustments (Phones under 480px) */
@media (max-width: 480px) {
  .math-board-wrapper {
    padding: 10px 4px 24px 4px;
  }

  .header-section {
    margin-bottom: 12px;
  }

  .ribbon-container {
    padding: 0;
  }

  .ribbon-svg {
    max-height: 80px;
  }

  .subtitle-answers {
    font-size: 11px;
    margin-top: 2px;
    margin-bottom: 10px;
  }

  .nav-buttons {
    gap: 6px;
  }

  .nav-btn {
    padding: 5px 12px;
    font-size: 10px;
  }

  .table-container {
    border-radius: 4px;
  }

  .answers-table {
    min-width: 350px;
  }

  .answers-table th {
    padding: 6px 3px;
    font-size: 10.5px;
    text-align: center;
  }

  .answers-table td {
    padding: 6px 3px;
    font-size: 11px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .col-date, .cell-date {
    min-width: 72px;
  }

  .col-time, .cell-time {
    min-width: 60px;
  }

  .col-code, .cell-val {
    min-width: 38px;
  }

  .marquee-footer {
    margin-top: 14px;
    border-radius: 4px;
  }

  .marquee-text {
    font-size: 11.5px;
    padding: 5px 0;
  }
}
</style>
