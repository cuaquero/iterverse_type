import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: "autoUpdate",
    manifest: {
      name: "Iterverse Type",
      short_name: "IterType",
      description: "A typing practice tool and no-login event kiosk from Bridgerland Technical College's Iterverse platform.",
      theme_color: "#000000",
      background_color: "#000000",
      display: "standalone",
      start_url: "/",
      icons: [
        { src: "/logo192.png", sizes: "192x192", type: "image/png" },
        { src: "/logo512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,wav,json}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      // The PWA's offline navigation fallback (serve cached index.html for
      // any unmatched navigation) runs entirely client-side in the service
      // worker, before a request ever reaches the network - which means it
      // bypasses Cloudflare Access's edge-level gate on /admin/* entirely.
      // Exclude /admin so those navigations always go to the network and
      // actually hit Access, at the cost of /admin having no offline
      // support (acceptable - it's a staff tool, not the kiosk).
      navigateFallbackDenylist: [/^\/admin/],
    },
  })],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
  },
});