import { onMounted, watch, watchEffect } from 'vue';
import { assertHotKeys, matchHotKeys } from '@fibrae/semi-foundation/components/hot-keys/foundation';

export interface UseHotKeysOptions {
    /** Calls `preventDefault` on the matching keydown, e.g. to keep the browser's own shortcut from running */
    preventDefault?: boolean;
    /** The element that listens for keydown; `document.body` by default. Read again whenever its identity changes */
    getListenerTarget?: () => HTMLElement | null | undefined;
}

/**
 * Calls `onHotKey` when the combination is pressed, the same rule as HotKeys: one common key matched by physical
 * position plus exactly the listed modifiers. Throws if `hotKeys()` is not such a combination, in setup and whenever it
 * changes.
 */
export default function useHotKeys(hotKeys: () => KeyboardEvent['key'][], onHotKey: (e: KeyboardEvent) => void, options: () => UseHotKeysOptions = () => ({})) {
    assertHotKeys(hotKeys());

    const handleKeyDown = (event: KeyboardEvent) => {
        if (matchHotKeys(hotKeys(), event)) {
            if (options().preventDefault) {
                event.preventDefault();
            }
            onHotKey(event);
        }
    };

    watch(hotKeys, assertHotKeys);

    onMounted(() => {
        watchEffect((onCleanup) => {
            const target = options().getListenerTarget?.() ?? document.body;
            target.addEventListener('keydown', handleKeyDown);
            onCleanup(() => target.removeEventListener('keydown', handleKeyDown));
        });
    });
}
