import { typescriptRules } from '../base.ts';
import { frameworkFiles, frameworkSpecifiers, type FrameworkLint } from '../framework.ts';
import { jsxA11yRules } from '../jsx-a11y.ts';
import { vueComponentOrder } from './component-order.ts';
import { vueExemptions } from './exemptions.ts';

const files = frameworkFiles('vue', ['vue']);

// oxlint reads only the <script> of an SFC; the template rules are in ./eslint.ts
export const vue: FrameworkLint = {
    name: 'Vue',
    files,
    // Only the motion-v and tiptap bindings are Vue's; the editor core and extensions are framework-free
    imports: ['vue', '@vue/*', 'motion-v', '@tiptap/vue-3', '@testing-library/vue', '@test/utils/vue', '@tanstack/vue-virtual', '@fibrae/semi-*-vue', ...frameworkSpecifiers('vue', ['vue'])],
    packages: ['semi-ui-vue', 'semi-ai-vue', 'semi-icons-vue', 'semi-illustrations-vue'],
    overrides: [
        { files: ['**/*.vue'], rules: typescriptRules },
        {
            files: ['packages/{semi-ui-vue,semi-ai-vue}/**/*.tsx'],
            plugins: ['jsx-a11y'],
            rules: jsxA11yRules,
        },
        {
            files,
            plugins: ['vue'],
            rules: {
                // Props stay one reactive object so it can be handed whole to foundations and child components
                'vue/define-props-destructuring': ['error', { destructure: 'never' }],
                'vue/define-props-declaration': ['error', 'type-based'],
                'vue/define-emits-declaration': ['error', 'type-based'],
                'vue/require-typed-ref': 'error',
                'vue/no-import-compiler-macros': 'error',
                'vue/no-reserved-component-names': 'off',
            },
        },
    ],
    exemptions: vueExemptions,
    componentOrder: vueComponentOrder,
    typecheck: 'vue-tsc',
};
