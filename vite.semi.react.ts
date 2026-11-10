import type { Plugin } from 'vite-plus';

// Server Components cannot evaluate Semi modules (they call or mutate exports of client modules at the top level),
// so every module is marked as a client boundary. The entries stay unmarked: they just re-export, and a Server
// Component importing one reaches the client modules through the boundary of each. The locale entry stays unmarked
// too: its packs are plain data a Server Component passes to ConfigProvider.
export function semiUseClient(serverEntries: string[]): Plugin {
    return {
        name: 'semi:use-client',
        banner: (chunk) => (serverEntries.includes(chunk.fileName) ? '' : "'use client';"),
    };
}
