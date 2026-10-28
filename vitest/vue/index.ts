import vuePlugin from '@vitejs/plugin-vue';
import type { TestProjectInlineConfiguration } from 'vite-plus';
import { semiInlineJsonWorker, semiStubStyles } from '../../vite.semi.ts';
import { browserBase, browserStyles, compatBrowserProjects, jsdomBase, nodeBase, ssrTestFiles, testFiles, type TestFramework } from '../framework.ts';

function browserProject(): TestProjectInlineConfiguration {
    return {
        extends: true,
        css: browserStyles,
        oxc: { jsx: { runtime: 'automatic' } },
        plugins: [vuePlugin(), semiInlineJsonWorker],
        test: { ...browserBase(), name: 'vue-browser', include: testFiles('vue', true), setupFiles: ['./vitest/browser.setup.ts', './vitest/vue/vue.setup.ts'] },
    };
}

export const vue: TestFramework = {
    projects: [
        {
            extends: true,
            // The Vue tsconfig's `jsx: preserve` would make Oxc leave .tsx JSX untransformed
            oxc: { jsx: { runtime: 'automatic' } },
            plugins: [vuePlugin(), semiStubStyles],
            test: { ...jsdomBase, name: 'vue', include: testFiles('vue', false), setupFiles: ['./vitest/vitest.setup.ts', './vitest/vue/vue.setup.ts', './vitest/vue/vue.jsdom.setup.ts'] },
        },
        {
            extends: true,
            oxc: { jsx: { runtime: 'automatic' } },
            // vuePlugin compiles templates to ssrRender here, as Nuxt and Astro do; no setup file, so no DOM globals exist
            plugins: [vuePlugin(), semiStubStyles],
            test: { ...nodeBase, name: 'vue-ssr', include: ssrTestFiles('vue') },
        },
        browserProject(),
        ...compatBrowserProjects('vue', browserProject),
    ],
    coverage: {
        include: ['packages/{semi-ui-vue,semi-ai-vue}/src/**/*.{ts,tsx,vue}'],
        exclude: ['packages/{semi-ui-vue,semi-ai-vue}/src/index.ts'],
        // Vue packages carry their own thresholds on top of the global ones in vitest/index.ts
        thresholds: {
            'packages/semi-ui-vue/**': { statements: 98, branches: 94, functions: 97, lines: 98 },
            'packages/semi-ai-vue/**': { statements: 96, branches: 88, functions: 94, lines: 96 },
        },
    },
};
