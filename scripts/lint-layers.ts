// Checks the import layers of the foundation packages and that every listed exception is still used.
// Usage: node scripts/lint-layers.ts
// Output: one `file:line: message` per violation on stderr, exit code 1 on a forbidden import, an unparsable file or a stale exception.
// Rules, type imports included: base/, utils/, locale/ and theme/ never import anything under components/, and a
// component never imports another component (the AI foundation importing a foundation component included).
// A pair listed in `exceptions` is accepted.
import fs from 'node:fs';
import path from 'node:path';
import { parseSync } from 'vite/rolldown/utils';
import { lineAt } from './lib/ast.ts';
import { gitFiles } from './lib/git-files.ts';

type Exception = { from: string; to: string; reason: string };

// Nodes are `<package>/components/<name>`; the two foundation packages are distinct even when a component name repeats
const exceptions: Exception[] = [
    { from: 'semi-foundation/components/cascader', to: 'semi-foundation/components/tree', reason: 'Cascader reuses the Tree checked-state and key-path data processing' },
    { from: 'semi-foundation/components/collapse', to: 'semi-foundation/components/collapsible', reason: 'Collapse is built on the Collapsible foundation' },
    { from: 'semi-foundation/components/config-provider', to: 'semi-foundation/components/grid', reason: 'ConfigProvider observes the breakpoints Grid defines' },
    { from: 'semi-foundation/components/date-picker', to: 'semi-foundation/components/popover', reason: 'DatePicker opens its panel in a Popover' },
    { from: 'semi-foundation/components/feedback', to: 'semi-foundation/components/checkbox', reason: 'Feedback reuses the Checkbox value type' },
    { from: 'semi-foundation/components/feedback', to: 'semi-foundation/components/radio', reason: 'Feedback reuses the Radio change event type' },
    { from: 'semi-foundation/components/input-number', to: 'semi-foundation/components/input', reason: 'InputNumber is built on Input and shares its class names and constants' },
    { from: 'semi-foundation/components/pagination', to: 'semi-foundation/components/tooltip', reason: 'Pagination passes Tooltip positions through' },
    { from: 'semi-foundation/components/select', to: 'semi-foundation/components/tooltip', reason: 'Select renders its list in a Tooltip' },
    { from: 'semi-foundation/components/table', to: 'semi-foundation/components/checkbox', reason: 'Table selection columns render Checkbox' },
    { from: 'semi-foundation/components/table', to: 'semi-foundation/components/tree', reason: 'Table tree data and row selection reuse the Tree entity and checked-state processing' },
    { from: 'semi-foundation/components/tabs', to: 'semi-foundation/components/overflow-list', reason: 'Tabs collapse overflowing tabs with OverflowList' },
    { from: 'semi-foundation/components/transfer', to: 'semi-foundation/components/tree', reason: 'Transfer tree mode reuses the Tree value type' },
    { from: 'semi-foundation/components/tree-select', to: 'semi-foundation/components/tree', reason: 'TreeSelect reuses the Tree data processing' },
    { from: 'semi-ai-foundation/components/ai-chat-dialogue', to: 'semi-ai-foundation/components/ai-chat-input', reason: 'AIChatDialogue exchanges messages with AIChatInput through its types' },
    { from: 'semi-ai-foundation/components/ai-chat-input', to: 'semi-foundation/components/upload', reason: 'AIChatInput attaches files through the Upload foundation' },
    { from: 'semi-ai-foundation/components/chat', to: 'semi-foundation/components/upload', reason: 'Chat input box attaches files through the Upload foundation' },
];

const packages = ['semi-foundation', 'semi-ai-foundation'];
const infraDirs = new Set(['base', 'utils', 'locale', 'theme']);

const sourceDir = (pkg: string) => `packages/shared/${pkg}/src`;

function locate(file: string, pkg: string, specifier: string): [string, string] | undefined {
    if (specifier.startsWith('.')) return [pkg, path.relative(sourceDir(pkg), path.resolve(path.dirname(file), specifier))];
    const match = /^@fibrae\/(semi-foundation|semi-ai-foundation)\/(.+)$/.exec(specifier);
    return match ? [match[1], match[2]] : undefined;
}

// Static imports, re-exports and dynamic imports as [specifier, source offset]
function moduleRequests(file: string, source: string) {
    const { module, errors } = parseSync(file, source);
    if (errors.length) {
        console.error(`${file}: ${errors[0].message}`);
        process.exit(1);
    }
    return [...module.staticImports.map((item) => item.moduleRequest), ...module.staticExports.flatMap((item) => item.entries.map((entry) => entry.moduleRequest)), ...module.dynamicImports.map((item) => item.moduleRequest)]
        .filter((request) => request !== null)
        .map((request): [string, number] => [source.slice(request.start, request.end).replace(/^['"`]|['"`]$/g, ''), request.start]);
}

const used = new Set<Exception>();
let failed = false;

for (const pkg of packages) {
    const src = sourceDir(pkg);
    const sourceFiles = gitFiles(src).filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes('/__tests__/'));

    for (const file of sourceFiles) {
        const relative = path.relative(src, file);
        const [dir, name] = relative.split('/');
        if (!infraDirs.has(dir) && dir !== 'components') continue;

        const from = dir === 'components' ? `${pkg}/components/${name}` : `${pkg}/${relative.replace(/\.tsx?$/, '')}`;
        const source = fs.readFileSync(file, 'utf8');

        for (const [specifier, offset] of moduleRequests(file, source)) {
            const target = locate(file, pkg, specifier);
            if (!target) continue;
            const [targetDir, targetName] = target[1].split('/');
            if (targetDir !== 'components') continue;

            const to = `${target[0]}/components/${targetName}`;
            if (from === to) continue;
            const exception = exceptions.find((item) => item.from === from && item.to === to);
            if (exception) {
                used.add(exception);
                continue;
            }
            const where = `${file}:${lineAt(source, offset)}`;
            console.error(dir === 'components' ? `${where}: ${from} imports ${to}; move the shared code to base/ or utils/, or list it in exceptions` : `${where}: ${dir}/ must not depend on components/ (${from} imports ${to}); move the code it uses down to base/ or utils/`);
            failed = true;
        }
    }
}

for (const exception of exceptions.filter((item) => !used.has(item))) {
    console.error(`stale exception: ${exception.from} -> ${exception.to} is no longer imported; remove it from scripts/lint-layers.ts`);
    failed = true;
}

if (failed) process.exit(1);
