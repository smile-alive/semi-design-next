import { type Ref, onBeforeUnmount, onMounted, readonly, shallowRef } from 'vue';
import { getThemeMode, getThemePreference, setThemeMode, subscribeThemeMode, type ThemeMode, type ThemePreference } from '@fibrae/semi-foundation/utils/theme-mode';

/**
 * `mode` is what the page shows, `preference` also tells `system` apart; `setMode` writes `theme-mode` on `<html>`, so
 * every caller and the page's own writes stay in step. The server and hydration render `light`, the real values arrive
 * once mounted.
 */
export default function useThemeMode(): { mode: Readonly<Ref<ThemeMode>>; preference: Readonly<Ref<ThemePreference>>; setMode: (preference: ThemePreference) => void } {
    const mode = shallowRef<ThemeMode>('light');
    const preference = shallowRef<ThemePreference>('light');
    let unsubscribe: (() => void) | undefined;

    const update = () => {
        mode.value = getThemeMode();
        preference.value = getThemePreference();
    };

    onMounted(() => {
        update();
        unsubscribe = subscribeThemeMode(update);
    });

    onBeforeUnmount(() => unsubscribe?.());

    return { mode: readonly(mode), preference: readonly(preference), setMode: setThemeMode };
}
