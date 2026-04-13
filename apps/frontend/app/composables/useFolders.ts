export type FolderPermission = {
  id: string;
  groupId: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  group?: { id: string; name: string };
};

export type Folder = {
  id: string;
  name: string;
  createdById: string;
  createdAt: string;
  gcsBucketName?: string | null;
  permissions?: FolderPermission[];
};

export type CreateFolderBody = {
  name: string;
  /** GCS bucket name (Admin only; must be in server allowlist). Omit to use default bucket. */
  gcsBucketName?: string;
  permissions?: Omit<FolderPermission, 'id'>[];
};

export const useFolders = () => {
  const { $apiFetch } = useNuxtApp();

  const list = () => $apiFetch<Folder[]>('/folders');
  const get = (folderId: string) => $apiFetch<Folder>(`/folders/${folderId}`);
  const create = (body: CreateFolderBody) =>
    $apiFetch<Folder>('/folders', { method: 'POST', body });
  const upsertPermission = (folderId: string, body: Omit<FolderPermission, 'id'>) =>
    $apiFetch(`/folders/${folderId}/permissions`, { method: 'PUT', body });

  return { list, get, create, upsertPermission };
};
