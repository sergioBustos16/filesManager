export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/register') {
    return;
  }

  const { token, fetchMe } = useAuth();
  if (!token.value) {
    return navigateTo('/login');
  }

  const user = useState('auth_user');
  if (!user.value) {
    try {
      await fetchMe();
    } catch {
      token.value = null;
      return navigateTo('/login');
    }
  }
});
