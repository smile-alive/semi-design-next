// A component that renders a `trigger="custom"` Tooltip, Popover or Dropdown reports a click outside through its
// `onClickOutSide`, which already counts the trigger, the popup and the popups nested in them as inside. A
// useClickOutside of its own next to it is a second listener with its own idea of inside, so it is rejected unless
// the component is listed in `exceptions`. An exception no file needs any more is stale and fails.
// Matched as text: .vue and .svelte templates are not parsed here, and both strings are specific enough.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

type Exception = { component: string; reason: string };

// `component` is the path under `src/components/` without the extension, shared by the four framework packages
const exceptions: Exception[] = [
    { component: 'date-picker/date-picker', reason: 'the inside region is the whole DatePicker root (range inputs, prefix, insetLabel), larger than the Popover trigger' },
    { component: 'time-picker/time-picker', reason: 'the inside region is the whole TimePicker root, larger than the Popover trigger' },
    { component: 'calendar/month-calendar', reason: 'one listener serves every day cell: the open card and the "more" button that owns it are inside, not each cell\'s Popover trigger' },
    { component: 'tree-select/tree-select', reason: 'while focused but closed there is no popup, and the blur a click outside reports still has to come from a listener' },
];

const customTrigger = /trigger(=["']custom["']|=\{["']custom["']\}|:\s*["']custom["'])/;
const clickOutside = /\buseClickOutside\(/;

const files = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'packages/semi-*-*/src/components/**'], { encoding: 'utf8' })
    .stdout.split('\n')
    // --cached still lists files deleted in the worktree but not yet staged
    .filter((file) => /\.(tsx|vue|svelte)$/.test(file) && !file.includes('/__tests__/') && fs.existsSync(file));

const used = new Set<Exception>();
let failed = false;

for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    if (!customTrigger.test(source) || !clickOutside.test(source)) continue;
    const component = file.replace(/^packages\/[^/]+\/src\/components\//, '').replace(/\.(tsx|vue|svelte)$/, '');
    const exception = exceptions.find((entry) => entry.component === component);
    if (exception) {
        used.add(exception);
    } else {
        console.error(`${file}: a trigger="custom" popup reports clicks outside through onClickOutSide; drop the own useClickOutside, or list the component in scripts/lint-click-outside.ts with the reason its inside region differs`);
        failed = true;
    }
}

for (const exception of exceptions.filter((entry) => !used.has(entry))) {
    console.error(`scripts/lint-click-outside.ts: the exception for ${exception.component} matches no file any more; delete it`);
    failed = true;
}

if (failed) process.exit(1);
