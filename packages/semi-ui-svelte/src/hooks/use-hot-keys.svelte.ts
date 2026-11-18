import { untrack } from 'svelte';
import { assertHotKeys, matchHotKeys } from '@fibrae/semi-foundation/components/hot-keys/foundation';

export interface UseHotKeysOptions {
    /** Calls `preventDefault` on the matching keydown, e.g. to keep the browser's own shortcut from running */
    preventDefault?: boolean;
    /** The element that listens for keydown; `document.body` by default. Read again whenever its result changes */
    getListenerTarget?: () => HTMLElement | null | undefined;
}

/**
 * Calls `onHotKey` when the combination is pressed, the same rule as HotKeys: one common key matched by physical
 * position plus exactly the listed modifiers. Throws if `hotKeys()` is not such a combination, on creation and on every
 * change. `onHotKey` and `preventDefault` are read when the key is pressed.
 */
export default function useHotKeys(hotKeys: () => KeyboardEvent['key'][], onHotKey: (e: KeyboardEvent) => void, options: () => UseHotKeysOptions = () => ({})) {
    untrack(() => assertHotKeys(hotKeys()));

    $effect.pre(() => {
        assertHotKeys(hotKeys());
    });

    $effect(() => {
        // untracked so a changed preventDefault does not rebind; only what getListenerTarget reads does
        const getListenerTarget = untrack(() => options().getListenerTarget);
        const target = getListenerTarget?.() ?? document.body;
        const listener = (event: KeyboardEvent) => {
            if (matchHotKeys(hotKeys(), event)) {
                if (options().preventDefault) {
                    event.preventDefault();
                }
                onHotKey(event);
            }
        };
        target.addEventListener('keydown', listener);
        return () => target.removeEventListener('keydown', listener);
    });
}
