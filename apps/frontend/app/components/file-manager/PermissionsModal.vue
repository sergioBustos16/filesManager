<script setup lang="ts">
import type { Folder, FolderPermission } from '~/composables/useFolders';
import type { GroupRow } from '~/composables/useGroups';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  folderId: string | null;
  folder: Folder | null;
  groups: GroupRow[];
}>();

const { upsertPermission } = useFolders();
const toast = useToast();
const emit = defineEmits<{ saved: [] }>();

type Row = {
  groupId: string;
  groupName: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
};

const rows = ref<Row[]>([]);
const saving = ref(false);

/** Admin has implicit access to every folder; do not offer it as a permission row. */
const assignableGroups = computed(() =>
  props.groups.filter((g) => g.name !== 'Admin'),
);

function permForGroup(gid: string): FolderPermission | undefined {
  return props.folder?.permissions?.find((p) => p.groupId === gid);
}

watch(
  () => [open.value, props.folder, props.groups] as const,
  () => {
    if (!open.value) {
      rows.value = [];
      return;
    }
    rows.value = assignableGroups.value.map((g) => {
      const p = permForGroup(g.id);
      return {
        groupId: g.id,
        groupName: g.name,
        canRead: p?.canRead ?? false,
        canWrite: p?.canWrite ?? false,
        canDelete: p?.canDelete ?? false,
      };
    });
  },
  { immediate: true },
);

const saveRow = async (row: Row) => {
  if (!props.folderId) return;
  saving.value = true;
  try {
    await upsertPermission(props.folderId, {
      groupId: row.groupId,
      canRead: row.canRead,
      canWrite: row.canWrite,
      canDelete: row.canDelete,
    });
    toast.show(`Saved access for ${row.groupName}`, 'success');
    emit('saved');
  } catch {
    toast.show('Failed to save permissions', 'error');
  } finally {
    saving.value = false;
  }
};

const onReadChange = (row: Row) => {
  if (!row.canRead) {
    row.canWrite = false;
  }
};

const onWriteChange = (row: Row) => {
  if (row.canWrite) {
    row.canRead = true;
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perm-title"
      @keydown.escape="open = false"
    >
      <div
        class="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        @click.stop
      >
        <h2 id="perm-title" class="text-lg font-semibold text-slate-900">Folder permissions</h2>
        <p class="mt-1 text-sm text-slate-500">
          Grant Read, Edit, and Delete per group. Edit includes list, download, and upload, while Delete stays separate.
          Changes apply to this folder only. The Admin group is not listed; administrators always have full access to
          every folder.
        </p>
        <div v-if="!assignableGroups.length" class="mt-4 text-sm text-slate-500">
          <template v-if="!groups.length">No groups exist yet. Create groups in Admin.</template>
          <template v-else
            >Only the Admin group exists. Create other groups in Admin to assign access here.</template
          >
        </div>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-600">
                <th class="py-2 pr-4 font-medium">Group</th>
                <th class="py-2 px-2 font-medium">Read</th>
                <th class="py-2 px-2 font-medium">Edit</th>
                <th class="py-2 px-2 font-medium">Delete</th>
                <th class="py-2 pl-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.groupId" class="border-b border-slate-100">
                <td class="py-2 pr-4 font-medium text-slate-800">{{ row.groupName }}</td>
                <td class="py-2 px-2">
                  <input
                    v-model="row.canRead"
                    type="checkbox"
                    class="rounded border-slate-300"
                    @change="onReadChange(row)"
                  />
                </td>
                <td class="py-2 px-2">
                  <input
                    v-model="row.canWrite"
                    type="checkbox"
                    class="rounded border-slate-300"
                    @change="onWriteChange(row)"
                  />
                </td>
                <td class="py-2 px-2">
                  <input v-model="row.canDelete" type="checkbox" class="rounded border-slate-300" />
                </td>
                <td class="py-2 pl-2">
                  <button
                    type="button"
                    :disabled="saving"
                    class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    @click="saveRow(row)"
                  >
                    Save row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            @click="open = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
