import type { LanguageInput, ThemeInput } from '..';

// Tiny TextMate grammars and themes stand in for shiki's bundled ones: this package does not depend on shiki, and
// the tests only need tokens that get a color
export function grammar(name: string, aliases: string[] = []): LanguageInput {
    return { name, aliases, scopeName: `source.${name}`, repository: {}, patterns: [{ name: 'keyword', match: '\\b(?:const|let|print|int|return)\\b' }] };
}

export function theme(name: string, type: 'light' | 'dark', background: string): ThemeInput {
    return {
        name,
        type,
        colors: { 'editor.background': background, 'editor.foreground': '#111111' },
        settings: [{ scope: 'keyword', settings: { foreground: '#ff0000' } }],
    };
}
