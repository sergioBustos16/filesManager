export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const apiFetch = async <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    const token = useCookie<string | null>('access_token').value;
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return $fetch<T>(url, {
      baseURL: config.public.apiBaseUrl,
      ...options,
      headers,
    });
  };

  return {
    provide: {
      apiFetch,
    },
  };
});
