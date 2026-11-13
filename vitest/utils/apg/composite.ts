import { accessibleName, describe, isDisabled, roleOf, tabStops } from './aria';
import { type Context, keyLabel, stopped } from './context';

/** A composite widget: its container, its items as they are now, and how problems name them. */
export interface Composite {
    container: Element;
    items: () => Element[];
    /** What an item is called in a problem, like "option". */
    noun: string;
    /** The APG page a problem cites. */
    source: string;
}

export interface Arrows {
    next: string;
    previous: string;
}

/**
 * The item that is current under either focus model: the focused item (roving tabindex), or the one that the focused
 * element's `aria-activedescendant` names.
 */
export function currentItem(ctx: Context, composite: Composite) {
    const active = ctx.active();
    const items = composite.items();
    const descendant = active?.getAttribute('aria-activedescendant');
    if (descendant) {
        return items.find((item) => item.id === descendant);
    }
    // The innermost item holding focus, since a tree item contains its children
    return active ? (items.find((item) => item === active) ?? items.filter((item) => item.contains(active)).at(-1)) : undefined;
}

// The items from `start` one way up to the first enabled one; disabled items on the way count, since the APG lets them take focus
function scan(items: Element[], start: number, step: number) {
    const passed: Element[] = [];
    for (let index = start; index >= 0 && index < items.length; index += step) {
        passed.push(items[index]);
        if (!isDisabled(items[index])) {
            return { passed, reached: true };
        }
    }
    return { passed, reached: false };
}

function stepTargets(items: Element[], index: number, forward: boolean, wraps: boolean | 'optional') {
    const step = forward ? 1 : -1;
    const ahead = scan(items, index + step, step);
    if (ahead.reached) {
        return ahead.passed;
    }
    const around = scan(items, forward ? 0 : items.length - 1, step).passed;
    const stays = [items[index], ...ahead.passed];
    if (wraps === true) {
        return [...ahead.passed, ...around];
    }
    return wraps === false ? stays : [...stays, ...around];
}

export function checkTabStop(ctx: Context, composite: Composite, required = true) {
    const { container, noun, source } = composite;
    const stops = tabStops(container);
    if (stops.length > 1) {
        ctx.problem(container, `有 ${stops.length} 个 Tab 停靠点（${stops.map(describe).join('、')}），组合控件只有一个，其余用方向键移动（APG ${source}）`);
    } else if (!stops.length && required) {
        ctx.problem(container, `没有 Tab 停靠点，需要一个 ${noun} 可被 Tab 聚焦，或容器自身带 aria-activedescendant（APG ${source}）`);
    } else if (stops.length === 1 && container.hasAttribute('aria-activedescendant') && stops[0] !== container) {
        ctx.problem(stops[0], `获得了 Tab 焦点，但容器带 aria-activedescendant 时应由 ${roleOf(container)} 自身承担（APG ${source}）`);
    }
}

/** Focuses the composite's tab stop, as Tab would, and returns the item that is current. */
export function enter(ctx: Context, composite: Composite) {
    const stop = tabStops(composite.container)[0] ?? composite.items().find((item) => !isDisabled(item));
    if (!stop) {
        throw stopped;
    }
    ctx.focus(stop);
    return currentItem(ctx, composite);
}

/** Presses a key and checks the current item moved to one of `allowed`. */
async function expectMove(ctx: Context, composite: Composite, key: string, allowed: Element[], expected: string, unchangedOk = false) {
    const from = currentItem(ctx, composite);
    await ctx.press(key);
    const to = currentItem(ctx, composite);
    if (to && (allowed.includes(to) || (unchangedOk && to === from))) {
        return to;
    }
    const outcome = !to ? `焦点去了 ${describe(ctx.active())}，不在任何 ${composite.noun} 上` : to === from ? '焦点没有移动' : `焦点去了 ${describe(to)}`;
    ctx.problem(from ?? composite.container, `按 ${keyLabel(key)} 应移到${expected}（${describe(allowed[0])}），但${outcome}（APG ${composite.source}）`);
    if (!to) {
        throw stopped;
    }
    return to;
}

