import { type ShallowRef, shallowRef } from 'vue';
import useMutationObserver from '../_base/use-mutation-observer';

/**
 * The `theme-mode` attribute of document.body, tracked after mount. Server render and hydration see null, so the
 * markup matches; the switch happens in the same flush as mount, before the first paint.
 * Slots are not reactive, so a `darkModeImage` slot appearing later cannot start or stop observing: every
 * instance observes, which costs one attribute-filtered observer.
 */
export default function useThemeMode(): Readonly<ShallowRef<string | null>> {
    const mode = shallowRef<string | null>(null);

    useMutationObserver(
        () => document.body,
        () => {
            mode.value = document.body.getAttribute('theme-mode');
        },
        { attributeFilter: ['theme-mode'] }
    );

    return mode;
}
