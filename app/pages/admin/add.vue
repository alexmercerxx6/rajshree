<template>
  <div class="admin-container">
    <AdminTopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="admin-content">
      <AdminSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1>Publish Result</h1>
            <p class="subtitle">Enter new answers for un-published time slots</p>
          </div>
          <NuxtLink to="/" class="view-board-btn" target="_blank">View Live Board ↗</NuxtLink>
        </div>
        
        <div class="form-card">
          <form @submit.prevent="handleSubmit">
            <div class="form-row">
              <div class="form-label">Publish Date:</div>
              <div class="form-input">
                <input
                  v-model="publishDate"
                  type="date"
                  class="form-control"
                  :disabled="isSubmitting"
                  @change="handleDateChange"
                />
              </div>
            </div>

            <!-- Time slot dropdown excluding slots that already exist for the selected date -->
            <div class="form-row">
              <div class="form-label">
                Time Slot:
                <span class="slot-count" v-if="!isLoadingSlots">
                  ({{ availableSlots.length }} available)
                </span>
              </div>
              <div class="form-input">
                <select
                  v-model="selectedSlot"
                  class="form-control"
                  :disabled="isSubmitting || isLoadingSlots || availableSlots.length === 0"
                >
                  <option value="" disabled>
                    {{
                      isLoadingSlots
                        ? 'Checking slots...'
                        : availableSlots.length > 0
                        ? `Select Time Slot (${availableSlots.length} available)`
                        : 'All 35 slots already published for this date'
                    }}
                  </option>
                  <option
                    v-for="slot in availableSlots"
                    :key="slot.value"
                    :value="slot.value"
                  >
                    {{ slot.display }}
                  </option>
                </select>
                <div v-if="usedSlots.length > 0" class="used-slots-hint">
                  Already published: {{ usedSlots.length }} slot(s)
                </div>
              </div>
            </div>

            <!-- 5 Code inputs: RA, RB, RC, RD, RE -->
            <div v-for="code in RESULT_CODES" :key="code" class="form-row">
              <div class="form-label">{{ code }} Code:</div>
              <div class="form-input code-input-group">
                <span class="code-prefix">{{ code }}</span>
                <input
                  v-model="codes[code]"
                  type="text"
                  inputmode="numeric"
                  :placeholder="`e.g. 01 or 75`"
                  class="form-control code-control"
                  maxlength="2"
                  @input="restrictToNumbers($event, code)"
                  @keypress="onlyNumbers"
                  :disabled="isSubmitting || availableSlots.length === 0"
                />
              </div>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-if="success" class="success-message">{{ success }}</div>

            <div class="form-row">
              <div class="form-label"></div>
              <div class="form-input">
                <button
                  type="submit"
                  class="btn-submit"
                  :disabled="isSubmitting || !selectedSlot || availableSlots.length === 0"
                >
                  {{ isSubmitting ? 'PUBLISHING...' : 'PUBLISH ANSWERS' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ALL_TIME_SLOTS, RESULT_CODES, getTodayIST, type ResultCode } from '../../utils/timeSlots';

definePageMeta({
  middleware: 'auth',
});

const { fetchResults, addResult } = useResults();

const sidebarOpen = ref(false);

const publishDate = ref(getTodayIST());
const selectedSlot = ref('');
const usedSlots = ref<string[]>([]);
const isLoadingSlots = ref(false);

const codes = reactive<Record<ResultCode, string>>({
  RA: '',
  RB: '',
  RC: '',
  RD: '',
  RE: '',
});
const isSubmitting = ref(false);
const error = ref('');
const success = ref('');

// Filter out all time slots that already exist for publishDate
const availableSlots = computed(() => {
  return ALL_TIME_SLOTS.filter(slot => !usedSlots.value.includes(slot.value));
});

// Load existing slots for the given date
const loadSlotsForDate = async (date: string) => {
  if (!date) return;
  isLoadingSlots.value = true;
  try {
    const bucket = Math.floor(Date.now() / 2000);
    const data = await $fetch<{ usedSlots: string[] }>('/api/results/slots', {
      query: { date, _t: bucket },
    });
    usedSlots.value = data?.usedSlots || [];

    // Clear selection if the currently selected slot is already used
    if (selectedSlot.value && usedSlots.value.includes(selectedSlot.value)) {
      selectedSlot.value = '';
    }
  } catch (err) {
    console.error('Failed to load slots for date', err);
  } finally {
    isLoadingSlots.value = false;
  }
};

const handleDateChange = () => {
  error.value = '';
  success.value = '';
  loadSlotsForDate(publishDate.value);
};

// Restrict input to numbers only
const onlyNumbers = (event: KeyboardEvent) => {
  if (!/[0-9]/.test(event.key)) {
    event.preventDefault();
  }
};

const restrictToNumbers = (event: Event, code: ResultCode) => {
  const input = event.target as HTMLInputElement;
  const value = input.value.replace(/[^0-9]/g, '');
  codes[code] = value;
};

onMounted(async () => {
  await loadSlotsForDate(publishDate.value);
  await fetchResults(false);
});

const handleSubmit = async () => {
  error.value = '';
  success.value = '';

  if (!selectedSlot.value) {
    error.value = 'Please select a time slot';
    return;
  }

  // Validate all 5 codes: RA, RB, RC, RD, RE
  for (const code of RESULT_CODES) {
    if (!codes[code] || !/^\d{2}$/.test(codes[code])) {
      error.value = `${code} must be a 2-digit number (e.g. 01 or 75)`;
      return;
    }
  }

  isSubmitting.value = true;
  const slotPublished = selectedSlot.value;

  try {
    await addResult(selectedSlot.value, { ...codes }, publishDate.value);

    success.value = `Result for ${slotPublished} published successfully!`;
    
    // Reset form codes and selected slot
    selectedSlot.value = '';
    for (const code of RESULT_CODES) {
      codes[code] = '';
    }

    // Refresh used slots for this date immediately
    await loadSlotsForDate(publishDate.value);
    await fetchResults(false);
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.message || 'Failed to publish result';
  } finally {
    isSubmitting.value = false;
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
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 700px;
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

.view-board-btn {
  color: #60a5fa;
  text-decoration: none;
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 4px;
  transition: all 0.2s;
}

.view-board-btn:hover {
  background: rgba(96, 165, 250, 0.1);
}

.form-card {
  background: #161a22;
  border: 1px solid #222836;
  border-radius: 6px;
  padding: 24px;
  max-width: 700px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.form-label {
  width: 180px;
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  padding-top: 8px;
}

.slot-count {
  display: block;
  font-size: 11px;
  color: #60a5fa;
  font-weight: 500;
}

.form-input {
  flex: 1;
  max-width: 300px;
}

.used-slots-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 5px;
}

.code-input-group {
  display: flex;
  align-items: center;
}

.code-prefix {
  background: #2a3142;
  color: #fbbf24;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid #2a3142;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.code-control {
  border-radius: 0 4px 4px 0 !important;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  background: #0d1117;
  color: #f3f4f6;
  border: 1px solid #2a3142;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-submit {
  padding: 10px 24px;
  background-color: #0000c8;
  color: #ffff00;
  font-weight: 700;
  border: 1px solid #ffff00;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #1a1aff;
  box-shadow: 0 0 10px rgba(255, 255, 0, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  .form-card {
    padding: 18px 14px;
  }
  .form-row {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    margin-bottom: 14px;
  }
  .form-label {
    width: 100%;
    padding-top: 0;
  }
  .form-input {
    max-width: 100%;
    width: 100%;
  }
  .btn-submit {
    width: 100%;
    padding: 12px;
  }
}
</style>
