type AuthUser = {
  sub: string;
  email: string;
  name: string;
  groups: string[];
};

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export const useAuth = () => {
  const token = useCookie<string | null>('access_token');
  const user = useState<AuthUser | null>('auth_user', () => null);
  const { $apiFetch } = useNuxtApp();

  const login = async (email: string, password: string) => {
    const response = await $apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    token.value = response.accessToken;
    await fetchMe(response.accessToken);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await $apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    token.value = response.accessToken;
    await fetchMe(response.accessToken);
  };

  /** Pass accessToken from login/register so the next /users/me call uses it immediately (cookie can lag one tick). */
  const fetchMe = async (accessTokenOverride?: string) => {
    const t = accessTokenOverride ?? token.value;
    if (!t) {
      user.value = null;
      return null;
    }
    const me = await $apiFetch<AuthUser>('/users/me', {
      headers: { Authorization: `Bearer ${t}` },
    });
    user.value = me;
    return me;
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    return navigateTo('/login');
  };

  return {
    token,
    user,
    login,
    register,
    fetchMe,
    logout,
  };
};
