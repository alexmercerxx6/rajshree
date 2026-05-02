<template>
  <div class="admin-container">
    <AdminTopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="admin-content">
      <AdminSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="main-content">
        <h1>Add Result</h1>
        
        <div class="form-card">
          <form @submit.prevent="handleSubmit">
            <div class="form-row">
              <div class="form-label">Today Date: {{ formattedDate }}</div>
              <div class="form-input">
                <select v-model="selectedSlot" class="form-control" :disabled="isSubmitting">
                  <option value="">Select Time</option>
                  <option v-for="slot in availableSlots" :key="slot.value" :value="slot.value">
                    {{ slot.display }}
                  </option>
                </select>
              </div>
            </div>

            <div v-for="code in RESULT_CODES" :key="code" class="form-row">
              <div class="form-label">{{ code }}</div>
              <div class="form-input">
                <input
                  v-model="codes[code]"
                  type="text"
                  inputmode="numeric"
                  :placeholder="`${code} VALUE`"
                  class="form-control"
                  maxlength="2"
                  @input="restrictToNumbers($event, code)"
                  @keypress="onlyNumbers"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-if="success" class="success-message">{{ success }}</div>

            <div class="form-row">
              <div class="form-label"></div>
              <div class="form-input">
                <button type="submit" class="btn-submit" :disabled="isSubmitting || !selectedSlot">
                  {{ isSubmitting ? 'SUBMITTING...' : 'SUBMIT' }}
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
import { RESULT_CODES, type ResultCode } from '../../utils/timeSlots';

definePageMeta({
  middleware: 'auth',
});

const { availableSlots, fetchResults, addResult, currentDate } = useResults();

const sidebarOpen = ref(false);

const selectedSlot = ref('');
const codes = reactive<Record<ResultCode, string>>({
  XA: '', XB: '', XC: '', XD: '', XE: '',
  XF: '', XG: '', XH: '', XI: '', XJ: '',
});
const isSubmitting = ref(false);
const error = ref('');
const success = ref('');

// Restrict input to numbers only
const onlyNumbers = (event: KeyboardEvent) => {
  if (!/[0-9]/.test(event.key)) {
    event.preventDefault();
  }
};

const restrictToNumbers = (event: Event, code: string) => {
  const input = event.target as HTMLInputElement;
  const value = input.value.replace(/[^0-9]/g, '');
  codes[code as keyof typeof codes] = value;
};

// Format today's date
const formattedDate = computed(() => {
  if (!currentDate.value) return '';
  const [year, month, day] = currentDate.value.split('-');
  return `${day}-${month}-${year}`;
});

// Fetch results on mount
onMounted(async () => {
  await fetchResults(false);
});

const handleSubmit = async () => {
  error.value = '';
  success.value = '';

  // Validate all codes
  for (const code of RESULT_CODES) {
    if (!codes[code] || !/^\d{2}$/.test(codes[code])) {
      error.value = `${code} must be a 2-digit number`;
      return;
    }
  }

  isSubmitting.value = true;
  try {
    await addResult(selectedSlot.value, { ...codes });
    success.value = 'Result added successfully!';
    
    // Reset form
    selectedSlot.value = '';
    for (const code of RESULT_CODES) {
      codes[code] = '';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to add result';
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
  padding: 20px 30px;
}

.main-content h1 {
  font-size: 24px;
  font-weight: normal;
  color: #f9fafb;
  margin-bottom: 20px;
}

.form-card {
  background: #161a22;
  border: 1px solid #222836;
  border-radius: 4px;
  padding: 20px;
  max-width: 700px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.form-label {
  width: 200px;
  font-size: 14px;
  font-weight: bold;
  color: #9ca3af;
}

.form-input {
  flex: 1;
  max-width: 250px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #2a3142;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #66afe9;
}

.btn-submit {
  padding: 8px 20px;
  background-color: #337ab7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-transform: uppercase;
}

.btn-submit:hover:not(:disabled) {
  background-color: #286090;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
}

.success-message {
  color: #155724;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px;
  background: #d4edda;
  border-radius: 4px;
}
</style>
