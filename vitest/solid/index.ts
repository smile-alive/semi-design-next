import solidPlugin from 'unplugin-solid/vite';
import type { TestProjectInlineConfiguration } from 'vite-plus';
import { semiInlineJsonWorker, semiStubStyles } from '../../vite.semi.ts';
import { browserBase, browserStyles, compatBrowserProjects, jsdomBase, nodeBase, ssrTestFiles, testFiles, type TestFramework } from '../framework.ts';

// vitest serves modules, which turns on solid-refresh: it wraps every JSX expression of sources and tests in a memo
// component, so a value that is a DOM node in the published build and in a production app becomes an accessor
const solidOptions = { hot: false };

// With ssr on, the plugin compiles server transforms for Node and hydratable DOM code for the browser. Only the
// development build of solid-js reports a hydration mismatch, so it is pinned rather than inferred from the command
const solidSsrOptions = { ssr: true, hot: false, dev: true };

const hydrationFiles = '**/*.hydration.browser.test.*';

function browserProject(): TestProjectInlineConfiguration {
    return {
        extends: true,
        css: browserStyles,
        oxc: { jsx: 'preserve' },
        plugins: [solidPlugin(solidOptions), semiInlineJsonWorker],
        test: { ...browserBase(), name: 'solid-browser', include: testFiles('solid', true), exclude: ['**/node_modules/**', hydrationFiles], setupFiles: ['./vitest/browser.setup.ts', './vitest/solid/solid.setup.ts'] },
    };
}

export const solid: TestFramework = {
    projects: [
        {
            extends: true,
            // The Solid compiler owns JSX here; the root's automatic runtime would compile it to jsx() calls first
            oxc: { jsx: 'preserve' },
            // The plugin also sets jsdom and inlines solid-js so Node does not load its server build
            plugins: [solidPlugin(solidOptions), semiStubStyles],
            test: { ...jsdomBase, name: 'solid', include: testFiles('solid', false), setupFiles: ['./vitest/vitest.setup.ts', './vitest/solid/solid.setup.ts'] },
        },
        {
            extends: true,
            oxc: { jsx: 'preserve' },
            // Node loads the solid-js server build, the one a real server renders with
            plugins: [solidPlugin(solidSsrOptions), semiStubStyles],
            test: { ...nodeBase, name: 'solid-ssr', include: ssrTestFiles('solid') },
        },
        browserProject(),
        ...compatBrowserProjects('solid', browserProject),
        {
            extends: true,
            css: browserStyles,
            oxc: { jsx: 'preserve' },
            plugins: [solidPlugin(solidSsrOptions), semiInlineJsonWorker],
            // Every case's iframe loads the whole module graph again, about 350k requests per run when Vite marks
            // modules no-cache; under heavy machine load the browser was seen closing all vitest websockets mid-run.
            // Watch mode keeps no-cache: an edited module's importers keep their URLs, so a cached importer would be stale
            server: { headers: process.argv.includes('run') || process.argv.includes('--run') ? { 'Cache-Control': 'max-age=3600' } : {} },
            test: {
                ...browserBase(),
                name: 'solid-hydration-browser',
                include: [`packages/semi-*-solid/${hydrationFiles}`, `vitest/solid/${hydrationFiles}`],
                globalSetup: ['./vitest/solid/hydration-setup.ts'],
                setupFiles: ['./vitest/browser.setup.ts'],
            },
        },
    ],
    coverage: {
        include: ['packages/{semi-ui-solid,semi-ai-solid}/src/**/*.{ts,tsx}'],
        exclude: ['packages/{semi-ui-solid,semi-ai-solid}/src/index.ts'],
        // Solid packages carry their own thresholds on top of the global ones in vitest/index.ts
        thresholds: {
            'packages/semi-ui-solid/**': { statements: 99, branches: 91, functions: 97, lines: 99 },
            'packages/semi-ai-solid/**': { statements: 96, branches: 85, functions: 96, lines: 96 },
        },
    },
};
