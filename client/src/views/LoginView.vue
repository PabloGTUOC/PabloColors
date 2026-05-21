<template>
  <div class="login-page">
    <div class="login-card">
      <h1>PabloColors</h1>
      <p class="subtitle">Fuji Recipe Manager</p>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="username">Username</label>
          <input id="username" v-model="username" type="text" autocomplete="username" required />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" autocomplete="current-password" required />
        </div>

        <div class="field checkbox">
          <input id="remember" v-model="rememberMe" type="checkbox" />
          <label for="remember">Remember me for 30 days</label>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    const resp = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value, rememberMe: rememberMe.value }),
    });
    if (!resp.ok) {
      const body = await resp.json();
      error.value = body.error ?? 'Login failed';
      return;
    }
    await router.push('/');
  } catch {
    error.value = 'Network error — please try again';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
.login-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 380px;
}
h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 .25rem; color: var(--accent); }
.subtitle { color: var(--text-muted); margin: 0 0 2rem; }
.field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1rem; }
.field.checkbox { flex-direction: row; align-items: center; gap: .6rem; }
label { font-size: .875rem; color: var(--text-muted); }
input[type="text"], input[type="password"] {
  padding: .6rem .75rem; border: 1px solid var(--border); border-radius: 6px;
  background: var(--bg); color: var(--text); font-size: 1rem;
}
input:focus { outline: none; border-color: var(--accent); }
.error-msg { color: var(--danger); font-size: .875rem; margin: .5rem 0; }
.btn-primary {
  width: 100%; padding: .7rem; background: var(--accent); color: #fff;
  border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; margin-top: .5rem;
}
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
</style>
