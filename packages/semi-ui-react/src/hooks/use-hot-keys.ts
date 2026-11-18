import { useEffect, useEffectEvent } from 'react';
import { assertHotKeys, matchHotKeys } from '@fibrae/semi-foundation/components/hot-keys/foundation';

export interface UseHotKeysOptions {
    /** Calls `preventDefault` on the matching keydown, e.g. to keep the browser's own shortcut from running */
    preventDefault?: boolean;
    /** The element that listens for keydown; `document.body` by default. Read again whenever its identity changes */
    getListenerTarget?: () => HTMLElement | null | undefined;
}

/**
 * Calls `onHotKey` when the combination is pressed, the same rule as HotKeys: one common key matched by physical
 * position plus exactly the listed modifiers. Throws during render if `hotKeys` is not such a combination.
 */
export default function useHotKeys(hotKeys: KeyboardEvent['key'][], onHotKey: (e: KeyboardEvent) => void, { preventDefault, getListenerTarget }: UseHotKeysOptions = {}) {
    assertHotKeys(hotKeys);

    const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
        if (matchHotKeys(hotKeys, event)) {
            if (preventDefault) {
                event.preventDefault();
            }
            onHotKey(event);
        }
    });

    useEffect(() => {
        const target = getListenerTarget?.() ?? document.body;
        const listener = (event: KeyboardEvent) => handleKeyDown(event);
        target.addEventListener('keydown', listener);
        return () => target.removeEventListener('keydown', listener);
    }, [getListenerTarget]);
}
