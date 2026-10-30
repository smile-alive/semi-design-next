import type { TestProjectInlineConfiguration } from 'vite-plus';
import { frameworks } from '../lint/index.ts';
import { semiInlineJsonWorker, semiStubStyles } from '../vite.semi.ts';
import { browserBase, browserStyles, jsdomBase, nodeBase, type TestFramework } from './framework.ts';
import { react } from './react/index.ts';
import { solid } from './solid/index.ts';
import { svelte } from './svelte/index.ts';
import { vue } from './vue/index.ts';

// A new framework adds vitest/<name>/index.ts and an entry here
export const testFrameworks: TestFramework[] = [react, vue, solid, svelte];

// Framework-free packages only; framework files are excluded by lint's frameworks so each file lands in one project
const commonPackages = '{semi-foundation,semi-ai-foundation,semi-icons-core,semi-animation,semi-polyfill,semi-scss-compile,semi-theme-shared}';
const frameworkFiles = frameworks.flatMap((framework) => framework.files);

const common: TestProjectInlineConfiguration = {
    extends: true,
    plugins: [semiStubStyles],
    test: {
        ...jsdomBase,
        name: 'common',
        include: [`packages/${commonPackages}/**/__tests__/**/*.test.{ts,tsx}`, 'website/src/**/__tests__/**/*.test.ts', 'lint/**/__tests__/**/*.test.ts'],
        exclude: [...jsdomBase.exclude, ...frameworkFiles],
        setupFiles: ['./vitest/vitest.setup.ts'],
    },
};

const commonSsr: TestProjectInlineConfiguration = {
    extends: true,
    plugins: [semiStubStyles],
    test: {
        ...nodeBase,
        name: 'common-ssr',
        include: [`packages/${commonPackages}/**/__tests__/**/*.ssr.test.{ts,tsx}`],
        exclude: [...nodeBase.exclude, ...frameworkFiles],
    },
};

// jsdomBase's exclude drops browser tests, so the browser project sets its own
const commonBrowser: TestProjectInlineConfiguration = {
    extends: true,
    css: browserStyles,
    plugins: [semiInlineJsonWorker],
    test: {
        ...browserBase(),
        name: 'common-browser',
        include: [`packages/${commonPackages}/**/__tests__/**/*.browser.test.{ts,tsx}`],
        exclude: ['**/node_modules/**', ...frameworkFiles],
        setupFiles: ['./vitest/browser.setup.ts'],
    },
};

export const testProjects = [common, commonSsr, commonBrowser, ...testFrameworks.flatMap((framework) => framework.projects)];

const coverages = testFrameworks.flatMap((framework) => (framework.coverage ? [framework.coverage] : []));

export const coverageFiles = {
    include: ['packages/{semi-foundation,semi-ai-foundation}/src/**/*.{js,jsx,mjs,ts,tsx}', ...coverages.flatMap((coverage) => coverage.include)],
    exclude: ['packages/**/__tests__/**', 'packages/semi-foundation/src/locale/**', ...coverages.flatMap((coverage) => coverage.exclude)],
    // Measured coverage rounded down; raise as coverage grows
    thresholds: Object.assign({ statements: 97, branches: 92, functions: 97, lines: 97 }, ...coverages.map((coverage) => coverage.thresholds)),
};
