// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app/',
  modules: ['@nuxtjs/tailwindcss'],
  /** Avoid SSR `navigateTo` on `/` — it can break the Vite dev vite-node IPC with "IPC connection closed". */
  routeRules: {
    '/': { redirect: '/folders' },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:3005',
    },
  },
});
