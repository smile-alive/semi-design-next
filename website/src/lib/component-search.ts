import type { Locale } from '#/i18n/locales';

// built by getComponentIndex in docs.ts and served to the header search as /search/<framework>.json
export interface ComponentEntry {
    page: string;
    icon?: string;
    titles: Record<Locale, string>;
    hrefs: Record<Locale, string>;
}

// ignores spaces and hyphens so "date picker" and "Date-Picker" both find DatePicker
const normalize = (text: string) => text.toLowerCase().replace(/[\s-]+/g, '');

// matches any locale's title or the page folder; exact matches rank first, then prefix, then substring; ties keep sidebar order
export function searchComponents(entries: readonly ComponentEntry[], query: string) {
    const q = normalize(query);
    if (!q) return [];
    const rank = (entry: ComponentEntry) => {
        const names = [...Object.values(entry.titles), entry.page].map(normalize);
        if (names.includes(q)) return 0;
        if (names.some((name) => name.startsWith(q))) return 1;
        if (names.some((name) => name.includes(q))) return 2;
        return -1;
    };
    return entries
        .map((entry) => ({ entry, rank: rank(entry) }))
        .filter((item) => item.rank >= 0)
        .sort((a, b) => a.rank - b.rank)
        .map((item) => item.entry);
}
