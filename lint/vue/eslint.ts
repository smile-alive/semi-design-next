import type { Linter } from 'eslint';
import vue from 'eslint-plugin-vue';
import accessibility from 'eslint-plugin-vuejs-accessibility';
import { builtinOwnLine } from './builtin-own-line.ts';
import { vueExemptions } from './exemptions.ts';

// SFC templates, which oxlint cannot parse (D-2); `overlappingRules` turns off what oxlint checks in the script
export function vueEslint(overlappingRules: Linter.Config[]): Linter.Config[] {
    return [
        ...vue.configs['flat/essential'].map((config) => ({ ...config, files: ['**/*.vue'] })),
        ...accessibility.configs['flat/recommended'],
        ...overlappingRules.map((config) => ({
            ...config,
            files: config.files ? config.files.map((pattern) => ['**/*.vue', ...[pattern].flat()]) : ['**/*.vue'],
        })),
        {
            files: ['**/*.vue'],
            languageOptions: { parserOptions: { parser: '@typescript-eslint/parser' } },
            plugins: { semi: { rules: { 'builtin-own-line': builtinOwnLine } } },
            rules: {
                'semi/builtin-own-line': 'error',
                // Core no-unused-vars counts the parameters of a function type as unused; vue-tsc's noUnusedParameters checks SFC parameters
                'no-unused-vars': ['error', { ignoreRestSiblings: true, args: 'none', caughtErrors: 'none' }],
                // D-2: components keep Semi's names, including single words and reserved DOM names such as Nav
                'vue/multi-word-component-names': 'off',
                'vue/no-reserved-component-names': 'off',
                'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
                'vue/no-useless-v-bind': 'error',
                'vue/no-useless-mustaches': 'error',
                'vue/prefer-true-attribute-shorthand': ['error', 'always'],
                'vue/v-bind-style': ['error', 'shorthand', { sameNameShorthand: 'never' }],
                'vue/v-on-style': ['error', 'shorthand'],
                'vue/v-slot-style': ['error', 'shorthand'],
                'vue/component-name-in-template-casing': ['error', 'PascalCase'],
                'vue/attribute-hyphenation': ['error', 'never'],
                'vue/v-on-event-hyphenation': ['error', 'never'],
                'vue/attributes-order': ['error', { alphabetical: true }],
                'vue/no-template-target-blank': 'error',
                // Guard the current SFC conventions: script before template, macros declared by type, no stray blocks
                'vue/padding-line-between-blocks': 'error',
                'vue/block-order': ['error', { order: ['script', 'template'] }],
                'vue/prefer-define-options': 'error',
                'vue/define-props-declaration': 'error',
                'vue/define-emits-declaration': 'error',
                'vue/require-macro-variable-name': 'error',
                'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots', 'defineModel'], defineExposeLast: true }],
                'vue/prefer-use-template-ref': 'error',
            },
        },
        ...vueExemptions.map(({ files, templateOff = [] }) => ({
            files: files.map((file) => ['**/*.vue', file]),
            rules: Object.fromEntries(templateOff.map((rule) => [rule, 'off' as const])),
        })),
    ];
}
