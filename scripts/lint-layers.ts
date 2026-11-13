// Import layers of the foundation packages (type imports count too, so every dependency stays visible):
// 1. base/, utils/, locale/ and theme/ never import anything under components/.
// 2. A component never imports another component (a foundation component imported by the AI foundation included).
// Both rules accept a pair listed in `exceptions`.
// 3. An exception no import uses any more is stale and fails, so the list shrinks with the code.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseSync } from 'vite/rolldown/utils';

type Exception = { from: string; to: string; reason: string };

// Nodes are `<package>/components/<name>`; the foundation `semi-foundation` and the AI one `semi-ai-foundation` are different packages even when a component name repeats
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

const listFiles = (pathspec: string) =>
    spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', pathspec], { encoding: 'utf8' })
        .stdout.split('\n')
        // --cached still lists files deleted in the worktree but not yet staged
        .filter((file) => file && fs.existsSync(file));

// Returns [package, source-relative path] of the file a specifier points to, or undefined for third-party modules
const locate = (file: string, pkg: string, specifier: string): [string, string] | undefined => {
    if (specifier.startsWith('.')) {
        const src = `packages/shared/${pkg}/src`;
        return [pkg, path.relative(src, path.resolve(path.dirname(file), specifier))];
    }
    const match = /^@fibrae\/(semi-foundation|semi-ai-foundation)\/(.+)$/.exec(specifier);
    return match ? [match[1], match[2]] : undefined;
};

const used = new Set<Exception>();
let failed = false;

for (const pkg of packages) {
    const src = `packages/shared/${pkg}/src`;
    for (const file of listFiles(src).filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes('/__tests__/'))) {
        const [dir, name] = path.relative(src, file).split('/');
        if (!infraDirs.has(dir) && dir !== 'components') continue;

        const source = fs.readFileSync(file, 'utf8');
        const { module, errors } = parseSync(file, source);
        if (errors.length) {
            console.error(`${file}: ${errors[0].message}`);
            process.exit(1);
        }
        const requests = [...module.staticImports.map((item) => item.moduleRequest), ...module.staticExports.flatMap((item) => item.entries.map((entry) => entry.moduleRequest)), ...module.dynamicImports.map((item) => item.moduleRequest)];

        for (const request of requests) {
            if (!request) continue;
            const specifier = source.slice(request.start, request.end).replace(/^['"`]|['"`]$/g, '');
            const target = locate(file, pkg, specifier);
            const [targetDir, targetName] = target?.[1].split('/') ?? [];
            if (targetDir !== 'components') continue;

            // Infrastructure files are named by their path, components by their directory
            const from = dir === 'components' ? `${pkg}/components/${name}` : `${pkg}/${path.relative(src, file).replace(/\.tsx?$/, '')}`;
            const to = `${target![0]}/components/${targetName}`;
            if (from === to) continue;
            const exception = exceptions.find((item) => item.from === from && item.to === to);
            if (exception) used.add(exception);
            else {
                const line = source.slice(0, request.start).split('\n').length;
                console.error(dir === 'components' ? `${file}:${line}: ${from} imports ${to}; move the shared code to base/ or utils/, or list it in exceptions` : `${file}:${line}: ${dir}/ must not depend on components/ (${from} imports ${to}); move the code it uses down to base/ or utils/`);
                failed = true;
            }
        }
    }
}

for (const exception of exceptions) {
    if (!used.has(exception)) {
        console.error(`stale exception: ${exception.from} -> ${exception.to} is no longer imported; remove it from scripts/lint-layers.ts`);
        failed = true;
    }
}

if (failed) process.exit(1);
