import { resolve } from 'node:path';
import { svelte as sveltePlugin } from '@sveltejs/vite-plugin-svelte';
import { createServer } from 'vite';
import type { TestProject } from 'vite-plus/test/node';

declare module 'vite-plus/test' {
    interface ProvidedContext {
        svelteSsr: { body: string; head: string };
    }
}

// The browser project compiles every module for the DOM, so the server half is rendered here by a Vite server whose
// Svelte plugin generates server code; the browser test reads it through inject()
export default async function setup(project: TestProject) {
    const server = await createServer({
        configFile: false,
        logLevel: 'error',
        plugins: [sveltePlugin()],
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
    });
    try {
        const { render } = (await server.ssrLoadModule('svelte/server')) as typeof import('svelte/server');
        const root = (await server.ssrLoadModule(resolve('vitest/svelte/__probes__/ssr-root.svelte'))) as { default: Parameters<typeof render>[0] };
        const { body, head } = render(root.default, { props: {} });
        project.provide('svelteSsr', { body, head });
    } finally {
        await server.close();
    }
}
