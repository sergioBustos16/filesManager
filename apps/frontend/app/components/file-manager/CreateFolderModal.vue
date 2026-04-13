<script setup lang="ts">
import { ref, watch } from 'vue';

const open = defineModel<boolean>('open', { default: false });

const props = withDefaults(
  defineProps<{
    /** When true, show GCS bucket picker (requires Admin). */
    isAdmin?: boolean;
  }>(),
  { isAdmin: false },
);

const { $apiFetch } = useNuxtApp();

const name = ref('');

const gcsBuckets = ref<string[]>([]);
const defaultGcsBucket = ref('');
const selectedGcsBucket = ref<string | null>(null);
const loadingGcsBuckets = ref(false);

const emit = defineEmits<{
  submit: [payload: { name: string; gcsBucketName?: string }];
}>();

const loadGcsBuckets = async () => {
  if (!props.isAdmin) return;
  loadingGcsBuckets.value = true;
  try {
    const data = await $apiFetch<{
      buckets: string[];
      defaultBucket: string;
    }>('/storage/gcs-buckets');
    gcsBuckets.value = data.buckets ?? [];
    defaultGcsBucket.value = data.defaultBucket ?? '';
    selectedGcsBucket.value =
      data.defaultBucket || data.buckets?.[0] || null;
  } catch (error) {
    console.error('Failed to load GCS buckets:', error);
    gcsBuckets.value = [];
  } finally {
    loadingGcsBuckets.value = false;
  }
};

watch(
  () => open.value,
  (v) => {
    if (v) {
      name.value = '';
      selectedGcsBucket.value = null;
      void loadGcsBuckets();
    }
  },
);

const onSubmit = () => {
  const n = name.value.trim();
  if (n.length < 1) return;

  const payload: { name: string; gcsBucketName?: string } = { name: n };

  if (
    props.isAdmin &&
    selectedGcsBucket.value &&
    selectedGcsBucket.value !== defaultGcsBucket.value
  ) {
    payload.gcsBucketName = selectedGcsBucket.value;
  }

  emit('submit', payload);
  open.value = false;
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-folder-title"
      @keydown.escape="open = false"
    >
      <div
        class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        @click.stop
      >
        <h2 id="create-folder-title" class="text-lg font-semibold text-slate-900">
          New folder
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Create an empty folder. You can add group access afterward. Files are
          stored under
          <code class="rounded bg-slate-100 px-1 text-xs">folderId/fileId</code>
          inside the selected GCS bucket.
        </p>
        <form class="mt-4 space-y-6" @submit.prevent="onSubmit">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-slate-700"
              for="folder-name"
              >Name</label
            >
            <input
              id="folder-name"
              v-model="name"
              type="text"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My folder"
            />
          </div>

          <div v-if="isAdmin && (loadingGcsBuckets || gcsBuckets.length > 0)">
            <label
              class="mb-1 block text-sm font-medium text-slate-700"
              for="gcs-bucket"
              >GCS bucket</label
            >
            <p class="mb-2 text-xs text-slate-500">
              Same GCP project as configured in the API. Bucket is fixed at
              creation time.
            </p>
            <div v-if="loadingGcsBuckets" class="py-2 text-center text-sm text-slate-500">
              Loading buckets…
            </div>
            <select
              v-else
              id="gcs-bucket"
              v-model="selectedGcsBucket"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="b in gcsBuckets" :key="b" :value="b">
                {{ b }}{{ b === defaultGcsBucket ? ' (default)' : '' }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              @click="open = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
