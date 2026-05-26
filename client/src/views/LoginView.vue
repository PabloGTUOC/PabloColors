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
  border: 3px solid var(--border);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 6px 6px 0 var(--border);
}
h1 { font-size: 2rem; font-weight: 900; margin: 0 0 .25rem; color: var(--text); text-transform: uppercase; letter-spacing: 0.03em; }
.subtitle { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 2rem; }
.field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1.25rem; }
.field.checkbox { flex-direction: row; align-items: center; gap: .6rem; }
.field.checkbox label { font-size: .85rem; font-weight: 700; color: var(--text-muted); text-transform: none; letter-spacing: normal; cursor: pointer; }
label { font-size: 11px; font-weight: 800; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em; }
input[type="text"], input[type="password"] {
  padding: .65rem .85rem; border: 2px solid var(--border); border-radius: 8px;
  background: var(--surface); color: var(--text); font-size: .95rem; font-family: inherit;
  font-weight: 700; width: 100%;
}
input:focus { outline: none; border-color: var(--border); }
.error-msg { color: var(--danger); font-size: .875rem; margin: .5rem 0; font-weight: 700; text-transform: uppercase; }
.btn-primary {
  width: 100%;
  padding: .75rem 1.5rem;
  background: var(--accent);
  color: #ffffff;
  border: 2.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  font-size: .95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 var(--border);
  transition: transform 0.1s, box-shadow 0.1s;
  margin-top: .5rem;
}
.btn-primary:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--border);
}
.btn-primary:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
</style>
