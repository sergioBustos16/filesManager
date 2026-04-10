<script setup lang="ts">
definePageMeta({ middleware: [], layout: 'auth' });
const { login } = useAuth();
const form = reactive({ email: '', password: '' });
const error = ref('');

const onSubmit = async () => {
  error.value = '';
  try {
    await login(form.email, form.password);
    await navigateTo('/folders');
  } catch {
    error.value = 'Invalid credentials.';
  }
};
</script>

<template>
  <div
    class="rounded-2xl bg-white/95 shadow-xl shadow-slate-900/20 ring-1 ring-white/10 backdrop-blur px-8 py-10"
  >
    <div class="mb-8 text-center">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
      <p class="mt-1 text-sm text-slate-500">Files Manager</p>
    </div>
    <form class="space-y-5" @submit.prevent="onSubmit">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          placeholder="••••••••"
        />
      </div>
      <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
      <button
        type="submit"
        class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Sign in
      </button>
    </form>
  </div>
</template>
