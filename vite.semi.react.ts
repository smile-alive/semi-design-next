import type { Plugin } from 'vite-plus';

// Server Components cannot evaluate Semi modules (they call or mutate exports of client modules at the top level),
// so every module is marked as a client boundary. The root entry stays unmarked: it just re-exports, and a Server
// Component importing it reaches the client modules through the boundary of each one. The locale entry stays unmarked
// too: its packs are plain data a Server Component passes to ConfigProvider.
const serverEntries = new Set(['index.js', 'locale.js']);

export const semiUseClient: Plugin = {
    name: 'semi:use-client',
    banner: (chunk) => (serverEntries.has(chunk.fileName) ? '' : "'use client';"),
};
