import { svelte as sveltePlugin } from '@sveltejs/vite-plugin-svelte';
import { semiInlineJsonWorker, semiStubStyles } from '../../vite.semi.ts';
import { browserBase, browserStyles, jsdomBase, nodeBase, ssrTestFiles, testFiles, type TestFramework } from '../framework.ts';

export const svelte: TestFramework = {
    projects: [
        {
            extends: true,
            plugins: [sveltePlugin(), semiStubStyles],
            // Without the browser condition Node resolves svelte's server build, where mount() throws
            resolve: { conditions: ['browser'] },
            test: { ...jsdomBase, name: 'svelte', server: { deps: { inline: [/@dnd-kit\/svelte/] } }, include: [...testFiles('svelte', false), 'packages/semi-*-svelte/**/__tests__/**/*.test.ts'], setupFiles: ['./vitest/vitest.setup.ts', './vitest/svelte/svelte.setup.ts'] },
        },
        {
            extends: true,
            plugins: [sveltePlugin(), semiStubStyles],
            test: { ...nodeBase, name: 'svelte-ssr', server: { deps: { inline: [/@dnd-kit\/svelte/] } }, include: ssrTestFiles('svelte') },
        },
        {
            extends: true,
            css: browserStyles,
            plugins: [sveltePlugin(), semiInlineJsonWorker],
            // pre-bundled, @dnd-kit/svelte would bring its own copy of the svelte runtime and its effects would be orphaned;
            // @dnd-kit/dom is excluded with it so both load the same @preact/signals-core, otherwise DragOverlay never sees the drag source
            optimizeDeps: { exclude: ['@dnd-kit/svelte', '@dnd-kit/dom'] },
            test: { ...browserBase(), name: 'svelte-browser', include: testFiles('svelte', true), exclude: ['**/node_modules/**', '**/*.hydration.browser.test.*'], setupFiles: ['./vitest/browser.setup.ts', './vitest/svelte/svelte.setup.ts'] },
        },
        {
            extends: true,
            plugins: [sveltePlugin()],
            test: { ...browserBase(), name: 'svelte-hydration-browser', include: ['vitest/svelte/**/*.hydration.browser.test.ts'], globalSetup: ['./vitest/svelte/hydration-setup.ts'], setupFiles: ['./vitest/browser.setup.ts'] },
        },
    ],
};
