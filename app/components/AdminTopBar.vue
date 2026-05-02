<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="menu-btn" @click="$emit('toggleSidebar')" aria-label="Toggle menu">
        ☰
      </button>
      <div class="welcome">Welcome admin</div>
    </div>
    <div class="topbar-actions">
     
      <!-- User Menu -->
      <div class="user-menu">
        <button class="user-btn" @click="toggleMenu">
          <span class="user-icon">👤</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div v-if="showMenu" class="dropdown-menu">
          <button @click="handleLogout" class="dropdown-item">Signout</button>
        </div>
      </div>
    </div>

    <!-- Archive Confirmation Modal -->
    <div v-if="showArchiveConfirm" class="modal-overlay" @click.self="showArchiveConfirm = false">
      <div class="modal-card">
        <div class="modal-header">⚠️ Archive Confirmation</div>
        <div class="modal-body">
          <p>Are you sure you want to archive today's results?</p>
          <p class="modal-warning">This action requires all 42 time slots to be filled and cannot be undone.</p>
          <div v-if="archiveError" class="error-message">{{ archiveError }}</div>
          <div v-if="archiveSuccess" class="success-message">{{ archiveSuccess }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeArchiveModal">Cancel</button>
          <button 
            class="btn-confirm" 
            @click="handleArchive" 
            :disabled="Boolean(isArchiving || archiveSuccess)"
          >
            {{ isArchiving ? 'Archiving...' : 'Yes, Archive' }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleSidebar: [];
}>();

const { logout } = useAuth();

const showMenu = ref(false);
const showArchiveConfirm = ref(false);
const isArchiving = ref(false);
const archiveError = ref('');
const archiveSuccess = ref('');

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const handleLogout = async () => {
  await logout();
};

const closeArchiveModal = () => {
  showArchiveConfirm.value = false;
  archiveError.value = '';
  archiveSuccess.value = '';
};

const handleArchive = async () => {
  archiveError.value = '';
  archiveSuccess.value = '';
  isArchiving.value = true;

  try {
    const response = await fetch('/api/archive/manual', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to archive');
    }
    archiveSuccess.value = data.message || 'Archive completed successfully!';
  } catch (e: any) {
    archiveError.value = e.data?.message || e.message || 'Failed to archive';
  } finally {
    isArchiving.value = false;
  }
};

// Close menu when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      showMenu.value = false;
    }
  });
});
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 0 20px;
  background: #337ab7;
  color: white;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.welcome {
  font-size: 14px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

@media (max-width: 768px) {
  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.archive-btn {
  padding: 6px 12px;
  background: #5cb85c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.archive-btn:hover:not(:disabled) {
  background: #449d44;
}

.archive-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
}

.user-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.user-icon {
  font-size: 16px;
}

.dropdown-arrow {
  font-size: 10px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 15px;
  text-align: left;
  background: none;
  border: none;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 15px 20px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: 20px;
  color: #333;
}

.modal-body p {
  margin: 0 0 10px;
}

.modal-warning {
  font-size: 13px;
  color: #856404;
  background: #fff3cd;
  padding: 10px;
  border-radius: 4px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-confirm {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm:hover:not(:disabled) {
  background: #c82333;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 13px;
  margin-top: 10px;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
}

.success-message {
  color: #155724;
  font-size: 13px;
  margin-top: 10px;
  padding: 10px;
  background: #d4edda;
  border-radius: 4px;
}
</style>

