import { resolve } from 'node:path';
import solidPlugin from 'unplugin-solid/vite';
import { createServer } from 'vite';
import type { TestProject } from 'vite-plus/test/node';
import { semiSourceAliases, semiStubStyles } from '../../vite.semi.ts';
import type { SolidSsr } from './hydration-context.ts';

// The browser project compiles every module for the DOM, so the server half of each case is rendered here by a Vite
// server of its own whose Solid plugin generates server code; the browser tests read the results through inject()
export default async function setup(project: TestProject) {
    const server = await createServer({
        configFile: false,
        logLevel: 'error',
        oxc: { jsx: 'preserve' },
        plugins: [solidPlugin({ ssr: true, hot: false }), semiStubStyles],
        resolve: { alias: [...semiSourceAliases, { find: '@test', replacement: resolve('vitest') }] },
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
    });
    try {
        const entry = (await server.ssrLoadModule(resolve('vitest/solid/hydration.server.solid.tsx'))) as { renderCases(): Promise<SolidSsr> };
        project.provide('solidSsr', await entry.renderCases());
    } finally {
        await server.close();
    }
}
