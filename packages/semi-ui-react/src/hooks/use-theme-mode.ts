import { useSyncExternalStore } from 'react';
import { getThemeMode, getThemePreference, setThemeMode, subscribeThemeMode, type ThemeMode, type ThemePreference } from '@fibrae/semi-foundation/utils/theme-mode';

const getServerMode = (): ThemeMode => 'light';

/**
 * `mode` is what the page shows, `preference` also tells `system` apart; `setMode` writes `theme-mode` on `<html>`, so
 * every caller and the page's own writes stay in step. The server and hydration render `light`.
 */
export default function useThemeMode(): { mode: ThemeMode; preference: ThemePreference; setMode: (preference: ThemePreference) => void } {
    const mode = useSyncExternalStore(subscribeThemeMode, getThemeMode, getServerMode);
    const preference = useSyncExternalStore(subscribeThemeMode, getThemePreference, getServerMode);
    return { mode, preference, setMode: setThemeMode };
}
