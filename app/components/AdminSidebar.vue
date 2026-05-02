<template>
  <!-- Mobile overlay -->
  <div 
    v-if="isOpen" 
    class="sidebar-overlay" 
    @click="$emit('close')"
  ></div>
  
  <nav class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-header">
      <div class="logo">
        <img src="/favicon.ico" alt="Logo" class="logo-img" />
      </div>
      <button class="close-btn" @click="$emit('close')" aria-label="Close sidebar">
        ✕
      </button>
    </div>
    <ul class="nav-list">
      <li>
        <NuxtLink 
          to="/admin/add" 
          class="nav-link" 
          :class="{ active: route.path === '/admin/add' }"
          @click="$emit('close')"
        >
          <span class="icon">📝</span>
          Add Result
        </NuxtLink>
      </li>
      <li>
        <NuxtLink 
          to="/admin/view" 
          class="nav-link" 
          :class="{ active: route.path === '/admin/view' }"
          @click="$emit('close')"
        >
          <span class="icon">✓</span>
          View Result
        </NuxtLink>
      </li>
      <li>
        <a 
          href="/api/admin/export" 
          class="nav-link" 
          download
          @click="$emit('close')"
        >
          <span class="icon">⬇️</span>
          Export DB
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  close: [];
}>();

const route = useRoute();
</script>

<style scoped>
.sidebar-overlay {
  display: none;
}

.sidebar {
  width: 180px;
  min-height: calc(100vh - 50px);
  background: #2a3142;
  border-right: 1px solid #ddd;
  transition: transform 0.3s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.close-btn {
  display: none;
  width: 32px;
  height: 32px;
  background: #2a3142;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #4e2a4e;
  color: #333;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  color: #337ab7;
  text-decoration: none;
  font-size: 14px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #4e2a4e;
}

.nav-link.active {
  background: #2a3142;
  border-left-color: #337ab7;
}

.icon {
  font-size: 14px;
}

/* Mobile styles */
@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
  }
  
  .sidebar {
    position: fixed;
    top: 50px;
    left: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  
  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
