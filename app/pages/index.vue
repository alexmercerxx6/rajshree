<template>
  <div class="results-page">
    <table width="1000">
      <tbody>
        <tr>
          <td>
            <div style="float:left;width:400px"></div>
            <div align="center">
              <span class="page-title">Show Answers</span>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <table width="1000" border="0" align="center" cellpadding="0" cellspacing="0">
              <tbody>
                <tr>
                  <td height="90" align="center" valign="middle">
                    <span class="style12">
                      <table>
                        <tbody>
                          <tr>
                            <td>Start Date :</td>
                            <td>
                              <input type="text" v-model="startDate" maxlength="25" size="25" placeholder="YYYY-MM-DD" class="date-text-input" />
                            </td>
                            <td>
                              <input type="date" ref="startDatePicker" v-model="startDate" class="hidden-date-picker" />
                              <a href="#" @click.prevent="openStartPicker"><img src="/img/cal.gif" width="16" height="16" border="0" /></a>
                            </td>
                            <td>End Date :</td>
                            <td>
                              <input type="text" v-model="endDate" maxlength="25" size="25" placeholder="YYYY-MM-DD" class="date-text-input" />
                            </td>
                            <td>
                              <input type="date" ref="endDatePicker" v-model="endDate" class="hidden-date-picker" />
                              <a href="#" @click.prevent="openEndPicker"><img src="/img/cal.gif" width="16" height="16" border="0" /></a>
                            </td>
                            <td>
                              <input type="image" src="/img/go.gif" @click.prevent="handleSearch" :disabled="isSearching" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td id="summary" class="date-summary">
                    {{ searchMode ? `Results from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}` : `Date: ${formattedDisplayDate} ${currentTime}` }}
                  </td>
                </tr>
                <tr>
                  <td>
                    <div id="divResult" style="margin-top:30px">
                      <table
                        width="1000"
                        border="0"
                        cellspacing="2"
                        cellpadding="1"
                        style="border:1px solid #FFF;border-collapse:collapse"
                        align="left"
                      >
                        <tbody>
                          <!-- Header Row -->
                          <tr align="center" valign="middle">
                            <th height="25" style="border:1px solid #FFF">
                              <span class="style6">Date</span>
                            </th>
                            <th style="border:1px solid #FFF"><span class="style6">Time</span></th>
                            <th v-for="code in RESULT_CODES" :key="code" style="border:1px solid #FFF">
                              <span class="style6">{{ code }}</span>
                            </th>
                          </tr>

                          <!-- Loading -->
                          <tr v-if="isLoading || isSearching" align="center" valign="middle">
                            <td class="resluttd" colspan="12">
                              <span class="style22">Loading...</span>
                            </td>
                          </tr>

                          <!-- Search Results Mode -->
                          <template v-else-if="searchMode && searchResults.length > 0">
                            <tr
                              v-for="result in searchResults"
                              :key="result.id"
                              align="center"
                              valign="middle"
                            >
                              <td class="resluttd" width="90px">
                                <span class="style22">{{ result.date }}</span>
                              </td>
                              <td class="resluttd" width="80px">
                                <span class="style222">{{ result.displayTime }}</span>
                              </td>
                              <td v-for="code in RESULT_CODES" :key="code" class="resluttd" width="70px">
                                <span class="style222">{{ code }}{{ result[code] }}</span>
                              </td>
                            </tr>
                          </template>

                          <!-- Today's Results Mode -->
                          <template v-else-if="!searchMode">
                            <tr
                              v-for="slot in allSlotsWithData"
                              :key="slot.value"
                              align="center"
                              valign="middle"
                            >
                              <td class="resluttd" width="90px">
                                <span class="style22">{{ formattedDate }}</span>
                              </td>
                              <td class="resluttd" width="80px">
                                <span class="style222">{{ slot.display }}</span>
                              </td>
                              <td v-for="code in RESULT_CODES" :key="code" class="resluttd" width="70px">
                                <span class="style222">
                                  {{ slot.data ? `${code}${slot.data[code]}` : '' }}
                                </span>
                              </td>
                            </tr>
                          </template>

                          <!-- No Results -->
                          <tr v-else align="center" valign="middle">
                            <td class="resluttd" colspan="12">
                              <span class="style22">No results found</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="disclaimer-marquee">
      <p class="scrolling-text">
        This website is intended strictly for entertainment purposes only. Any misuse of the content or involvement in
        illegal usage is prohibited. We are not responsible for any unlawful use or consequences arising from such
        misuse.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ALL_TIME_SLOTS, RESULT_CODES, type ResultEntry } from '../utils/timeSlots';

