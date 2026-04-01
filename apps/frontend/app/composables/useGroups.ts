export type GroupRow = { id: string; name: string };

export const useGroups = () => {
  const { $apiFetch } = useNuxtApp();
  const list = () => $apiFetch<GroupRow[]>('/groups');
  return { list };
};
