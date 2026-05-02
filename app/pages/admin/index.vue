<template>
  <div class="admin-login">
    <div class="login-card">
      <div class="card-header">Sign In</div>
      <div class="card-body">
        <form @submit.prevent="handleLogin" autocomplete="on">
          <div class="form-group">
            <input
              v-model="username"
              type="text"
              name="username"
              id="username"
              autocomplete="username"
              placeholder="Username"
              class="form-control"
              :disabled="isSubmitting"
            />
          </div>
          <div class="form-group">
            <input
              v-model="password"
              type="password"
              name="password"
              id="password"
              autocomplete="current-password"
              placeholder="Password"
              class="form-control"
              :disabled="isSubmitting"
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
    navigateTo("/admin/add");
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
    navigateTo("/admin/add");
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
  background-color: #f5f5f5;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.card-header {
  background: #f7f7f7;
  border-bottom: 1px solid #ddd;
  padding: 15px 20px;
  font-size: 18px;
  color: #333;
}

.card-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #66afe9;
  box-shadow: 0 0 0 3px rgba(102, 175, 233, 0.25);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
}

.btn-login {
  width: auto;
  padding: 8px 16px;
  background-color: #337ab7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-login:hover:not(:disabled) {
  background-color: #286090;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
