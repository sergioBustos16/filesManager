<script setup lang="ts">
definePageMeta({ middleware: ['auth'], ssr: false, layout: 'dashboard' });
const { $apiFetch } = useNuxtApp();
const { user, fetchMe } = useAuth();
const { $toast } = useNuxtApp();

await fetchMe();
if (!user.value?.groups?.includes('Admin')) {
  await navigateTo('/folders');
}

const groups = ref<{ id: string; name: string }[]>([]);
const users = ref<
  Array<{
    id: string;
    email: string;
    name: string;
    isSuperAdmin: boolean;
    groups: { id: string; name: string }[];
  }>
>([]);

const form = reactive({
  name: '',
  email: '',
  password: '',
  groupIds: [] as string[],
  isAdmin: false,
});

const assignableGroups = computed(() =>
  groups.value.filter((group) => group.name !== 'Admin'),
);

const reload = async () => {
  try {
    groups.value = await $apiFetch('/groups');
    users.value = await $apiFetch('/users');
  } catch (error) {
    $toast.error('Failed to load data');
    console.error(error);
  }
};

await reload();

const createUser = async () => {
  try {
    await $apiFetch('/users', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
        groupIds: form.groupIds,
        isAdmin: form.isAdmin,
      },
    });
    form.name = '';
    form.email = '';
    form.password = '';
    form.groupIds = [];
    form.isAdmin = false;
    await reload();
    $toast.success('User created successfully');
  } catch (error: any) {
    $toast.error(error.response?._data?.message || 'Failed to create user');
    console.error(error);
  }
};
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <NuxtLink
      to="/folders"
      class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
      Back to dashboard
    </NuxtLink>
    <h1 class="mt-4 text-2xl font-semibold text-slate-900">Admin Users</h1>

    <!-- Create User Form -->
    <form
      class="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      @submit.prevent="createUser"
    >
      <h2 class="text-lg font-medium text-slate-900">Create New User</h2>
      <p class="mt-2 text-sm text-slate-500">
        Turn on <strong>Admin access</strong> to add the user to the Admin group automatically. Only the protected
        super admin can complete that action.
      </p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="name">Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            minlength="2"
            class="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="User name"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="8"
            class="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="groups">Groups</label>
          <select
            id="groups"
            v-model="form.groupIds"
            multiple
            class="w-full rounded-lg border border-slate-200 px-3 py-2"
            size="3"
          >
            <option v-for="group in assignableGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
          <p class="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple groups</p>
        </div>
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input v-model="form.isAdmin" type="checkbox" class="rounded border-slate-300" />
            Grant Admin access
          </label>
        </div>
      </div>
      <button
        type="submit"
        :disabled="!form.isAdmin && form.groupIds.length === 0"
        class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Create User
      </button>
    </form>

    <!-- Users List -->
    <div class="mt-8">
      <h2 class="text-lg font-medium text-slate-900">Existing Users</h2>
      <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Email
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Groups
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50">
              <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                <div class="flex items-center gap-2">
                  <span>{{ u.name }}</span>
                  <span
                    v-if="u.isSuperAdmin"
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  >
                    Protected super admin
                  </span>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{{ u.email }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                <span v-if="u.groups?.length">
                  {{ u.groups.map(g => g.name).join(', ') }}
                </span>
                <span v-else class="text-slate-400">No groups</span>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="3" class="px-4 py-8 text-center text-sm text-slate-500">
                No users found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
