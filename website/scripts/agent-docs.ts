import fs, { globSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseExpressionAt } from 'acorn';
import type { Parent, Root, RootContent } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { filterFrameworks } from '../plugins/remark-demo.ts';
import { translate } from '../src/i18n/index.ts';
import { categories } from '../src/lib/categories.ts';
import { availableFrameworks, frameworkDemo, frameworkLabels, frameworks, type Framework } from '../src/lib/frameworks.ts';
import { parseThemeTokens } from '../src/lib/theme-tokens.ts';

export type Pkg = 'ui' | 'ai' | 'icons';

export interface AgentPage {
    category: string;
    page: string;
    title: string;
    brief: string;
    frameworks: Framework[];
    pkg: Pkg;
}

/** Turns a doc page reference into a link; `anchor` keeps its leading `#` */
export type Linker = (category: string, page: string, anchor: string) => string;

const root = path.resolve(import.meta.dirname, '../..');
const contentDir = path.join(root, 'website/content');
const locale = 'en-US';
export const site = 'https://semi-design-next.pages.dev';
const label = translate(locale);

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);
// No remark-mdx here: an MDX node the conversion missed fails the stringify instead of leaking JSX into the output
// Unaligned tables: padding every row to the widest description multiplies the size of API tables
const printer = unified().use(remarkStringify, { bullet: '-', fences: true, listItemIndent: 'one', rule: '-' }).use(remarkGfm, { tablePipeAlign: false });

export const packageName = (pkg: Pkg, framework: Framework) => `@fibrae/semi-${pkg}-${framework}`;
export const pageUrl = (framework: Framework, category: string, page: string) => `${site}/${locale}/${framework}/${category}/${page}/`;

function readJson(file: string): Record<string, { source?: string; props?: Record<string, unknown> }> | undefined {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined;
}

// A page belongs to the package its API tables document; API-less pages in the ai category (the overview) go with AI
function pagePackage(dir: string, category: string, framework: Framework): Pkg {
    const sources = Object.values(readJson(path.join(dir, `api.${framework}.json`)) ?? {}).map((entry) => entry.source ?? '');
    if (sources.some((source) => source.includes('/semi-ai-'))) return 'ai';
    if (sources.some((source) => source.includes('/semi-icons-'))) return 'icons';
    return !sources.length && category === 'ai' ? 'ai' : 'ui';
}

export function agentPages(framework: Framework): AgentPage[] {
    const pages = globSync(`*/*/index.${locale}.mdx`, { cwd: contentDir }).map((file) => {
        const [category, page] = file.split('/');
        const dir = path.join(contentDir, category, page);
        const { frontmatter } = parseFrontmatter(fs.readFileSync(path.join(contentDir, file), 'utf8'));
        const demos = fs.existsSync(path.join(dir, 'demos')) ? fs.readdirSync(path.join(dir, 'demos')) : [];
        return {
            category,
            page,
            title: String(frontmatter.title),
            brief: String(frontmatter.brief),
            order: Number(frontmatter.order),
            frameworks: availableFrameworks(demos, frontmatter.frameworks, file),
            pkg: pagePackage(dir, category, framework),
        };
    });
    return pages
        .filter((page) => page.frameworks.includes(framework))
        .sort((a, b) => categories.indexOf(a.category as never) - categories.indexOf(b.category as never) || a.order - b.order)
        .map(({ order: _order, ...page }) => page);
}

type Element = MdxJsxFlowElement | MdxJsxTextElement;

function expressionOf(node: Element, name: string) {
    const found = node.attributes.find((item) => item.type === 'mdxJsxAttribute' && item.name === name);
    if (found?.type !== 'mdxJsxAttribute' || found.value == null) return undefined;
    return typeof found.value === 'string' ? found.value : parseExpressionAt(found.value.value, 0, { ecmaVersion: 'latest' });
}

function attribute(node: Element, name: string) {
    const expression = expressionOf(node, name);
    if (expression == null || typeof expression === 'string') return expression;
    if (expression.type === 'Literal' && typeof expression.value === 'string') return expression.value;
    if (expression.type === 'TemplateLiteral' && !expression.expressions.length) return expression.quasis[0].value.cooked ?? '';
    throw new Error(`${node.name} ${name} needs a string literal`);
}

const themeTokens = parseThemeTokens((name) => fs.readFileSync(path.join(root, 'packages/shared/semi-foundation/src/theme', name), 'utf8'));

