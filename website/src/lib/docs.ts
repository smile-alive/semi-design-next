import { getCollection, type CollectionEntry } from 'astro:content';
import { translate } from '#/i18n';
import { locales, type Locale } from '#/i18n/locales';
import type { ComponentEntry } from '#/lib/component-search';
import { type Framework, availableFrameworks, validateFrameworkLocales } from './frameworks';

export { asLocale, locales, type Locale } from '#/i18n/locales';
export { frameworks, type Framework } from './frameworks';
export type Doc = CollectionEntry<'docs'>;

const demoFiles = Object.keys(import.meta.glob('../../content/**/demos/*.{react.tsx,vue,solid.tsx,svelte}', { eager: true, query: '?raw', import: 'default' }));

export function docFrameworks(doc: Doc): readonly Framework[] {
    const { category, page } = parseDocId(doc.id);
    return availableFrameworks(
        demoFiles.filter((file) => file.startsWith(`../../content/${category}/${page}/demos/`)),
        doc.data.frameworks,
        doc.id
    );
}

export async function getDocs() {
    const docs = await getCollection('docs');
    validateFrameworkLocales(new Map(docs.map((doc) => [doc.id, docFrameworks(doc).join(',')])), locales);
    return docs;
}

// basic/button/index.zh-CN -> { category: 'basic', page: 'button', locale: 'zh-CN' }
export function parseDocId(id: string) {
    const [category, page, file] = id.split('/');
    const locale = file.replace(/^index\./, '');
    if (!category || !page || !(locales as readonly string[]).includes(locale)) {
        throw new Error(`Unexpected doc path "${id}", expected <category>/<page>/index.<locale>.mdx`);
    }
    return { category, page, locale: locale as Locale };
}

export function docUrl(locale: Locale, framework: Framework, category: string, page: string) {
    return `/${locale}/${framework}/${category}/${page}`;
}

// sidebar group order; labels are category_<folder> in src/i18n
const categories = ['start', 'advanced', 'experience', 'ecosystem', 'ai', 'basic', 'plus', 'input', 'navigation', 'show', 'feedback', 'other'] as const;

// header search indexes component categories only
const componentCategories: ReadonlySet<string> = new Set(['ai', 'basic', 'plus', 'input', 'navigation', 'show', 'feedback', 'other']);

const docIcons = import.meta.glob<string>('../assets/doc-icons/*.svg', {
    eager: true,
    import: 'default',
    query: '?url',
});
export const docIconUrl = (name?: string) => (name ? docIcons[`../assets/doc-icons/${name}.svg`] : undefined);

export function categoryLabel(locale: Locale, key: string) {
    const category = categories.find((c) => c === key);
    if (!category) throw new Error(`Content folder "${key}" is missing from the sidebar categories in src/lib/docs.ts`);
    return translate(locale)(`category_${category}`);
}

export async function getSidebar(locale: Locale, framework: Framework) {
    const docs = (await getDocs()).filter((doc) => parseDocId(doc.id).locale === locale && docFrameworks(doc).includes(framework));
    for (const doc of docs) categoryLabel(locale, parseDocId(doc.id).category);
    return categories.map((key) => ({
        key,
        label: categoryLabel(locale, key),
        items: docs.filter((doc) => parseDocId(doc.id).category === key).sort((a, b) => a.data.order - b.data.order),
    }));
}

export async function getComponentCategories(locale: Locale, framework: Framework) {
    return (await getSidebar(locale, framework))
        .filter((group) => componentCategories.has(group.key) && group.items.length > 0)
        .map((group) => {
            const { category, page } = parseDocId(group.items[0].id);
            return { key: group.key, count: group.items.length, href: docUrl(locale, framework, category, page) };
        });
}

// one entry per page with every locale's title, so any locale finds it by either name; sidebar order
export async function getComponentIndex(framework: Framework): Promise<ComponentEntry[]> {
    const docs = await getDocs();
    const titleOf = (category: string, page: string, locale: Locale) => {
        const id = `${category}/${page}/index.${locale}`;
        const doc = docs.find((d) => d.id === id);
        if (!doc) throw new Error(`Component search needs every locale of a page, "${id}.mdx" is missing`);
        return doc.data.title;
    };
    return (await getSidebar(locales[0], framework))
        .filter((group) => componentCategories.has(group.key))
        .flatMap((group) =>
            group.items.map((doc) => {
                const { category, page } = parseDocId(doc.id);
                return {
                    page,
                    icon: docIconUrl(doc.data.icon),
                    titles: Object.fromEntries(locales.map((l) => [l, titleOf(category, page, l)])) as Record<Locale, string>,
                    hrefs: Object.fromEntries(locales.map((l) => [l, docUrl(l, framework, category, page)])) as Record<Locale, string>,
                };
            })
        );
}
