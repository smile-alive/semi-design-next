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

/** A valueless template attribute (`<Input readOnly />`) arrives as an empty string, so Boolean() would read it as off */
export const isBooleanAttrOn = (value: unknown) => value !== undefined && value !== null && value !== false;

export { isAriaKey, isNativeInputKey } from '@fibrae/semi-foundation/utils/a11y';

/** Vue appends Once, Capture and Passive to the listener key for those modifiers; .stop, .self and .prevent keep onClick */
export const isClickListenerKey = (key: string) => /^onClick(Once|Capture|Passive)*$/.test(key);

/** A key bound to undefined (`:onClick="enabled ? fn : undefined"`) is not a listener */
export const hasClickListener = (attrs: Record<string, unknown>) => Object.entries(attrs).some(([key, value]) => isClickListenerKey(key) && Boolean(value));
