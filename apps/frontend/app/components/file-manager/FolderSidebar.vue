<script setup lang="ts">
import { Folder } from 'lucide-vue-next';

defineProps<{
  folders: { id: string; name: string }[];
  selectedFolderId: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  open: [id: string];
}>();

const onClick = (id: string) => emit('select', id);
const onDblClick = (id: string) => emit('open', id);
</script>

<template>
  <aside
    class="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 lg:w-64"
    aria-label="Folders"
  >
    <div class="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      Your folders
    </div>
    <div class="flex-1 overflow-y-auto p-2">
      <p v-if="loading" class="px-2 py-3 text-sm text-slate-500">Loading…</p>
      <p v-else-if="!folders.length" class="px-2 py-3 text-sm text-slate-500">No folders yet.</p>
      <ul v-else class="space-y-0.5">
        <li v-for="f in folders" :key="f.id">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition"
            :class="
              selectedFolderId === f.id
                ? 'bg-indigo-100 font-medium text-indigo-900'
                : 'text-slate-700 hover:bg-slate-200/80'
            "
            @click="onClick(f.id)"
            @dblclick.prevent="onDblClick(f.id)"
          >
            <Folder class="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span class="truncate">{{ f.name }}</span>
          </button>
        </li>
      </ul>
    </div>
    <p class="border-t border-slate-200 px-3 py-2 text-[10px] text-slate-400">Double-click opens files</p>
  </aside>
</template>
