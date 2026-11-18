import { getThemeMode, getThemePreference, setThemeMode, subscribeThemeMode, type ThemeMode, type ThemePreference } from '@fibrae/semi-foundation/utils/theme-mode';

/**
 * `mode` is what the page shows, `preference` also tells `system` apart; `setMode` writes `theme-mode` on `<html>`, so
 * every caller and the page's own writes stay in step. The server and hydration render `light`.
 */
export default function useThemeMode(): { readonly mode: ThemeMode; readonly preference: ThemePreference; setMode: (preference: ThemePreference) => void } {
    let mode = $state<ThemeMode>('light');
    let preference = $state<ThemePreference>('light');

    $effect(() => {
        const update = () => {
            mode = getThemeMode();
            preference = getThemePreference();
        };
        update();
        return subscribeThemeMode(update);
    });

    return {
        get mode() {
            return mode;
        },
        get preference() {
            return preference;
        },
        setMode: setThemeMode,
    };
}
