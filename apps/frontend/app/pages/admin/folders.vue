<script setup lang="ts">
definePageMeta({ middleware: ['auth'], ssr: false, layout: 'dashboard' });
const { user, fetchMe } = useAuth();
const { create, list } = useFolders();
const { $apiFetch } = useNuxtApp();

await fetchMe();
if (!user.value?.groups?.includes('Admin')) {
  await navigateTo('/folders');
}

const folders = ref<{ id: string; name: string }[]>([]);
const groups = ref<{ id: string; name: string }[]>([]);
const form = reactive({
  name: '',
  groupId: '',
  canRead: true,
  canWrite: true,
  canDelete: false,
});

const onReadChange = () => {
  if (!form.canRead) {
    form.canWrite = false;
  }
};

const onWriteChange = () => {
  if (form.canWrite) {
    form.canRead = true;
  }
};

const reload = async () => {
  folders.value = await list();
  groups.value = await $apiFetch('/groups');
};
await reload();

const groupsForPermissions = computed(() =>
  groups.value.filter((g) => g.name !== 'Admin'),
);

const onCreate = async () => {
  await create({
    name: form.name,
    permissions: form.groupId
      ? [
          {
            groupId: form.groupId,
            canRead: form.canRead,
            canWrite: form.canWrite,
            canDelete: form.canDelete,
          },
        ]
      : [],
  });
  form.name = '';
  form.groupId = '';
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
    <h1 class="mt-4 text-2xl font-semibold text-slate-900">Admin Folders</h1>
    <form
      class="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      @submit.prevent="onCreate"
    >
      <input
        v-model="form.name"
        placeholder="Folder name"
        class="w-full rounded-lg border border-slate-200 px-3 py-2"
      />
      <select
        v-model="form.groupId"
        class="w-full rounded-lg border border-slate-200 px-3 py-2"
      >
        <option value="">No initial group</option>
        <option v-for="group in groupsForPermissions" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
      <label class="mr-4 text-sm">
        <input v-model="form.canRead" type="checkbox" @change="onReadChange" /> Read
      </label>
      <label class="mr-4 text-sm">
        <input v-model="form.canWrite" type="checkbox" @change="onWriteChange" /> Edit
      </label>
      <label class="text-sm"><input v-model="form.canDelete" type="checkbox" /> Delete</label>
      <button
        type="submit"
        class="block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Create folder
      </button>
    </form>
    <ul class="mt-6 space-y-2">
      <li v-for="folder in folders" :key="folder.id">
        <NuxtLink
          class="text-indigo-600 hover:underline"
          :to="{ path: '/folders', query: { folder: folder.id } }"
        >
          {{ folder.name }}
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
