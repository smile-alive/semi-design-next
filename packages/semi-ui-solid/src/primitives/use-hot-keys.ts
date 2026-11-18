import { type Accessor, createComputed, createEffect, onCleanup } from 'solid-js';
import { assertHotKeys, matchHotKeys } from '@fibrae/semi-foundation/components/hot-keys/foundation';

export interface UseHotKeysOptions {
    /** Calls `preventDefault` on the matching keydown, e.g. to keep the browser's own shortcut from running */
    preventDefault?: boolean;
    /** The element that listens for keydown; `document.body` by default. Read again whenever `options` changes */
    getListenerTarget?: () => HTMLElement | null | undefined;
}

/**
 * Calls `onHotKey` when the combination is pressed, the same rule as HotKeys: one common key matched by physical
 * position plus exactly the listed modifiers. Throws if `hotKeys()` is not such a combination, on creation and whenever it
 * changes.
 */
export default function useHotKeys(hotKeys: Accessor<KeyboardEvent['key'][]>, onHotKey: (e: KeyboardEvent) => void, options: Accessor<UseHotKeysOptions> = () => ({})) {
    createComputed(() => assertHotKeys(hotKeys()));

    createEffect(() => {
        const target = options().getListenerTarget?.() ?? document.body;
        const listener = (event: KeyboardEvent) => {
            if (matchHotKeys(hotKeys(), event)) {
                if (options().preventDefault) {
                    event.preventDefault();
                }
                onHotKey(event);
            }
        };
        target.addEventListener('keydown', listener);
        onCleanup(() => target.removeEventListener('keydown', listener));
    });
}
