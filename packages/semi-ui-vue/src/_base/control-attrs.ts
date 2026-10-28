export function splitControlAttrs(attrs: Record<string, unknown>, isControlKey: (key: string) => boolean) {
    const root: Record<string, unknown> = {};
    const control: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(attrs)) {
        (isControlKey(key) ? control : root)[key] = value;
    }
    return { root, control };
}

/** class and style size the visual root; every other attribute belongs to the inner control */
export const isNotClassOrStyle = (key: string) => key !== 'class' && key !== 'style';

export const isAriaKey = (key: string) => key.startsWith('aria-');

const NATIVE_INPUT_KEYS = new Set(['id', 'name', 'tabindex', 'tabIndex', 'autofocus', 'onFocus', 'onBlur']);
/** What names, identifies and focuses a native input hidden inside a styled root */
export const isNativeInputKey = (key: string) => isAriaKey(key) || NATIVE_INPUT_KEYS.has(key);

/** Vue appends Once, Capture and Passive to the listener key for those modifiers; .stop, .self and .prevent keep onClick */
export const isClickListenerKey = (key: string) => /^onClick(Once|Capture|Passive)*$/.test(key);

/** A key bound to undefined (`:onClick="enabled ? fn : undefined"`) is not a listener */
export const hasClickListener = (attrs: Record<string, unknown>) => Object.entries(attrs).some(([key, value]) => isClickListenerKey(key) && Boolean(value));
