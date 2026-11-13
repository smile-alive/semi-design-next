import { checkbox } from './checkbox';
import { combobox } from './combobox';
import { type CheckOptions, type Context, createContext, type Pattern, stopped } from './context';
import { alertdialog, dialog } from './dialog';
import { accordion, disclosure } from './disclosure';
import { listbox } from './listbox';
import { menu, menubar } from './menu';
import { radioGroup } from './radio-group';
import { slider } from './slider';
import { switchPattern } from './switch';
import { tabs } from './tabs';
import { toolbar } from './toolbar';
import { tree } from './tree';

export type { CheckOptions, Pattern };

const checks: Record<Pattern, (ctx: Context) => Promise<void>> = {
    tabs,
    menu,
    menubar,
    listbox,
    combobox,
    tree,
    'radio-group': radioGroup,
    toolbar,
    dialog,
    alertdialog,
    disclosure,
    accordion,
    slider,
    switch: switchPattern,
    checkbox,
};

/**
 * Checks a rendered widget against its WAI-ARIA Authoring Practices pattern and throws one Error that lists every
 * problem, one line per element and rule. It covers what axe cannot: required roles, states and id references, then the
 * pattern's keys pressed from the focused element.
 *
 * `root` is the element that carries the pattern, or a container of it; a popup that is rendered elsewhere is found
 * through `aria-controls`. Menus, dialogs and comboboxes are checked open, so open them first. Id references are
 * resolved in the root's own document or shadow root, while the focused element is read through open shadow roots.
 *
 * Two focus models are accepted, as the APG allows both. With `aria-activedescendant` on the focused container or
 * input, the current item is the element it names and DOM focus stays put (combobox, listbox, tree, grid). Otherwise
 * the current item is `document.activeElement` (roving tabindex: tabs, menu, toolbar, radio group).
 *
 * Checking moves focus, highlight and selection, and pressing Enter, Space or Escape can toggle a value or close a
 * popup (turn that off with `actions: false`). The state is not restored afterwards, so render a fresh widget per call.
 * Await `press` until the widget has re-rendered; the checker never waits on its own.
 *
 * @example
 * // jsdom, with @testing-library/user-event
 * const user = userEvent.setup();
 * const press = (key: string) => user.keyboard(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`);
 * await checkPattern('tabs', container, { press });
 * // browser tests: wrap userEvent.keyboard from 'vite-plus/test/browser' the same way
 */
export async function checkPattern(pattern: Pattern, root: Element, options: CheckOptions) {
    const check = checks[pattern];
    if (!check) {
        throw new Error(`checkPattern 不支持 "${pattern}"，支持：${Object.keys(checks).join('、')}`);
    }
    const ctx = createContext(root, options);
    ctx.checkReferences();
    try {
        await check(ctx);
    } catch (error) {
        if (error !== stopped) {
            throw error;
        }
    }
    if (ctx.problems.size) {
        throw new Error(`${pattern} 模式有 ${ctx.problems.size} 处不符合 APG：\n${[...ctx.problems].map((problem) => `- ${problem}`).join('\n')}`);
    }
}
