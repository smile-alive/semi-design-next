import type { Locale } from '#/i18n/locales';

// 构建期由 docs.ts 的 getComponentIndex 生成，经 /search/<框架>.json 提供给页头搜索
export interface ComponentEntry {
    page: string;
    icon?: string;
    titles: Record<Locale, string>;
    hrefs: Record<Locale, string>;
}

// 空格和连字符不参与比较：「date picker」「Date-Picker」都能找到 DatePicker
const normalize = (text: string) => text.toLowerCase().replace(/[\s-]+/g, '');

// 任一语言的标题或目录名命中即可。完全相同排最前，其次是前缀匹配，再次是包含；同档保持侧栏顺序
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
