<script setup lang="ts">
import { Folder, FileText, Download, Trash2 } from 'lucide-vue-next';
import type { FileItem } from '~/composables/useFiles';
import { mimeBadgeLabel } from '~/utils/mimeBadge';

defineProps<{
  mode: 'folders' | 'files';
  folders: { id: string; name: string }[];
  files: FileItem[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  'open-folder': [id: string];
  download: [fileId: string];
  delete: [fileId: string];
}>();

const badgeClass = (mime: string) => {
  if (mime.includes('pdf')) return 'bg-red-100 text-red-800';
  if (mime.startsWith('image/')) return 'bg-emerald-100 text-emerald-800';
  if (mime.includes('html')) return 'bg-lime-100 text-lime-800';
  return 'bg-violet-100 text-violet-800';
};
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-16 text-slate-500">Loading…</div>
    <p
      v-else-if="mode === 'folders' && !folders.length"
      class="py-16 text-center text-slate-500"
    >
      No folders yet. Use &quot;New folder&quot; above or ask an admin to share one.
    </p>
    <div
      v-else-if="mode === 'folders'"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <button
        v-for="f in folders"
        :key="f.id"
        type="button"
        class="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        @dblclick.prevent="emit('open-folder', f.id)"
      >
        <Folder class="h-12 w-12 text-amber-500 transition group-hover:scale-105" aria-hidden="true" />
        <span class="mt-2 max-w-full truncate text-center text-sm font-medium text-slate-800">{{ f.name }}</span>
        <span class="mt-1 text-[10px] text-slate-400">Double-click to open</span>
      </button>
    </div>
    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <div
        v-for="file in files"
        :key="file.id"
        class="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="relative">
          <FileText class="h-12 w-12 text-slate-400" aria-hidden="true" />
          <span
            class="absolute -bottom-1 -right-1 rounded px-1 text-[10px] font-bold uppercase"
            :class="badgeClass(file.mimeType)"
          >
            {{ mimeBadgeLabel(file.mimeType) }}
          </span>
        </div>
        <span class="mt-2 max-w-full truncate text-center text-sm font-medium text-slate-800">{{ file.name }}</span>
        <span class="text-xs text-slate-500">{{ file.size }} bytes</span>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            title="Download"
            @click="emit('download', file.id)"
          >
            <Download class="h-3.5 w-3.5" aria-hidden="true" />
            Get
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            title="Delete"
            @click="emit('delete', file.id)"
          >
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            Del
          </button>
        </div>
      </div>
    </div>
    <p v-if="!loading && mode === 'files' && !files.length" class="py-16 text-center text-slate-500">
      No files in this folder. Upload to get started.
    </p>
  </div>
</template>
