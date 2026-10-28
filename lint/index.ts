import type { OxlintConfig, OxlintOverride } from 'vite-plus/lint';
import { baseLint, baseOverrides } from './base.ts';
import { boundaryOverrides } from './boundaries.ts';
import { exemptions } from './exemptions.ts';
import type { Exemption, FrameworkLint } from './framework.ts';
import { react } from './react/index.ts';
import { solid } from './solid/index.ts';
import { vue } from './vue/index.ts';

// A new framework gets its own lint/<name>/ module and an entry here
export const frameworks: FrameworkLint[] = [react, vue, solid];

// oxlint ignores override rules of plugins enabled neither at top level nor in the override, so an exemption lists them
function exemptionOverride({ files, off }: Exemption, framework?: FrameworkLint): OxlintOverride {
    const plugins = [...new Set(framework?.overrides.flatMap((override) => override.plugins ?? []))];
    return {
        files,
        ...(off.some((rule) => plugins.some((plugin) => rule.startsWith(`${plugin}/`))) && { plugins }),
        rules: Object.fromEntries(off.map((rule) => [rule, 'off' as const])),
    };
}

export const lintConfig = {
    ...baseLint,
    overrides: [
        ...baseOverrides,
        ...frameworks.flatMap((framework) => framework.overrides),
        ...boundaryOverrides(frameworks),
        // Last, so an exemption wins over every rule that matches its files
        ...exemptions.map((exemption) => exemptionOverride(exemption)),
        ...frameworks.flatMap((framework) => framework.exemptions.map((exemption) => exemptionOverride(exemption, framework))),
    ],
} satisfies OxlintConfig;
