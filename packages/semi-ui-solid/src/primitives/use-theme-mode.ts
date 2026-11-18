import { type Accessor, createSignal, onCleanup, onMount } from 'solid-js';
import { getThemeMode, getThemePreference, setThemeMode, subscribeThemeMode, type ThemeMode, type ThemePreference } from '@fibrae/semi-foundation/utils/theme-mode';

/**
 * `mode()` is what the page shows, `preference()` also tells `system` apart; `setMode` writes `theme-mode` on `<html>`, so
 * every caller and the page's own writes stay in step. The server and hydration render `light`, the real values arrive
 * after mount.
 */
export default function useThemeMode(): { mode: Accessor<ThemeMode>; preference: Accessor<ThemePreference>; setMode: (preference: ThemePreference) => void } {
    const [mode, setMode] = createSignal<ThemeMode>('light');
    const [preference, setPreference] = createSignal<ThemePreference>('light');

    onMount(() => {
        const update = () => {
            setMode(getThemeMode());
            setPreference(getThemePreference());
        };
        update();
        onCleanup(subscribeThemeMode(update));
    });

    return { mode, preference, setMode: setThemeMode };
}
