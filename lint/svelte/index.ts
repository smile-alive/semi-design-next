import { typescriptRules } from '../base.ts';
import { frameworkFiles, frameworkSpecifiers, type FrameworkLint } from '../framework.ts';
import { svelteComponentOrder } from './component-order.ts';
import { svelteExemptions } from './exemptions.ts';

const files = frameworkFiles('svelte', ['svelte']);

// oxlint reads only the <script> of a .svelte file; the template rules are in ./eslint.ts
export const svelte: FrameworkLint = {
    name: 'Svelte',
    files,
    // Only the runtime and test bindings; the build plugins (@sveltejs/*) and the ESLint plugin are imported by framework-free config
    imports: ['svelte', '@testing-library/svelte', '@test/utils/svelte', '@tanstack/svelte-virtual', '@dnd-kit/svelte', '@fibrae/semi-*-svelte', ...frameworkSpecifiers('svelte', ['svelte'])],
    packages: ['semi-ui-svelte', 'semi-ai-svelte', 'semi-icons-svelte', 'semi-illustrations-svelte'],
    overrides: [
        { files: ['**/*.svelte'], rules: typescriptRules },
        // svelte-package publishes specifiers as written, and Node, webpack's fullySpecified and TS nodenext need the extension
        { files: ['packages/semi-*-svelte/src/**'], rules: { 'import/extensions': ['error', 'ignorePackages', { checkTypeImports: true }] } },
        { files: ['packages/semi-*-svelte/src/**/__tests__/**'], rules: { 'import/extensions': 'off' } },
    ],
    exemptions: svelteExemptions,
    componentOrder: svelteComponentOrder,
    typecheck: 'svelte-check',
};