function table(header: string[], rows: string[][]): RootContent {
    const row = (cells: string[], code: boolean) => ({
        type: 'tableRow' as const,
        children: cells.map((cell, index) => ({ type: 'tableCell' as const, children: [code && index === 0 ? { type: 'inlineCode' as const, value: cell } : { type: 'text' as const, value: cell }] })),
    });
    return { type: 'table', children: [row(header, false), ...rows.map((cells) => row(cells, true))] };
}

// The tokens page draws its tables live from semi-foundation's theme files; this prints the same rows
function tokenTable(node: Element): RootContent {
    if (expressionOf(node, 'isAnimation')) {
        return table(
            ['Variable', 'Value', 'Usage'],
            themeTokens.animation.map((token) => [token.key, token.value, token.comment ?? ''])
        );
    }
    const reg = expressionOf(node, 'reg');
    const regex = typeof reg === 'object' && reg.type === 'Literal' && 'regex' in reg ? reg.regex : undefined;
    if (!regex) throw new Error('GlobalToken needs a regex literal reg');
    const pattern = new RegExp(regex.pattern, regex.flags);
    const dark = new Map(themeTokens.global.dark.map((token) => [token.key, token.value]));
    const tokens = [...themeTokens.global.light, ...themeTokens.normal].filter((token) => pattern.test(token.key));
    return table(
        ['Variable', 'Light', 'Dark', 'Usage'],
        tokens.map((token) => [token.key, token.value, dark.get(token.key) ?? token.value, token.comment ?? ''])
    );
}

// Doc pages go through the linker; other site paths (images under /assets) become absolute so they resolve anywhere
function docLink(url: string, link: Linker) {
    const match = /^\/en-US\/[a-z]+\/([a-z-]+)\/([a-z-]+)\/?(#.*)?$/.exec(url);
    if (match) return link(match[1], match[2], match[3] ?? '');
    return url.startsWith('/') ? `${site}${url}` : url;
}

interface Context {
    file: string;
    framework: Framework;
    imports: Map<string, string>;
    link: Linker;
    webUrl: string;
}

function convertChildren(parent: Parent, context: Context) {
    parent.children = parent.children.flatMap((node) => convert(node as RootContent, context)) as Parent['children'];
}

function convert(node: RootContent, context: Context): RootContent[] {
    if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') return [];
    if (node.type === 'link' || node.type === 'image') node.url = docLink(node.url, context.link);
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') {
        if ('children' in node) convertChildren(node, context);
        return [node];
    }
    const name = node.name ?? '';
    if (name === 'Demo') {
        const file = path.join(path.dirname(context.file), 'demos', `${attribute(node, 'id')}.${frameworkDemo[context.framework].extension}`);
        return [{ type: 'code', lang: frameworkDemo[context.framework].language, value: fs.readFileSync(file, 'utf8').trimEnd() }];
    }
    if (name === 'ApiType') return [{ type: 'inlineCode', value: attribute(node, 'detail') ?? '' }];
    const imported = context.imports.get(name);
    if (imported) return documentTree(imported, { ...context, file: imported }).children;
    if (name === 'Notice') {
        convertChildren(node, context);
        const title = attribute(node, 'title');
        const heading: RootContent[] = title ? [{ type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: title }] }] }] : [];
        return [{ type: 'blockquote', children: [...heading, ...node.children] as never }];
    }
    if (name === 'DesignToken') {
        return [
            {
                type: 'paragraph',
                children: [
                    { type: 'text', value: 'The design token table of this component is on the web page: ' },
                    { type: 'link', url: context.webUrl, children: [{ type: 'text', value: context.webUrl }] },
                ],
            },
        ];
    }
    if (name === 'GlobalToken') return [tokenTable(node)];
    if (name === 'a') {
        convertChildren(node, context);
        return [{ type: 'link', url: docLink(attribute(node, 'href') ?? '', context.link), children: node.children as never }];
    }
    // Self-closing capitalized elements are live figures with no text form; anything with children keeps its text
    if (!node.children.length) return [];
    convertChildren(node, context);
    return node.children as RootContent[];
}

function documentTree(file: string, context: Context): Root {
    const { content } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    const tree = parser.parse(content);
    filterFrameworks(tree, context.framework, file);
    const imports = new Map<string, string>();
    for (const node of tree.children) {
        if (node.type !== 'mdxjsEsm') continue;
        for (const [, local, source] of node.value.matchAll(/import\s+(\w+)\s+from\s+'(\.\/api\/[^']+\.mdx)'/g)) {
            imports.set(local, path.join(path.dirname(file), source));
        }
    }
    convertChildren(tree, { ...context, file, imports });
    return tree;
}

interface ReleaseSection {
    names: string[];
    body: string;
}

