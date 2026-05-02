// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Enable pages directory
  pages: true,

  // App configuration
  app: {
    head: {
      title: "gobhagyalaxmi",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },

  // Runtime config
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  },

  // Vite Configuration
  vite: {
    server: {
      allowedHosts: ["unskimmed-unlibelous-ara.ngrok-free.dev"],
    },
  },
});
