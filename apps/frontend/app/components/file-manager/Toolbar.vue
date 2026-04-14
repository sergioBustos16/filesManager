<script setup lang="ts">
import {
  ArrowLeft,
  FolderPlus,
  Upload,
  LockKeyhole,
} from 'lucide-vue-next';

defineProps<{
  folderName?: string | null;
  hasFolderOpen: boolean;
  canCreateFolder?: boolean;
  canManagePermissions?: boolean;
  canUpload?: boolean;
  busy?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  'create-folder': [];
  'open-permissions': [];
  'file-selected': [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const onUploadClick = () => fileInput.value?.click();

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) emit('file-selected', file);
};
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-3"
  >
    <button
      v-if="hasFolderOpen"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      @click="emit('back')"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      All folders
    </button>
    <h2 v-if="hasFolderOpen && folderName" class="min-w-0 flex-1 truncate text-lg font-semibold text-slate-800">
      {{ folderName }}
    </h2>
    <h2 v-else class="flex-1 text-lg font-semibold text-slate-800">Folders</h2>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="canCreateFolder !== false"
        type="button"
        :disabled="busy"
        class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        @click="emit('create-folder')"
      >
        <FolderPlus class="h-4 w-4" aria-hidden="true" />
        New folder
      </button>
      <button
        v-if="hasFolderOpen && canUpload !== false"
        type="button"
        :disabled="busy"
        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        @click="onUploadClick"
      >
        <Upload class="h-4 w-4" aria-hidden="true" />
        Upload
      </button>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        @change="onFileChange"
      />
      <button
        v-if="hasFolderOpen && canManagePermissions"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        @click="emit('open-permissions')"
      >
        <LockKeyhole class="h-4 w-4" aria-hidden="true" />
        Folder permissions
      </button>
    </div>
  </div>
</template>
