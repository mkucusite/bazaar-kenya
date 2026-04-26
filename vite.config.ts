import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from "vite-plugin-pwa";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "https://tpthlopfhyuuspgooblk.supabase.co";
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InRwdGhsb3BmaHl1dXNwZ29vYmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NDc0ODcsImV4cCI6MjA4ODQyMzQ4N30.PQ4Nviecc9-RgW2iHfHD6tGA4B1tAWMp7KLHG72hy_I";
const supabaseProjectId = process.env.VITE_SUPABASE_PROJECT_ID ?? "tpthlopfhyuuspgooblk";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui") || id.includes("lucide-react")) return "vendor-ui";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
          return "vendor";
        },
      },
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
  },
  plugins: [
    react(),
    
    VitePWA({
      registerType: "autoUpdate",
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
            urlPattern: /^https:\/\/tpthlopfhyuuspgooblk\.supabase\.co\/rest\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 150, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/tpthlopfhyuuspgooblk\.supabase\.co\/storage\/.*/i,
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