/** Presses a key that moves one item forward or back. Without a current item, the first enabled one or a selected one is fine. */
export function expectStep(ctx: Context, composite: Composite, key: string, forward: boolean, wraps: boolean | 'optional') {
    const items = composite.items();
    const from = currentItem(ctx, composite);
    const index = from ? items.indexOf(from) : -1;
    const allowed = index < 0 ? [...scan(items, 0, 1).passed, ...items.filter((item) => item.getAttribute('aria-selected') === 'true' || item.getAttribute('aria-checked') === 'true')] : stepTargets(items, index, forward, wraps);
    const expected = index < 0 ? `第一个${composite.noun}` : `${forward ? '下' : '上'}一个${composite.noun}`;
    const step = forward ? 1 : -1;
    const wrapsHere = wraps === true && index >= 0 && !scan(items, index + step, step).reached;
    return expectMove(ctx, composite, key, allowed, wrapsHere ? `${expected}（到末尾要循环）` : expected);
}

export interface Moves {
    next: string[];
    previous: string[];
    wraps: boolean | 'optional';
    /** Whether the pattern has Home and End at all; false walks to the last item a step at a time instead. */
    homeEnd: boolean;
    /** Runs after every move, for what a move also changes. */
    onMove?: (key: string, item: Element) => void;
}

/** From the current item: Home, the next and previous arrows, End, then past the end and back. */
export async function checkNavigation(ctx: Context, composite: Composite, moves: Moves) {
    const items = composite.items();
    if (items.length < 2) {
        return;
    }
    const step = async (key: string, forward: boolean) => {
        const to = await expectStep(ctx, composite, key, forward, moves.wraps);
        moves.onMove?.(key, to);
    };
    // Home and End are optional in most patterns, so a widget that ignores them passes unless `homeEnd` is set
    const jump = async (key: 'Home' | 'End') => {
        const all = composite.items();
        const allowed = key === 'Home' ? scan(all, 0, 1).passed : scan(all, all.length - 1, -1).passed;
        const to = await expectMove(ctx, composite, key, allowed, `${key === 'Home' ? '第一个' : '最后一个'}${composite.noun}`, !ctx.options.homeEnd);
        moves.onMove?.(key, to);
    };
    if (moves.homeEnd) {
        await jump('Home');
    }
    for (const key of moves.next) {
        await step(key, true);
    }
    for (const key of moves.previous) {
        await step(key, false);
    }
    if (moves.homeEnd) {
        await jump('End');
    } else {
        for (let guard = items.length; guard > 0; guard--) {
            const all = composite.items();
            if (!scan(all, all.indexOf(currentItem(ctx, composite)!) + 1, 1).reached) {
                break;
            }
            await step(moves.next[0], true);
        }
    }
    await step(moves.next[0], true);
    await step(moves.previous[0], false);
}

/** Moves to `target` with the arrows. */
export async function goTo(ctx: Context, composite: Composite, target: Element, arrows: Arrows) {
    for (let guard = composite.items().length * 2; guard > 0; guard--) {
        const items = composite.items();
        const current = currentItem(ctx, composite);
        if (!current || current === target || !items.includes(target)) {
            return;
        }
        await ctx.press(items.indexOf(target) > items.indexOf(current) ? arrows.next : arrows.previous);
    }
}

const initialOf = (el: Element) => accessibleName(el).charAt(0).toLowerCase();

/** Types the first letter of an item's name that only that item starts with. */
export async function checkTypeahead(ctx: Context, composite: Composite, arrows: Arrows) {
    if (!ctx.options.typeahead) {
        return;
    }
    const items = composite.items();
    const unique = items.filter((item) => !isDisabled(item) && /^[a-z0-9]$/.test(initialOf(item)) && items.filter((other) => initialOf(other) === initialOf(item)).length === 1);
    const index = items.indexOf(currentItem(ctx, composite)!);
    if (unique.length === 1 && unique[0] === items[index]) {
        await ctx.press(index < items.length - 1 ? arrows.next : arrows.previous);
    }
    const from = currentItem(ctx, composite);
    const target = unique.find((item) => item !== from);
    if (!target) {
        return;
    }
    const letter = initialOf(target);
    await ctx.press(letter);
    if (currentItem(ctx, composite) !== target) {
        ctx.problem(from ?? composite.container, `输入 "${letter}" 应移到名称以它开头的 ${describe(target)}（APG ${composite.source} 的 type-ahead）`);
    }
}
