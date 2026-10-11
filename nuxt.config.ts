// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  devServer: {
    port: 3000,
    host: "0.0.0.0",
  },

  nitro: {
    preset: "node-server",
  },

  // Enable pages directory
  pages: true,

  // App configuration
  app: {
    head: {
      title: "Rajshree",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Live answers board and archives for Learn Raj's Maths with RA, RB, RC, RD, and RE results." },
      ],
    },
  },

  // Runtime config
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_KEY || "",
  },

  // Vite Configuration
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
