import { registerMediaQuery } from './dom';

export type ThemeMode = 'light' | 'dark';

/** `system` follows the operating system's `prefers-color-scheme` until another mode is set */
export type ThemePreference = ThemeMode | 'system';

const ATTRIBUTE = 'theme-mode';

// following the system is a page-level setting: it outlives the components that turned it on
let stopFollowingSystem: (() => void) | null = null;
const listeners = new Set<() => void>();

// on <html>, so a script in <head> can set it before <body> exists and the first paint is already dark
function applyThemeMode(mode: ThemeMode) {
    if (mode === 'dark') {
        document.documentElement.setAttribute(ATTRIBUTE, 'dark');
    } else {
        document.documentElement.removeAttribute(ATTRIBUTE);
    }
}

/** The mode the page shows: dark exactly when `<html>` carries `theme-mode="dark"` */
export function getThemeMode(): ThemeMode {
    return document.documentElement.getAttribute(ATTRIBUTE) === 'dark' ? 'dark' : 'light';
}

/** `system` while following the system, otherwise the mode the page shows, so a write made elsewhere is reflected */
export function getThemePreference(): ThemePreference {
    return stopFollowingSystem ? 'system' : getThemeMode();
}

/** Writes `theme-mode` on `<html>`; `light` removes the attribute */
export function setThemeMode(preference: ThemePreference) {
    stopFollowingSystem?.();
    stopFollowingSystem = null;
    if (preference === 'system') {
        stopFollowingSystem = registerMediaQuery('(prefers-color-scheme: dark)', {
            match: () => applyThemeMode('dark'),
            unmatch: () => applyThemeMode('light'),
        });
    } else {
        applyThemeMode(preference);
    }
    // switching between `system` and the mode it resolves to leaves the attribute as it was
    listeners.forEach((listener) => listener());
}

/** Calls `onChange` when the mode or the preference changes, including attribute writes made outside `setThemeMode` */
export function subscribeThemeMode(onChange: () => void) {
    listeners.add(onChange);
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributeFilter: [ATTRIBUTE] });
    return () => {
        listeners.delete(onChange);
        observer.disconnect();
    };
}
