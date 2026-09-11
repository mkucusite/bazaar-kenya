import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from "vite-plugin-pwa";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "https://ygwtyyitntauqdghykuf.supabase.co";
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";
const supabaseProjectId = process.env.VITE_SUPABASE_PROJECT_ID ?? "ygwtyyitntauqdghykuf";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    sourcemap: false,
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
  },
  plugins: [
    react(),
    
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.png", "pwa-icon-192.png", "pwa-icon-512.png"],
      manifest: {
        name: "KenyaAdvert — Buy & Sell Across Kenya",
        short_name: "KenyaAdvert",
        description: "Kenya's trusted classifieds marketplace. Buy and sell phones, cars, electronics, services and more.",
        theme_color: "#16a34a",
        background_color: "#1B5E20",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["shopping", "business"],
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        navigateFallbackDenylist: [/^\/~oauth/, /^\/share\//, /\.(xml|txt)$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ygwtyyitntauqdghykuf\.supabase\.co\/rest\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 150, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/ygwtyyitntauqdghykuf\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: 86400 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 365 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
