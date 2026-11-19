// vite.config.js — v11.0.0 — Browser bundles FROM packages/simulation, no duplication
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: { port: 3001 },
  resolve: { alias: { '@mmr/simulation': '/packages/simulation' } },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { external: [/^\/packages\//] },
  },
});
