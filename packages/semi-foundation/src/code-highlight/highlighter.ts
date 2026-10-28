import { createHighlighterCore, type HighlighterCore } from '@shikijs/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { mergeThemes, registry, type CodeHighlightRegistration, type LanguageInput, type ThemeInput } from './registry';

let core: Promise<HighlighterCore> | undefined;
// One load per input, shared so no concurrent highlight checks languages before its grammar is in.
// Weak keys: an inline loader is a new function every render.
const languageLoads = new WeakMap<WeakKey & LanguageInput, Promise<void>>();
const themeNames = new WeakMap<WeakKey & ThemeInput, Promise<string>>();

// The JS regex engine avoids the Oniguruma wasm; forgiving skips patterns it cannot translate
function getCore() {
    core ??= createHighlighterCore({ engine: createJavaScriptRegexEngine({ forgiving: true }) }).catch((error) => {
        // uncached, so a transient network error can be retried
        core = undefined;
        throw error;
    });
    return core;
}

function loadLanguage(highlighter: HighlighterCore, input: LanguageInput) {
    if (!languageLoads.has(input)) {
        languageLoads.set(
            input,
            highlighter.loadLanguage(input).catch((error) => {
                languageLoads.delete(input);
                throw error;
            })
        );
    }
    return languageLoads.get(input);
}

// codeToHtml takes theme names, known for a lazy input only once its module resolves
function loadTheme(highlighter: HighlighterCore, input: ThemeInput) {
    if (!themeNames.has(input)) {
        themeNames.set(
            input,
            (async () => {
                try {
                    const loaded = await (typeof input === 'function' ? input() : input);
                    const theme = 'default' in loaded ? loaded.default : loaded;
                    await highlighter.loadTheme(theme);
                    return theme.name;
                } catch (error) {
                    themeNames.delete(input);
                    throw error;
                }
            })()
        );
    }
    return themeNames.get(input);
}

/** HTML for the code, or '' when the language is not registered (the caller then shows plain text) */
export async function highlight(code: string, language: string, extra: CodeHighlightRegistration = {}) {
    const highlighter = await getCore();
    // one failing grammar must not stop the others
    const loads = await Promise.allSettled([...registry.languages, ...(extra.languages ?? [])].map((input) => loadLanguage(highlighter, input)));
    if (!highlighter.getLoadedLanguages().includes(language)) {
        // the failed grammar may be the requested one: surface it rather than silently showing plain text
        const failed = loads.find((load): load is PromiseRejectedResult => load.status === 'rejected');
        if (failed) {
            throw failed.reason;
        }
        return '';
    }
    const themes = mergeThemes(registry.themes, extra.themes);
    const [light, dark] = await Promise.all([loadTheme(highlighter, themes.light), loadTheme(highlighter, themes.dark)]);
    return highlighter.codeToHtml(code, { lang: language, themes: { light, dark }, defaultColor: false });
}