const { results, isLoading, fetchResults, currentDate, startPolling, stopPolling } = useResults();

// Date picker refs
const startDatePicker = ref<HTMLInputElement | null>(null);
const endDatePicker = ref<HTMLInputElement | null>(null);

// Search state
const startDate = ref('');
const endDate = ref('');
const searchMode = ref(false);
const isSearching = ref(false);
const searchResults = ref<ResultEntry[]>([]);

// Current time state
const currentTime = ref('');
let timeInterval: ReturnType<typeof setInterval> | null = null;

// Format time in 12-hour format with seconds and AM/PM
const updateCurrentTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Open date pickers
const openStartPicker = () => {
  startDatePicker.value?.showPicker();
};
const openEndPicker = () => {
  endDatePicker.value?.showPicker();
};

// Formatted date for display (YYYY-MM-DD)
const formattedDate = computed(() => currentDate.value);

// Formatted date for the summary line
const formattedDisplayDate = computed(() => {
  if (!currentDate.value) return '';
  const date = new Date(currentDate.value);
  return date.toDateString();
});

// Format date for display
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toDateString();
};

// Map all time slots with their data (or null if no data)
const allSlotsWithData = computed(() => {
  const resultMap = new Map<string, ResultEntry>();
  for (const result of results.value) {
    resultMap.set(result.timeSlot, result);
  }

  return ALL_TIME_SLOTS.map(slot => ({
    ...slot,
    data: resultMap.get(slot.value) || null,
  }));
});

// Start polling on mount
onMounted(() => {
  startPolling();
  updateCurrentTime(); // Set initial time immediately
  timeInterval = setInterval(updateCurrentTime, 1000);
});

// Stop polling on unmount
onUnmounted(() => {
  stopPolling();
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
});

// Search handler
const handleSearch = async () => {
  if (!startDate.value || !endDate.value) return;
  
  isSearching.value = true;
  searchMode.value = true;
  
  try {
    const data = await $fetch('/api/archive', {
      query: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    searchResults.value = data.results;
  } catch (error) {
    console.error('Search failed:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};
</script>

<style>
/* Global styles matching the reference HTML */
body {
  margin-top: 0px;
  background-color: #EFF20C;
}
</style>

<style scoped>
.results-page {
  font-family: Verdana, sans-serif;
}

.page-title {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 20px;
  font-weight: bold;
  color: #000000;
  text-align: center;
}

.date-summary {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  font-weight: bold;
  color: #000000;
  text-align: center;
}

.style6 {
  font-family: Verdana;
  font-size: 17px;
  font-weight: bold;
}

.style12 {
  font-family: Verdana;
  font-size: 14px;
  color: #000000;
  font-weight: bold;
}

.style22 {
  font-family: Verdana;
  font-size: 12px;
  color: #FFFFFF;
}

.style222 {
  font-family: Verdana;
  font-size: 12px;
  color: #FFFF00;
}

.resluttd {
  border-color: #FFF;
  border-style: solid;
  border-width: 0 1px 1px 1px !important;
  color: #000000;
  height: 35px;
  padding: 5px 0 5px 12px;
  font-size: 16px;
  background: #080100;
  font-weight: bold;
}

th {
  background: none repeat scroll 0 0 #AC1221;
  color: #FFFFFF;
}

.date-text-input {
  padding: 3px 5px;
  border: 1px solid #000;
  font-size: 14px;
  width: 180px;
}

.hidden-date-picker {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.go-btn {
  padding: 6px 20px;
  background: #AC1221;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
}

.go-btn:hover:not(:disabled) {
  background: #8a0e1a;
}

.go-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.disclaimer-marquee {
  font-family: Arial, Helvetica, sans-serif;
  color: red;
  background-color: #ffe0e0;
  font-weight: bold;
  font-size: 18px;
  padding: 7px;
  width: 1000px;
  overflow: hidden;
  white-space: nowrap;
}

.scrolling-text {
  display: inline-block;
  padding-left: 100%;
  animation: scroll-left 20s linear infinite;
  margin: 0;
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
