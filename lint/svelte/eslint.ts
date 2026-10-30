import tsParser from '@typescript-eslint/parser';
import type { Linter } from 'eslint';
import svelte from 'eslint-plugin-svelte';
import { svelteExemptions } from './exemptions.ts';

// .svelte templates, which oxlint cannot parse; `overlappingRules` turns off what oxlint checks in the script.
// Template accessibility is svelte-check's job: eslint-plugin-svelte has no a11y rules
export function svelteEslint(overlappingRules: Linter.Config[]): Linter.Config[] {
    return [
        ...svelte.configs['flat/recommended'].map((config) => ({ ...config, files: ['**/*.svelte'] })),
        ...overlappingRules.map((config) => ({
            ...config,
            files: config.files ? config.files.map((pattern) => ['**/*.svelte', ...[pattern].flat()]) : ['**/*.svelte'],
        })),
        {
            files: ['**/*.svelte'],
            languageOptions: { parserOptions: { parser: tsParser } },
            rules: {
                // Core no-unused-vars counts the parameters of a function type as unused; svelte-check's noUnusedParameters checks them
                'no-unused-vars': ['error', { ignoreRestSiblings: true, args: 'none', caughtErrors: 'none' }],
                // Sorts only between spreads (needs the patch in pnpm-workspace.yaml): a spread's position decides what it overrides.
                // `<svelte:element this>` stays first, where the formatter puts it.
                // `<script lang>` precedes `generics`: svelte2tsx finds TS with /<script\s+[^>]*?lang=/, which a `>` in the generics
                // stops, and svelte-package then emits `export {}` as the component's declaration
                'svelte/sort-attributes': ['error', { order: ['this', 'lang', { match: ['!this', '!/^on[a-z]/u'], sort: 'alphabetical' }, { match: ['/^on[a-z]/u'], sort: 'alphabetical' }] }],
            },
        },
        ...svelteExemptions.map(({ files, templateOff = [] }) => ({
            files: files.map((file) => ['**/*.svelte', file]),
            rules: Object.fromEntries(templateOff.map((rule) => [rule, 'off' as const])),
        })),
    ];
}
