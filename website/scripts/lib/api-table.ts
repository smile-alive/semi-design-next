import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { formatSource } from '../../../scripts/lib/format.ts';
import { readJson } from '../../../scripts/lib/json.ts';
import { root, website } from '../../../scripts/lib/paths.ts';

export { root, website };

export type Locale = 'zh-CN' | 'en-US';
export type Description = Record<Locale, string>;
export interface ApiRow {
    name: string;
    cells: string[];
}
/** One component of an `api.<framework>.json`: `json` is the file it was read from */
export interface ApiEntry<D> {
    json: string;
    name: string;
    description: D;
}

export const locales: Locale[] = ['zh-CN', 'en-US'];

export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en');

function cell(value: string) {
    return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

// The checker prints string-literal union members in the order the program first created them, which shifts with
// unrelated source files; sorted, the tables of all frameworks read alike and --check only fails on an API change.
const sortUnions = (type: string) => type.replace(/(["'])[^"'|]*\1(?: \| (["'])[^"'|]*\2)+/g, (run) => run.split(' | ').toSorted().join(' | '));

export function apiType(raw: string, optional = false) {
    const value = sortUnions(raw);
    const parsed = ts.createSourceFile('type.ts', `type T = ${value}`, ts.ScriptTarget.Latest, true);
    const statement = parsed.statements[0];
    const union = statement && ts.isTypeAliasDeclaration(statement) && ts.isUnionTypeNode(statement.type) ? statement.type : undefined;
    const type =
        optional && union
            ? union.types
                  .filter((node) => node.kind !== ts.SyntaxKind.UndefinedKeyword)
                  .map((node) => node.getText(parsed))
                  .join(' | ')
            : value;
    if (type.length > 70 || /[<>`]/.test(type)) {
        const detail = JSON.stringify(type).replaceAll('<', '\\u003c').replaceAll('|', '\\u007c');
        return `<ApiType detail={${detail}}>Type</ApiType>`;
    }
    return `\`${cell(type)}\``;
}

export function renderTable(group: string, title: string, columns: string[], rows: ApiRow[], descriptions: Record<string, Description> | undefined, locale: Locale) {
    if (!descriptions || typeof descriptions !== 'object') throw new Error(`缺少 ${group} 说明`);
    for (const name of Object.keys(descriptions)) {
        if (!rows.some((row) => row.name === name)) throw new Error(`多余说明：${group}.${name}`);
    }
    const lines = rows.map((row) => {
        const text = descriptions[row.name];
        if (!text || locales.some((language) => typeof text[language] !== 'string' || !text[language].trim())) {
            throw new Error(`缺少双语说明：${group}.${row.name}`);
        }
        for (const language of locales) {
            // MDX parses { and < in a table cell as an expression or a tag; only code spans stay literal.
            if (/[{}<]/.test(text[language].replaceAll(/`[^`]*`/g, ''))) throw new Error(`说明中的 { } < 须写在反引号内：${group}.${row.name} ${language}`);
        }
        return `| ${[cell(row.name), cell(text[locale]), ...row.cells].join(' | ')} |`;
    });
    const empty = lines.length ? [] : [`| ${[locale === 'zh-CN' ? '无' : 'None', ...columns.slice(1).map(() => '')].join(' | ')} |`];
    return [`**${title}**`, '', `| ${columns.join(' | ')} |`, `| ${columns.map(() => '---').join(' | ')} |`, ...lines, ...empty].join('\n');
}

export async function writeFragments(fragments: { path: string; body: string }[], check: boolean, label: string) {
    const outputs = await Promise.all(
        fragments.map(async ({ path, body }) => ({
            path,
            content: await formatSource(path, (body.includes('<ApiType ') ? `import ApiType from '#/components/ApiType.astro';\n\n` : '') + body),
        }))
    );
    for (const output of outputs) {
        if (check) {
            if (!existsSync(output.path) || readFileSync(output.path, 'utf8') !== output.content) throw new Error(`${label} API 片段已过时：${relative(root, output.path)}`);
        } else {
            mkdirSync(dirname(output.path), { recursive: true });
            writeFileSync(output.path, output.content);
        }
    }
    console.log(`PASS ${label} API ${check ? '检查' : '生成'}：${outputs.length} 个片段`);
}

/** `[--check] [<category>/<page>...]`: without pages, every page */
export async function runCli(generate: (check: boolean, pages: string[]) => Promise<void>) {
    const { values, positionals: pages } = parseArgs({ allowPositionals: true, options: { check: { type: 'boolean' } } });
    for (const page of pages) {
        if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(page)) throw new Error(`未知参数：${page}`);
    }
    await generate(values.check ?? false, pages);
}

export function apiFiles(framework: string, pages: string[]) {
    return globSync(pages.length ? pages.map((page) => `content/${page}/api.${framework}.json`) : `content/**/api.${framework}.json`, { cwd: website }).toSorted();
}

/** Every component listed in the framework's `api.<framework>.json` files; `sourceSuffix` is the extension its source must have */
export function readApiEntries<D extends { source: string }>(framework: string, pages: string[], sourceSuffix = ''): ApiEntry<D>[] {
    return apiFiles(framework, pages).flatMap((file) => {
        const json = join(website, file);
        return Object.entries(readJson<Record<string, D>>(json)).map(([name, description]) => {
            if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof description.source !== 'string' || !description.source.endsWith(sourceSuffix)) throw new Error(`无效组件配置：${json} ${name}`);
            return { json, name, description };
        });
    });
}

/** The `api/<component>.<framework>.<locale>.mdx` fragments of one entry */
export function apiFragments<D>({ json, name }: ApiEntry<D>, framework: string, render: (locale: Locale) => string) {
    return locales.map((locale) => ({ path: join(dirname(json), 'api', `${name}.${framework}.${locale}.mdx`), body: render(locale) }));
}
