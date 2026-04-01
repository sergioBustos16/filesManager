<script setup lang="ts">
definePageMeta({ middleware: ['auth'], ssr: false, layout: 'dashboard' });
const { $apiFetch } = useNuxtApp();
const { user, fetchMe } = useAuth();

await fetchMe();
if (!user.value?.groups?.includes('Admin')) {
  await navigateTo('/folders');
}

const groups = ref<{ id: string; name: string }[]>([]);
const form = reactive({ name: '' });

const reload = async () => {
  groups.value = await $apiFetch('/groups');
};
await reload();

const createGroup = async () => {
  await $apiFetch('/groups', { method: 'POST', body: { name: form.name } });
  form.name = '';
  await reload();
};
</script>

<template>
  <main class="mx-auto max-w-3xl p-6">
    <NuxtLink
      to="/folders"
      class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
      Back to dashboard
    </NuxtLink>
    <h1 class="mt-4 text-2xl font-semibold text-slate-900">Admin Groups</h1>
    <form
      class="mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      @submit.prevent="createGroup"
    >
      <input
        v-model="form.name"
        placeholder="Group name"
        class="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2"
      />
      <button
        type="submit"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Create
      </button>
    </form>
    <ul class="mt-6 list-inside list-disc space-y-1 text-slate-800">
      <li v-for="group in groups" :key="group.id">{{ group.name }}</li>
    </ul>
  </main>
</template>
