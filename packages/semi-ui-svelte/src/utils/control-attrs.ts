export function splitControlAttrs<T extends Record<string, unknown>>(attrs: T, isControlKey: (key: string) => boolean) {
    const root: Record<string, unknown> = {};
    const control: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(attrs)) {
        (isControlKey(key) ? control : root)[key] = value;
    }
    // `{@attach}` on a component arrives as a symbol-keyed prop; it belongs with the aria and tabindex it travels with
    // (Tooltip's `child` props bundle them), so the attached element is the one that takes focus. The symbol keys stay
    // out of the declared type: element attribute types reject a symbol index signature
    for (const key of Object.getOwnPropertySymbols(attrs)) {
        (control as Record<symbol, unknown>)[key] = (attrs as Record<symbol, unknown>)[key];
    }
    return { root, control };
}

export { isAriaKey, isNativeInputKey } from '@fibrae/semi-foundation/utils/a11y';
