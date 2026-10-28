import type { OxlintOverride } from 'vite-plus/lint';
import type { ComponentOrder } from './component-order.ts';

// Rules turned off per file; each entry says why the flagged code must stay. List only rules that report there;
// drop an exemption once the file no longer errors.
export interface Exemption {
    files: string[];
    off: string[];
}

// One framework's lint configuration; override `files` globs are relative to the repository root.
export interface FrameworkLint {
    name: string;
    // From frameworkFiles. Files of no framework are framework-free
    files: string[];
    // Specifiers framework-free files and other frameworks may not import; gitignore-style, covering subpaths, and a
    // bare name matches the last path segment (`react` matches `@dnd-kit/react`)
    imports: string[];
    packages: string[];
    // Overrides for parts of the framework's files; `pnpm lint:scopes` fails when one reaches outside them
    overrides: OxlintOverride[];
    exemptions: Exemption[];
    componentOrder: ComponentOrder;
    // Icons whose onClick is a pointer shortcut for a keyboard path elsewhere, keyed by file (lint-private)
    iconOnClickExemptions?: Record<string, string | string[]>;
    // Type checker for this framework's tsconfigs, matched by the naming rule; tsc when absent
    typecheck?: 'vue-tsc';
}

// A file belongs to a framework by name alone: in a semi-*-<id> package, named <id>.* or *.<id>.*, or its extension
export function frameworkFiles(id: string, extensions: string[] = []) {
    return [`packages/semi-*-${id}/**`, `**/${id}.*`, `**/*.${id}.*`, ...extensions.map((extension) => `**/*.${extension}`)];
}

// frameworkFiles' naming rule as import specifiers, so relative paths into a framework's files hit the boundary
export function frameworkSpecifiers(id: string, extensions: string[] = []) {
    return [`**/semi-*-${id}/**`, `${id}.*`, `*.${id}`, `*.${id}.*`, ...extensions.map((extension) => `*.${extension}`)];
}
