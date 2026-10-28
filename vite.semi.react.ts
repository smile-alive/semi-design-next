import type { Plugin } from 'vite-plus';

// Server Components cannot evaluate Semi modules (they call or mutate exports of client modules at the top level),
// so every module is marked as a client boundary. Only the root entry stays unmarked: it just re-exports, and a
// Server Component importing it reaches the client modules through the boundary of each one.
export const semiUseClient: Plugin = {
    name: 'semi:use-client',
    banner: (chunk) => (chunk.fileName === 'index.js' ? '' : "'use client';"),
};
