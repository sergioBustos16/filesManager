export type FileItem = {
  id: string;
  folderId: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  status: 'READY';
  createdAt: string;
};

type UploadRequestResult = {
  signedUrl: string;
  objectPath: string;
};

export const useFiles = () => {
  const { $apiFetch } = useNuxtApp();

  const list = (folderId: string) => $apiFetch<FileItem[]>(`/folders/${folderId}/files`);

  const uploadViaSignedUrl = async (folderId: string, file: globalThis.File) => {
    const uploadInfo = await $apiFetch<UploadRequestResult>(`/folders/${folderId}/files/upload-request`, {
      method: 'POST',
      body: {
        name: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    await fetch(uploadInfo.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    return $apiFetch<FileItem>(`/folders/${folderId}/files`, {
      method: 'POST',
      body: {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        path: uploadInfo.objectPath,
      },
    });
  };

  const downloadRequest = (folderId: string, fileId: string) =>
    $apiFetch<{ signedUrl: string }>(`/folders/${folderId}/files/${fileId}/download-request`);

  const deleteFile = (folderId: string, fileId: string) =>
    $apiFetch(`/folders/${folderId}/files/${fileId}`, { method: 'DELETE' });

  return { list, uploadViaSignedUrl, downloadRequest, deleteFile };
};
