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
  permissions?: FolderPermission[];
};

export const useFolders = () => {
  const { $apiFetch } = useNuxtApp();

  const list = () => $apiFetch<Folder[]>('/folders');
  const get = (folderId: string) => $apiFetch<Folder>(`/folders/${folderId}`);
  const create = (body: { name: string; permissions: Omit<FolderPermission, 'id'>[] }) =>
    $apiFetch<Folder>('/folders', { method: 'POST', body });
  const upsertPermission = (folderId: string, body: Omit<FolderPermission, 'id'>) =>
    $apiFetch(`/folders/${folderId}/permissions`, { method: 'PUT', body });

  return { list, get, create, upsertPermission };
};
