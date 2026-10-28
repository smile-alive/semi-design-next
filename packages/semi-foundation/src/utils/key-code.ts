export const ENTER_KEY = 'Enter';
export const ESC_KEY = 'Escape';

/**
 * Whether a keydown is part of an IME composition. Its `key` can still be Enter, Escape or an arrow (the
 * deprecated keyCode was 229), so key handlers skip it: the Enter that commits a composition is not a submit.
 */
export function isComposing(e: { isComposing?: boolean; nativeEvent?: { isComposing?: boolean } }) {
    return Boolean(e.nativeEvent?.isComposing ?? e.isComposing);
}
