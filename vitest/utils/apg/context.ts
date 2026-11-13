import { accessibleName, byId, danglingReferences, deepActiveElement, describe, ids, isGone, isUnreachable, roleOf, withRole } from './aria';

export type Pattern = 'tabs' | 'menu' | 'menubar' | 'listbox' | 'combobox' | 'tree' | 'radio-group' | 'toolbar' | 'dialog' | 'alertdialog' | 'disclosure' | 'accordion' | 'slider' | 'switch' | 'checkbox';

export interface CheckOptions {
    /** Presses one key on the focused element. Keys are `KeyboardEvent.key` values (`ArrowDown`, `Home`, ` `, `a`); the only chord is `Shift+Tab`. */
    press: (key: string) => Promise<void>;
    /** Text direction of the widget; right to left swaps the horizontal arrows. Defaults to `ltr`. */
    direction?: 'ltr' | 'rtl';
    /** Whether arrows wrap past the ends: `true` requires it, `false` forbids it, `'optional'` accepts either. Defaults to what the pattern's APG page says. */
    wraps?: boolean | 'optional';
    /** Require Home and End, which most APG composites list as optional. By default they are checked only when the widget reacts to them. */
    homeEnd?: boolean;
    /** Also check type-ahead, which the APG lists as optional. */
    typeahead?: boolean;
    /** Slider only: the one arrow pair that raises and lowers the value, for a widget that documents keys other than the APG's. Defaults to the APG pairs. */
    sliderKeys?: { increase: string; decrease: string };
    /** Press the keys that change a value or close a popup (Enter, Space, Escape). Defaults to `true`; `false` checks structure and navigation only. */
    actions?: boolean;
}

export type Orientation = 'horizontal' | 'vertical';

export const keyLabel = (key: string) => (key === ' ' ? 'Space' : key);

// Thrown to stop pressing keys once the rest would mean nothing, like after focus falls to the body
export const stopped = new Error('checkPattern stopped pressing keys.');

const defaultOrientation: Record<string, Orientation> = { listbox: 'vertical', menu: 'vertical', menubar: 'horizontal', slider: 'horizontal', tablist: 'horizontal', toolbar: 'horizontal', tree: 'vertical' };

// Widget roles a composite may not hold besides its own items, like a button in a listbox
const widgetRoles = new Set(['button', 'checkbox', 'combobox', 'gridcell', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'slider', 'switch', 'tab', 'textbox', 'treeitem']);

export function createContext(root: Element, options: CheckOptions) {
    const doc = root.ownerDocument;
    const problems = new Set<string>();
    // Where id references are checked after every key: the root, and popups that render elsewhere
    const watched = new Set<Element>([root]);
    const active = () => deepActiveElement(doc);

    const problem = (el: Element | null | undefined, rule: string) => {
        problems.add(`${describe(el)}: ${rule}`);
    };

    const checkReferences = () => {
        for (const scope of watched) {
            for (const { el, attribute, id } of danglingReferences(scope)) {
                problem(el, `${attribute} 指向的 id "${id}" 不在页面中，ID 引用必须指向真实元素（ARIA）`);
            }
        }
    };

    const press = async (key: string) => {
        const before = active();
        await options.press(key);
        const after = active();
        if (!after || after === doc.body || after === doc.documentElement) {
            problem(before, `按 ${keyLabel(key)} 后焦点掉到了 body，按键不能丢失焦点（APG 键盘接口）`);
            throw stopped;
        }
        if (isUnreachable(after)) {
            problem(after, `按 ${keyLabel(key)} 后焦点落在 aria-hidden 或 inert 内容里，读屏软件跟不过去`);
        }
        checkReferences();
    };

    const focus = (el: Element) => {
        (el as HTMLElement).focus();
        if (active() === doc.body) {
            problem(el, '无法获得焦点');
            throw stopped;
        }
    };

    return {
        root,
        doc,
        options,
        problems,
        problem,
        /** Whether Enter, Space and Escape may be pressed. */
        actions: options.actions !== false,
        /** The wrapping the check requires: the caller's choice, else the APG default of the pattern. */
        wraps: (fallback: boolean | 'optional') => options.wraps ?? fallback,
        press,
        focus,
        active,
        checkReferences,
        watch: (el: Element) => watched.add(el),
    };
}

export type Context = ReturnType<typeof createContext>;