function parseReleaseNotes() {
    const text = fs.readFileSync(path.join(root, 'docs/release-notes.md'), 'utf8');
    const [head, components = ''] = text.split(/^## 组件$/m);
    const sections: ReleaseSection[] = components
        .split(/^### /m)
        .slice(1)
        .map((chunk) => {
            const newline = chunk.indexOf('\n');
            const names = chunk
                .slice(0, newline)
                .split('、')
                .map((name) => name.replace(/（.*$/, '').trim());
            return { names, body: chunk.slice(newline + 1).trim() };
        });
    return { global: head.slice(head.indexOf('## 全局')).trim(), sections };
}

const releaseNotes = parseReleaseNotes();

// Bullets that name another framework only apply there; the rest apply to every framework
function forFramework(markdown: string, framework: Framework) {
    return markdown
        .split('\n')
        .filter((line) => {
            const owner = /^- (React|Vue|Solid|Svelte)：/.exec(line)?.[1];
            return !owner || owner === frameworkLabels[framework];
        })
        .join('\n');
}

const pascal = (key: string) => key.replace(/(^|-)([a-z])/g, (_match, _dash, letter: string) => letter.toUpperCase());

export function pageMarkdown(page: AgentPage, framework: Framework, link: Linker) {
    const dir = path.join(contentDir, page.category, page.page);
    const file = path.join(dir, `index.${locale}.mdx`);
    const webUrl = pageUrl(framework, page.category, page.page);
    const tree = documentTree(file, { file, framework, imports: new Map(), link, webUrl });
    const intro = [`# ${page.title}`, `> ${page.brief}`, `Package: \`${packageName(page.pkg, framework)}\`. Web page: ${webUrl}`];
    const names = new Set([page.title, ...Object.keys(readJson(path.join(dir, `api.${framework}.json`)) ?? {}).map(pascal)]);
    const changes = releaseNotes.sections
        .filter((section) => section.names.some((name) => names.has(name)))
        .map((section) => forFramework(section.body, framework).trim())
        .filter(Boolean);
    const outro = changes.length ? ['## Changes from Semi Design', 'From the project release notes (written in Chinese). Your knowledge of Semi Design does not cover these.', ...changes] : [];
    return [...intro, printer.stringify(tree).trim(), ...outro].join('\n\n') + '\n';
}

const rules: Record<Framework, string[]> = {
    react: [
        'React 19 only. Every component is a function component. Components with imperative methods expose them through a `XxxHandle` ref type (`SelectHandle`, `FormHandle`, `DatePickerHandle`); other refs point to the root DOM element.',
        'Callback props may be omitted or `null`; there are no class instances, `propTypes` or `BaseComponent`.',
        'Inside React Server Components, flat components and icons import directly; dot-syntax subcomponents (`Typography.Title`), `semiGlobal`, and Form HOCs or hooks need a `"use client"` file.',
    ],
    vue: [
        'Vue 3.5+. Controlled values use `v-model` (`modelValue`) or named models such as `v-model:visible` and `v-model:activeKey`.',
        'Content props are slots: `#closeIcon` left empty falls back to the default icon (hide it with `closable=false`), Modal `#header` and `#footer` left empty hide the area.',
        'Imperative APIs (Toast, Notification, Modal.confirm) share one `app.use` registration.',
    ],
    solid: [
        'Export names, prop names, callback signatures and controlled props match the React package. Write `class` instead of `className`; node props take `JSX.Element`; element refs are callbacks or variables.',
        '`overrideDefaultProps` is read when a component is created and ignores JSX values; node props such as Spin `indicator` are passed per instance.',
        'Use `batch` when several sets in one handler must land as a single update.',
    ],
    svelte: [
        'Svelte 5 with runes; the package ships `.svelte` sources, so the app needs a Svelte compiler plugin (`@sveltejs/vite-plugin-svelte`, SvelteKit).',
        'Controlled values are bindable props: `bind:checked={x}` syncs both ways, `bind:checked={get, set}` is fully controlled, `checked={x}` is only an initial value. There are no `default*` props.',
        'Node props and render functions are snippets named like Vue slots (no `render` prefix) whose argument is an object with named fields; default content is `children`. `class` accepts a string, array or object; `style` accepts a string only.',
        'Data-only subcomponents (`TabPane`, `Select.Option`, `Table.Column`) do not exist: use data props (`tabList`, `optionList`, `columns`) with per-item snippets. Methods are called on the instance from `bind:this`. Form has named exports only.',
    ],
};

function commonRules(framework: Framework) {
    const ui = packageName('ui', framework);
    return [
        `This is Semi Design Next, a community fork of Semi Design that does not keep upstream compatibility. Never import \`@douyinfe/semi-ui\`, \`@douyinfe/semi-icons\` or \`@douyinfe/semi-illustrations\`, and do not trust what you remember about Semi Design props: read the page of every component you use.`,
        `Import components from \`${ui}\`, icons from \`${packageName('icons', framework)}\`, illustrations from \`${packageName('icons', framework)}/illustrations\`, and AI components (Chat, AIChatInput, AIChatDialogue, Sidebar and friends) from \`${packageName('ai', framework)}\`. Prefer these root imports over deep paths; deep paths are kebab-case (\`${ui}/date-picker/index\`).`,
        `Styles load with each component and need no reset stylesheet. Theme through \`--semi-*\` CSS variables; Sass variables and theme packages are not a customization surface, and popups render in the top layer so z-index tokens do not exist.`,
        'Style inner parts with the `classNames` and `styles` props, keyed by part name, instead of targeting internal class names.',
        'Controlled detection is by value: `value={undefined}` (likewise `checked`, `visible`, `activeKey`) means uncontrolled; `null` is a controlled empty value. Hide areas such as Modal `footer` with `null`.',
        `Built-in locales are \`zh_CN\` and \`en_US\` only, imported from \`${ui}/locale\` and passed to ConfigProvider or LocaleProvider.`,
        'Global default props go through `semiGlobal.config.overrideDefaultProps`, keyed by component name (Navigation uses `Nav`).',
        'Icons are decorative (`aria-hidden`); an icon-only button needs `aria-label`. Subcomponents are written with dot syntax at the use site (`<Select.Option>`).',
        'Supported browsers: Chrome 120, Firefox 125, Safari 17.2 and later.',
        ...rules[framework],
    ];
}

function version(pkg: Pkg, framework: Framework) {
    return JSON.parse(fs.readFileSync(path.join(root, 'packages', `semi-${pkg}-${framework}`, 'package.json'), 'utf8')).version as string;
}

const pkgSummary: Record<Pkg, string> = {
    ui: 'the component library',
    ai: 'AI chat components (Chat, AIChatInput, AIChatDialogue, Sidebar, AI-styled basics)',
    icons: 'icons and illustrations',
};

function pageList(pages: AgentPage[], link: Linker) {
    return categories.flatMap((category) => {
        const items = pages.filter((page) => page.category === category);
        if (!items.length) return [];
        return [`## ${label(`category_${category}`)}`, items.map((page) => `- [${page.title}](${link(page.category, page.page, '')}): ${page.brief}`).join('\n')];
    });
}

/** The llms.txt index; `docsOf` tells where another package's index lives for the reader */
export function indexMarkdown(framework: Framework, pkgs: Pkg[], pages: AgentPage[], link: Linker, docsOf: (pkg: Pkg) => string, extra: string[] = []) {
    const own = pkgs.map((pkg) => `\`${packageName(pkg, framework)}\` ${version(pkg, framework)}`).join(', ');
    const others = (['ui', 'ai', 'icons'] as const).filter((pkg) => !pkgs.includes(pkg));
    return (
        [
            `# Semi Design Next for ${frameworkLabels[framework]}`,
            `> Documentation for coding agents covering ${own}. Read the rules first, then the page of each component you use: every page lists the props, events and methods with types and defaults, and runnable ${frameworkLabels[framework]} examples. Pages are long: search a page for \`## API reference\` or a prop name instead of reading it whole.`,
            '## Rules',
            commonRules(framework)
                .map((rule) => `- ${rule}`)
                .join('\n'),
            ...(others.length ? ['## Related packages', others.map((pkg) => `- \`${packageName(pkg, framework)}\`, ${pkgSummary[pkg]}: ${docsOf(pkg)}`).join('\n')] : []),
            ...extra,
            ...pageList(pages, link),
        ].join('\n\n') + '\n'
    );
}

function exportNames(file: string) {
    return [...fs.readFileSync(file, 'utf8').matchAll(/as (\w+) \}/g)].map((match) => match[1]);
}

export function iconNamesMarkdown(framework: Framework) {
    const pkg = packageName('icons', framework);
    const src = path.join(root, 'packages', `semi-icons-${framework}`, 'src');
    const section = (title: string, from: string, names: string[]) => [`## ${title}`, `Import from \`${from}\`.`, names.join('\n')];
    return (
        [
            `# Icon and illustration names`,
            `> Every export of \`${pkg}\`. Use only names from this list.`,
            ...section('Icons', pkg, exportNames(path.join(src, 'icons/index.ts'))),
            ...section('Lab icons', `${pkg}/lab`, exportNames(path.join(src, 'lab/index.ts'))),
            ...section('Illustrations', `${pkg}/illustrations`, exportNames(path.join(src, 'illustrations/index.ts'))),
        ].join('\n\n') + '\n'
    );
}

export function changesMarkdown(framework: Framework) {
    return `# Changes from Semi Design\n\n> Breaking and behavior changes that apply to every component, from the project release notes (written in Chinese). Component-specific changes are at the end of each component page.\n\n${forFramework(releaseNotes.global, framework)}\n`;
}

const docsFile = (category: string, page: string) => `${category}/${page}.md`;

/** Files of one package's docs/ folder, keyed by path relative to it */
export function packageDocs(framework: Framework, pkg: Pkg) {
    const all = agentPages(framework);
    const pages = all.filter((page) => page.pkg === pkg);
    const files = new Map<string, string>();
    for (const page of pages) {
        const link: Linker = (category, target, anchor) => {
            const found = all.find((item) => item.category === category && item.page === target);
            if (found?.pkg === pkg) return `../${docsFile(category, target)}${anchor}`;
            return `${pageUrl(framework, category, target)}${anchor}`;
        };
        files.set(docsFile(page.category, page.page), pageMarkdown(page, framework, link));
    }
    const extra: string[] = [];
    if (pkg === 'ui') {
        files.set('changes-from-semi.md', changesMarkdown(framework));
        extra.push('## Changes from Semi Design', '- [Changes from Semi Design](changes-from-semi.md): breaking and behavior changes that apply to every component');
    }
    if (pkg === 'icons') {
        files.set('icon-names.md', iconNamesMarkdown(framework));
        extra.push('## Names', '- [Icon and illustration names](icon-names.md): every exported icon and illustration');
    }
    const indexLink: Linker = (category, page, anchor) => `${docsFile(category, page)}${anchor}`;
    files.set(
        'llms.txt',
        indexMarkdown(framework, [pkg], pages, indexLink, (other) => `\`node_modules/${packageName(other, framework)}/docs/llms.txt\``, extra)
    );
    return files;
}

/** Files the site serves, keyed by URL path without the leading slash */
export function siteDocs() {
    const files = new Map<string, string>();
    const roots: string[] = [];
    for (const framework of frameworks) {
        const pages = agentPages(framework);
        const base = `${locale}/${framework}`;
        const link: Linker = (category, page, anchor) => {
            const found = pages.some((item) => item.category === category && item.page === page);
            return found ? `${site}/${base}/${docsFile(category, page)}${anchor}` : `${pageUrl(framework, category, page)}${anchor}`;
        };
        for (const page of pages) files.set(`${base}/${docsFile(page.category, page.page)}`, pageMarkdown(page, framework, link));
        files.set(`${base}/changes-from-semi.md`, changesMarkdown(framework));
        files.set(`${base}/icon-names.md`, iconNamesMarkdown(framework));
        const extra = ['## Reference', `- [Changes from Semi Design](${site}/${base}/changes-from-semi.md): breaking and behavior changes that apply to every component`, `- [Icon and illustration names](${site}/${base}/icon-names.md): every exported icon and illustration`];
        files.set(
            `${base}/llms.txt`,
            indexMarkdown(framework, ['ui', 'ai', 'icons'], pages, link, () => '', extra)
        );
        roots.push(`- [${frameworkLabels[framework]}](${site}/${base}/llms.txt): \`${packageName('ui', framework)}\`, \`${packageName('ai', framework)}\`, \`${packageName('icons', framework)}\``);
    }
    files.set(
        'llms.txt',
        [
            '# Semi Design Next',
            '> A component library for React, Vue, Solid and Svelte, forked from Semi Design without upstream compatibility. Pick your framework; its index lists the rules and a Markdown page per component. The installed npm packages carry the same docs for their version under `node_modules/<package>/docs/llms.txt`.',
            roots.join('\n'),
        ].join('\n\n') + '\n'
    );
    return files;
}

function writePackageDocs() {
    for (const framework of frameworks) {
        for (const pkg of ['ui', 'ai', 'icons'] as const) {
            const out = path.join(root, 'packages', `semi-${pkg}-${framework}`, 'docs');
            // docs/ is build output listed in .gitignore, so stale pages are removed with it
            fs.rmSync(out, { recursive: true, force: true });
            const files = packageDocs(framework, pkg);
            for (const [file, content] of files) {
                fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
                fs.writeFileSync(path.join(out, file), content);
            }
            console.log(`${packageName(pkg, framework)}: ${files.size} files`);
        }
    }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) writePackageDocs();
