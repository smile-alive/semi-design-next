import type { LanguageInput, ThemeInput } from '@shikijs/core';

export type { LanguageInput, ThemeInput };

/** The two keys name the CSS variables (`--shiki-light`, `--shiki-dark`) the stylesheet switches on */
export interface CodeHighlightThemes {
    light?: ThemeInput;
    dark?: ThemeInput;
}

export interface CodeHighlightRegistration {
    languages?: LanguageInput[];
    themes?: CodeHighlightThemes;
}

// Only registered grammars reach the bundle (a name lookup would pull in all); no shiki import keeps registering cheap
export const registry: { languages: LanguageInput[]; themes: Required<CodeHighlightThemes> } = {
    languages: [],
    themes: {
        light: () => import('shiki/themes/github-light.mjs'),
        dark: () => import('shiki/themes/github-dark.mjs'),
    },
};

// key by key, so `{ dark: undefined }` keeps the base theme
export function mergeThemes(base: Required<CodeHighlightThemes>, themes: CodeHighlightThemes = {}) {
    return { light: themes.light ?? base.light, dark: themes.dark ?? base.dark };
}

let version = 0;
const listeners = new Set<() => void>();

/** Adds languages and replaces themes for every CodeHighlight; mounted ones highlight again */
export function register({ languages = [], themes }: CodeHighlightRegistration) {
    registry.languages.push(...languages);
    registry.themes = mergeThemes(registry.themes, themes);
    version++;
    listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getVersion() {
    return version;
}
