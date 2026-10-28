import { execFileSync } from 'node:child_process';
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

export type Locale = 'zh-CN' | 'en-US';
export type Description = Record<Locale, string>;
export interface ApiRow {
    name: string;
    /** Cells after the name and description columns */
    cells: string[];
}

export const website = resolve(import.meta.dirname, '..');
export const root = resolve(website, '..');
export const locales: Locale[] = ['zh-CN', 'en-US'];

function cell(value: string) {
    return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export function apiType(value: string, optional = false) {
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

/** Renders one group's table; every member needs a bilingual description and every description a member */
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

/** Formats each fragment with vp fmt, then writes it, or with `check` fails when the file on disk differs */
export function writeFragments(fragments: { path: string; body: string }[], check: boolean, label: string) {
    const outputs = fragments.map(({ path, body }) => ({
        path,
        content: execFileSync(join(root, 'node_modules/.bin/vp'), ['fmt', '--threads=1', `--stdin-filepath=${path}`], {
            cwd: root,
            input: (body.includes('<ApiType ') ? `import ApiType from '#/components/ApiType.astro';\n\n` : '') + body,
            encoding: 'utf8',
        }),
    }));
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

/** `[--check] [<分类>/<页面>...]`: without pages, every page */
export function runCli(generate: (check: boolean, pages: string[]) => void) {
    const args = process.argv.slice(2);
    const pages = args.filter((arg) => arg !== '--check');
    for (const page of pages) {
        if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(page)) throw new Error(`未知参数：${page}`);
    }
    generate(args.includes('--check'), pages);
}

export function apiFiles(framework: string, pages: string[]) {
    return globSync(pages.length ? pages.map((page) => `content/${page}/api.${framework}.json`) : `content/**/api.${framework}.json`, { cwd: website }).toSorted();
}
