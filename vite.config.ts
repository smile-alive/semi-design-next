import path from 'node:path';
import { defineConfig } from 'vite-plus';
import { lintConfig } from './lint';
import { rootDir, semiSourceAliases } from './vite.semi';
import { coverageFiles, testProjects } from './vitest';

function resolve(p: string) {
    return path.resolve(rootDir, p);
}

export default defineConfig({
    // Separate cache: a plain run would delete the pre-bundled deps a coverage run is serving (different config hash)
    ...(process.argv.includes('--coverage') && { cacheDir: 'node_modules/.vite/coverage' }),
    optimizeDeps: {
        // The scanner skips JSX in .js and misses the JSX runtime imports, so deps are found mid-run and the page reloads
        rolldownOptions: { moduleTypes: { '.js': 'jsx' }, transform: { jsx: { runtime: 'automatic' } } },
    },
    resolve: {
        alias: [{ find: /^lottie-web$/, replacement: resolve('vitest/__mocks__/lottie.ts') }, ...semiSourceAliases, { find: '@test', replacement: resolve('vitest') }],
    },
    test: {
        maxWorkers: 2,
        restoreMocks: true,
        unstubGlobals: true,
        attachmentsDir: 'tmp/vitest/attachments',
        coverage: {
            provider: 'istanbul',
            reportsDirectory: './vitest/coverage',
            // Each framework module may add per-package thresholds
            ...coverageFiles,
        },
        projects: testProjects,
    },
    // package.json pins oxlint/oxfmt: vite-plus 1.0 bundles oxfmt 0.70, which strips JSDoc trailing spaces 0.72 keeps
    lint: lintConfig,
    fmt: {
        proseWrap: 'never',
        printWidth: 320,
        tabWidth: 4,
        trailingComma: 'es5',
        singleQuote: true,
        vueIndentScriptAndStyle: true,
        sortPackageJson: false,
        sortImports: {
            newlinesBetween: false,
            internalPattern: ['#/', '@test/'],
            customGroups: [
                {
                    groupName: 'semi-styles',
                    selector: 'side_effect_style',
                    elementNamePattern: ['@fibrae/semi-foundation/**', '@fibrae/semi-ai-foundation/**'],
                },
                {
                    groupName: 'styles',
                    selector: 'side_effect_style',
                },
                {
                    groupName: 'framework',
                    elementNamePattern: ['react', 'react/**', 'react-dom', 'react-dom/**', 'vue', 'vue/**', 'solid-js', 'solid-js/**', 'astro', 'astro/**', 'astro:*'],
                },
                {
                    groupName: 'semi-foundation',
                    elementNamePattern: ['@fibrae/semi-foundation', '@fibrae/semi-foundation/**', '@fibrae/semi-ai-foundation', '@fibrae/semi-ai-foundation/**'],
                },
                {
                    groupName: 'semi',
                    elementNamePattern: ['@fibrae/semi-*', '@fibrae/semi-*/**'],
                },
            ],
            groups: [
                'builtin',
                'framework',
                'external',
                'semi-foundation',
                // A component's own styles precede semi-icons-react and ../ child components to keep the cascade order
                'semi-styles',
                'semi',
                'internal',
                ['parent', 'sibling', 'index'],
                // Site, demo and icon package styles come last so they cascade after and override semi-ui-react styles
                'styles',
                'side_effect',
                'unknown',
            ],
        },
    },
    staged: {
        // *.d.ts files are lint-ignored, so a commit touching only them must not fail on "no files to lint"
        '*.{js,jsx,ts,tsx,mjs,cjs}': ['vp lint --fix --deny-warnings --no-error-on-unmatched-pattern', 'vp fmt'],
        '*.vue': ['vp lint --fix --deny-warnings', 'eslint --fix --max-warnings 0 --no-warn-ignored', 'vp fmt'],
        '*.{scss,css}': ['stylelint --fix --max-warnings 0', 'vp fmt'],
        '*.astro': 'stylelint --fix --max-warnings 0',
        // oxfmt ignores pnpm-lock.yaml, so a commit touching only it must not fail on "no target file"
        '*.{json,jsonc,yaml,yml,toml,md,mdx}': 'vp fmt --no-error-on-unmatched-pattern',
    },
});
