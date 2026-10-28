import { $PROXY } from 'solid-js';

/** Keys Form injects into every field component; none of them is a DOM attribute */
const formInjectedKeys = new Set(['validateStatus', 'insetLabel', 'insetLabelId']);

/** Every field component wraps its props in this first, so the injected keys never reach `splitProps` or the DOM */
export function omitFormInjected<P extends object>(props: P) {
    // the injected keys are not part of any component's declared props, so the type stays P
    return view(props, (key) => !formInjectedKeys.has(key)) as P;
}

const nativeInputKeys = new Set(['id', 'name', 'tabIndex', 'tabindex', 'autofocus', 'onFocus', 'onBlur']);

export type NativeInputKey = 'id' | 'name' | 'tabIndex' | 'tabindex' | 'autofocus' | 'onFocus' | 'onBlur' | `aria-${string}`;

/** What names, identifies and focuses a native input that sits inside a styled root */
export const isNativeInputKey = (key: string): key is NativeInputKey => key.startsWith('aria-') || nativeInputKeys.has(key);

/**
 * Splits props into [control, root] by key predicate. Both halves are live views of `props`: a key that appears or
 * disappears later moves in or out, and values stay reactive. `splitProps` cannot do this because it takes a fixed key
 * list. The type guard gives the root half the type of `props` minus the control keys, as `splitProps` would.
 */
export function splitControlAttrs<P extends object, K extends string>(props: P, isControlKey: (key: string) => key is K): [control: Partial<Pick<P, Extract<keyof P, K>>>, root: Omit<P, K>] {
    return [view(props, isControlKey), view(props, (key) => !isControlKey(key)) as Omit<P, K>];
}

// solid-js's $PROXY is the marker `splitProps` and `mergeProps` check to treat an object as a reactive proxy and read it
// through its traps instead of copying its keys. Contract of solid-js 1.9; re-check on a Solid major upgrade.
function view<P extends object>(props: P, pick: (key: string) => boolean) {
    const picks = (key: string | symbol): key is string => typeof key === 'string' && pick(key);
    return new Proxy({} as Partial<P>, {
        get: (_, key, receiver) => (key === $PROXY ? receiver : picks(key) ? props[key as keyof P] : undefined),
        has: (_, key) => key === $PROXY || (picks(key) && key in props),
        ownKeys: () => Reflect.ownKeys(props).filter(picks),
        getOwnPropertyDescriptor: (_, key) => (picks(key) && key in props ? { configurable: true, enumerable: true, get: () => props[key as keyof P] } : undefined),
        // read-only like the props it views: a write would land on the empty target and never be read back
        set: () => false,
        defineProperty: () => false,
        deleteProperty: () => false,
        preventExtensions: () => false,
        setPrototypeOf: () => false,
    });
}
