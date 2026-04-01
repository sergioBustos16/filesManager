<script setup lang="ts">
import { LogOut, Shield, FolderCog, Users } from 'lucide-vue-next';

defineProps<{
  email?: string;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{ refresh: [] }>();
const { logout } = useAuth();
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <span class="text-lg font-semibold text-slate-800">Files Manager</span>
      <button
        type="button"
        class="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        @click="emit('refresh')"
      >
        Refresh
      </button>
    </div>
    <div class="flex items-center gap-3">
      <span v-if="email" class="hidden text-sm text-slate-600 sm:inline">{{ email }}</span>
      <NuxtLink
        v-if="isAdmin"
        to="/admin/folders"
        class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <FolderCog class="h-4 w-4" aria-hidden="true" />
        Admin folders
      </NuxtLink>
      <NuxtLink
        v-if="isAdmin"
        to="/admin/groups"
        class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <Users class="h-4 w-4" aria-hidden="true" />
        Groups
      </NuxtLink>
      <span v-if="isAdmin" class="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
        <Shield class="h-3.5 w-3.5" aria-hidden="true" />
        Admin
      </span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        @click="logout()"
      >
        <LogOut class="h-4 w-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  </header>
</template>