/** The pattern's element: the root itself, one inside it, or a popup that the root or a part of it controls. */
export function findWidget(ctx: Context, roles: string[]) {
    const { root } = ctx;
    if (roles.includes(roleOf(root))) {
        return root;
    }
    const inside = withRole(root, roles)[0];
    if (inside) {
        return inside;
    }
    for (const el of [root, ...root.querySelectorAll('[aria-controls]')]) {
        for (const id of ids(el, 'aria-controls')) {
            const popup = byId(el, id);
            if (popup && roles.includes(roleOf(popup))) {
                return popup;
            }
        }
    }
    return undefined;
}

/** The elements with one of `roles` in the root, the root itself included. */
export const controls = (ctx: Context, roles: string[]) => [ctx.root, ...withRole(ctx.root, roles)].filter((el) => roles.includes(roleOf(el)) && !isGone(el));

export function missing(ctx: Context, role: string, pattern: string) {
    ctx.problem(ctx.root, `内部没有 role=${role} 的元素，不是 ${pattern}`);
}

export function requireName(ctx: Context, el: Element, source: string) {
    if (!accessibleName(el)) {
        ctx.problem(el, `没有可访问名称，需要 aria-label 或 aria-labelledby（APG ${source}）`);
    }
}

/** Requires an attribute to be present with one of `values`. */
export function requireState(ctx: Context, el: Element, attribute: string, values: string[], source: string) {
    const actual = el.getAttribute(attribute);
    if (!values.includes(actual ?? '')) {
        ctx.problem(el, `${attribute} 应为 ${values.map((v) => `"${v}"`).join(' 或 ')}，实际为 ${actual == null ? '缺失' : `"${actual}"`}（APG ${source}）`);
    }
}

/** The orientation assistive technology reads: `aria-orientation`, else the role's default. */
export function orientationOf(ctx: Context, el: Element): Orientation {
    const aria = el.getAttribute('aria-orientation');
    if (aria == null) {
        return defaultOrientation[roleOf(el)] ?? 'vertical';
    }
    if (aria !== 'horizontal' && aria !== 'vertical') {
        ctx.problem(el, `aria-orientation 应为 "horizontal" 或 "vertical"，实际为 "${aria}"（ARIA）`);
        return defaultOrientation[roleOf(el)] ?? 'vertical';
    }
    return aria;
}

/** The arrows that move forward and back along an orientation; the horizontal pair swaps right to left. */
export function arrowsFor(orientation: Orientation, direction: CheckOptions['direction']) {
    if (orientation === 'vertical') {
        return { next: 'ArrowDown', previous: 'ArrowUp' };
    }
    return direction === 'rtl' ? { next: 'ArrowLeft', previous: 'ArrowRight' } : { next: 'ArrowRight', previous: 'ArrowLeft' };
}

/** Flags widgets inside a composite that it cannot own, like a button in a listbox. */
export function checkOwned(ctx: Context, container: Element, allowed: string[], source: string) {
    for (const el of container.querySelectorAll('*')) {
        const role = roleOf(el);
        if (widgetRoles.has(role) && !allowed.includes(role) && !isGone(el) && !isUnreachable(el)) {
            ctx.problem(el, `是 ${roleOf(container)} 里的 ${role}，${roleOf(container)} 只能拥有 ${allowed.join('、')}（APG ${source}）`);
        }
    }
}

/** The element whose `aria-controls` names the popup, outside the popup itself. */
export function triggerOf(popup: Element) {
    if (!popup.id) {
        return undefined;
    }
    return [...(popup.getRootNode() as ParentNode).querySelectorAll('[aria-controls]')].find((el) => !popup.contains(el) && ids(el, 'aria-controls').includes(popup.id));
}

/** The popup with one of `roles` that an element's `aria-controls` names. */
export function popupOf(el: Element, roles: string[]) {
    return ids(el, 'aria-controls')
        .map((id) => byId(el, id))
        .find((popup) => !!popup && roles.includes(roleOf(popup)));
}

/** Focuses `el`, presses `key` and expects `state` to change. */
export async function checkToggle(ctx: Context, el: Element, key: string, state: () => string, name: string, source: string) {
    ctx.focus(el);
    const before = state();
    await ctx.press(key);
    if (state() === before) {
        ctx.problem(el, `按 ${keyLabel(key)} 应改变 ${name}（当前为 "${before}"）（APG ${source}）`);
    }
}
