// Rejects components that pair a `trigger="custom"` popup with their own useClickOutside, unless listed as an exception.
// Usage: node scripts/lint-click-outside.ts
// Output: one message per offending file or stale exception on stderr, exit code 1 on any.
// A `trigger="custom"` Tooltip, Popover or Dropdown reports clicks outside through `onClickOutSide`, which already counts
// the trigger, the popup and nested popups as inside; an own useClickOutside is a second listener with its own idea of inside.
// Matched as text: .vue and .svelte templates are not parsed, and both strings are specific enough.
import fs from 'node:fs';
import { gitFiles } from './lib/git-files.ts';

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
const componentExtension = /\.(tsx|vue|svelte)$/;

const files = gitFiles('packages/semi-*-*/src/components/**').filter((file) => componentExtension.test(file) && !file.includes('/__tests__/'));

const componentOf = (file: string) => file.replace(/^packages\/[^/]+\/src\/components\//, '').replace(componentExtension, '');

const offenders = files.filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return customTrigger.test(source) && clickOutside.test(source);
});

const exceptionOf = (component: string) => exceptions.find((entry) => entry.component === component);
const unlisted = offenders.filter((file) => !exceptionOf(componentOf(file)));
const used = new Set(offenders.map((file) => exceptionOf(componentOf(file))));
const stale = exceptions.filter((entry) => !used.has(entry));

const messages = [
    ...unlisted.map((file) => `${file}: a trigger="custom" popup reports clicks outside through onClickOutSide; drop the own useClickOutside, or list the component in scripts/lint-click-outside.ts with the reason its inside region differs`),
    ...stale.map(({ component }) => `scripts/lint-click-outside.ts: the exception for ${component} matches no file any more; delete it`),
];

if (messages.length) {
    console.error(messages.join('\n'));
    process.exit(1);
}
