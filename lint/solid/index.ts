import preset from 'eslint-plugin-solid/configs/typescript';
import { frameworkFiles, frameworkSpecifiers, type FrameworkLint } from '../framework.ts';
import { jsxA11yRules } from '../jsx-a11y.ts';
import { solidComponentOrder } from './component-order.ts';
import { solidExemptions, solidIconOnClickExemptions } from './exemptions.ts';

const files = frameworkFiles('solid');

// The plugin's TypeScript preset; its warnings fail `--deny-warnings` anyway, so every rule it enables is an error
const solidRules = Object.fromEntries(
    Object.entries(preset.rules ?? {})
        .filter(([, setting]) => (Array.isArray(setting) ? setting[0] : setting))
        .map(([rule, setting]) => [rule, Array.isArray(setting) ? ['error', ...setting.slice(1)] : 'error'])
);

export const solid: FrameworkLint = {
    name: 'Solid',
    files,
    // Only the runtime and test bindings; the build plugin (unplugin-solid) is imported by framework-free config
    imports: ['solid-js', '@solidjs/testing-library', '@test/utils/solid', '@tanstack/solid-virtual', '@fibrae/semi-*-solid', ...frameworkSpecifiers('solid')],
    packages: ['semi-ui-solid', 'semi-ai-solid', 'semi-icons-solid', 'semi-illustrations-solid'],
    overrides: [
        {
            files,
            plugins: ['jsx-a11y'],
            jsPlugins: ['eslint-plugin-solid'],
            rules: { ...solidRules, ...jsxA11yRules },
        },
    ],
    exemptions: solidExemptions,
    componentOrder: solidComponentOrder,
    iconOnClickExemptions: solidIconOnClickExemptions,
};
