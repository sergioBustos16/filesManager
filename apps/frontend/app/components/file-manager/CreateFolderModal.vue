<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });

const name = ref('');
const emit = defineEmits<{ submit: [name: string] }>();

watch(open, (v) => {
  if (v) name.value = '';
});

const onSubmit = () => {
  const n = name.value.trim();
  if (n.length < 1) return;
  emit('submit', n);
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
        <h2 id="create-folder-title" class="text-lg font-semibold text-slate-900">New folder</h2>
        <p class="mt-1 text-sm text-slate-500">Create an empty folder. You can add group access afterward.</p>
        <form class="mt-4 space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700" for="folder-name">Name</label>
            <input
              id="folder-name"
              v-model="name"
              type="text"
              required
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My folder"
            />
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
