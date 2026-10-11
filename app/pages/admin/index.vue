<template>
  <div class="admin-login">
    <div class="login-card">
      <div class="card-header">
        <h2>Admin Sign In</h2>
        <NuxtLink to="/" class="back-link">← Back to Board</NuxtLink>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleLogin" autocomplete="on">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              v-model="username"
              type="text"
              name="username"
              id="username"
              autocomplete="username"
              placeholder="Username"
              class="form-control"
              :disabled="isSubmitting"
              required
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              v-model="password"
              type="password"
              name="password"
              id="password"
              autocomplete="current-password"
              placeholder="Password"
              class="form-control"
              :disabled="isSubmitting"
              required
            />
          </div>
          <div class="form-group checkbox">
            <label>
              <input type="checkbox" v-model="rememberMe" />
              Remember Me
            </label>
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          <button type="submit" class="btn-login" :disabled="isSubmitting">
            {{ isSubmitting ? "Logging in..." : "Login" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { login, checkAuth, isAuthenticated } = useAuth();
const router = useRouter();

onMounted(async () => {
  await checkAuth();
  if (isAuthenticated.value) {
    router.push("/admin/add");
  }
});

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const isSubmitting = ref(false);
const error = ref("");

const handleLogin = async () => {
  error.value = "";
  isSubmitting.value = true;

  try {
    await login(username.value.trim(), password.value.trim(), rememberMe.value);
    await router.push("/admin/add");
  } catch (e: any) {
    error.value = e.message || "Invalid credentials";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f1115;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #161a22;
  border: 1px solid #222836;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-header {
  background: #1c2230;
  border-bottom: 1px solid #222836;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  font-size: 18px;
  color: #f3f4f6;
  margin: 0;
  font-weight: 600;
}

.back-link {
  color: #60a5fa;
  font-size: 13px;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.card-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  background: #0d1117;
  color: #f3f4f6;
  border: 1px solid #2a3142;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 0;
}

.error-message {
  color: #f87171;
  font-size: 13px;
  margin-bottom: 18px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
}

.btn-login {
  width: 100%;
  padding: 11px 16px;
  background-color: #0000c8;
  color: #ffff00;
  font-weight: 700;
  border: 1px solid #ffff00;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

.btn-login:hover:not(:disabled) {
  background-color: #1a1aff;
  box-shadow: 0 0 12px rgba(255, 255, 0, 0.35);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
