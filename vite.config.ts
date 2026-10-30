import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    assetsInlineLimit: 4096,
  },
  server: {
    host: true, // Listen on all network interfaces (LAN / Tailscale)
    port: 5173,
    allowedHosts: ["100.101.178.123", "localhost", "127.0.0.1"],
    cors: {
      origin: [
        "http://100.101.178.123:5173",
        "http://100.101.178.123:8787",
        "http://localhost:5173",
        "http://localhost:8787",
      ],
      credentials: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
