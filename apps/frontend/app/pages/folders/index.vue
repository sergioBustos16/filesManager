<script setup lang="ts">
import type { FileItem } from '~/composables/useFiles';
import type { Folder } from '~/composables/useFolders';
import type { GroupRow } from '~/composables/useGroups';

definePageMeta({ middleware: ['auth'], ssr: false, layout: 'dashboard' });

const route = useRoute();
const router = useRouter();
const { user, fetchMe } = useAuth();
const { list, get, create } = useFolders();
const { list: listFiles, uploadViaSignedUrl, downloadRequest, deleteFile } = useFiles();
const { list: listGroups } = useGroups();
const toast = useToast();

const folders = ref<Folder[]>([]);
const folderDetail = ref<Folder | null>(null);
const files = ref<FileItem[]>([]);
const groups = ref<GroupRow[]>([]);
const loadingFolders = ref(true);
const loadingDetail = ref(false);
const busyUpload = ref(false);

const createModalOpen = ref(false);
const permModalOpen = ref(false);

const selectedFolderId = computed(() =>
  typeof route.query.folder === 'string' ? route.query.folder : null,
);

await fetchMe();

const loadFolders = async () => {
  loadingFolders.value = true;
  try {
    folders.value = await list();
  } catch {
    toast.show('Failed to load folders', 'error');
  } finally {
    loadingFolders.value = false;
  }
};

const loadGroups = async () => {
  try {
    groups.value = await listGroups();
  } catch {
    groups.value = [];
  }
};

await loadFolders();
await loadGroups();

const openFolderQuery = (id: string) => {
  router.replace({ path: '/folders', query: { folder: id } });
};

const clearFolderQuery = () => {
  router.replace({ path: '/folders' });
};

watch(
  () => route.query.folder,
  async (q) => {
    const id = typeof q === 'string' ? q : null;
    if (!id) {
      folderDetail.value = null;
      files.value = [];
      return;
    }
    loadingDetail.value = true;
    try {
      folderDetail.value = await get(id);
      files.value = await listFiles(id);
    } catch {
      toast.show('Could not open folder', 'error');
      clearFolderQuery();
      folderDetail.value = null;
      files.value = [];
    } finally {
      loadingDetail.value = false;
    }
  },
  { immediate: true },
);

const isAdmin = computed(() => user.value?.groups?.includes('Admin') ?? false);
const isOwner = computed(
  () =>
    !!folderDetail.value &&
    !!user.value &&
    folderDetail.value.createdById === user.value.sub,
);
const canManagePermissions = computed(() => isAdmin.value || isOwner.value);

const onSidebarSelect = (id: string) => {
  openFolderQuery(id);
};

const onSidebarOpen = (id: string) => {
  openFolderQuery(id);
};

const onOpenFolderFromGrid = (id: string) => {
  openFolderQuery(id);
};

const onBack = () => clearFolderQuery();

const onCreateFolderSubmit = async (name: string) => {
  try {
    await create({ name, permissions: [] });
    toast.show('Folder created', 'success');
    await loadFolders();
  } catch {
    toast.show('Could not create folder', 'error');
  }
};

const onFileSelected = async (file: File) => {
  const id = selectedFolderId.value;
  if (!id) return;
  busyUpload.value = true;
  try {
    await uploadViaSignedUrl(id, file);
    toast.show('Upload complete', 'success');
    files.value = await listFiles(id);
    folderDetail.value = await get(id);
  } catch {
    toast.show('Upload failed', 'error');
  } finally {
    busyUpload.value = false;
  }
};

const onDownload = async (fileId: string) => {
  const id = selectedFolderId.value;
  if (!id) return;
  try {
    const { signedUrl } = await downloadRequest(id, fileId);
    const opened = window.open(signedUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      toast.show('Could not open a new tab (check pop-up settings)', 'error');
    }
  } catch {
    toast.show('Download failed', 'error');
  }
};

const onDeleteFile = async (fileId: string) => {
  if (!confirm('Delete this file permanently?')) return;
  const id = selectedFolderId.value;
  if (!id) return;
  try {
    await deleteFile(id, fileId);
    toast.show('File deleted', 'success');
    files.value = await listFiles(id);
  } catch {
    toast.show('Delete failed', 'error');
  }
};

const refreshDetail = async () => {
  const id = selectedFolderId.value;
  if (!id) return;
  folderDetail.value = await get(id);
  files.value = await listFiles(id);
};

const onPermissionsSaved = async () => {
  await loadFolders();
  await refreshDetail();
};
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <FileManagerAppHeader
      :email="user?.email"
      :is-admin="isAdmin"
      @refresh="loadFolders(); refreshDetail()"
    />
    <div class="flex min-h-0 flex-1">
      <FileManagerFolderSidebar
        :folders="folders"
        :selected-folder-id="selectedFolderId"
        :loading="loadingFolders"
        @select="onSidebarSelect"
        @open="onSidebarOpen"
      />
      <main class="flex min-w-0 flex-1 flex-col">
        <FileManagerToolbar
          :folder-name="folderDetail?.name"
          :has-folder-open="!!selectedFolderId"
          :can-manage-permissions="canManagePermissions"
          :busy="busyUpload"
          @back="onBack"
          @create-folder="createModalOpen = true"
          @open-permissions="permModalOpen = true"
          @file-selected="onFileSelected"
        />
        <div class="flex-1 overflow-auto p-4 md:p-6">
          <template v-if="!selectedFolderId">
            <FileManagerItemGrid
              mode="folders"
              :folders="folders"
              :files="[]"
              :loading="loadingFolders"
              @open-folder="onOpenFolderFromGrid"
            />
          </template>
          <template v-else>
            <FileManagerItemGrid
              mode="files"
              :folders="[]"
              :files="files"
              :loading="loadingDetail"
              @download="onDownload"
              @delete="onDeleteFile"
            />
          </template>
        </div>
      </main>
    </div>
    <FileManagerToastHost />
    <FileManagerCreateFolderModal v-model:open="createModalOpen" @submit="onCreateFolderSubmit" />
    <FileManagerPermissionsModal
      v-model:open="permModalOpen"
      :folder-id="selectedFolderId"
      :folder="folderDetail"
      :groups="groups"
      @saved="onPermissionsSaved"
    />
  </div>
</template>
