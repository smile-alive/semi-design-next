// Checks every website/content .mdx file: table rows fit their header, and the file compiles as MDX.
// Usage: pnpm lint:mdx (in website)
// Output: one `<file>:<line>:<column>: <problem>` line per problem on stderr, exit code 1 on any problem
import assert from 'node:assert/strict';
import fs, { globSync } from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, unified } from '@astrojs/markdown-remark';
import { website } from '../../scripts/lib/paths.ts';
import remarkDemo from '../plugins/remark-demo.ts';
import { availableFrameworks, frameworks } from '../src/lib/frameworks.ts';

const contentDir = path.join(website, 'content');
const delimiterRow = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

// Cell count of a table row; an unescaped `|` splits even inside inline code (remark-gfm)
function countCells(row: string) {
    let text = row.trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1);
    return text.split(/(?<!\\)\|/).length;
}

const isTableHeader = (line: string, next: string | undefined) => line.includes('|') && next?.includes('|') && delimiterRow.test(next);

// Returns the errors of the rows under the header at `headerIndex` and the table's last line
function checkTable(lines: string[], headerIndex: number) {
    const expected = countCells(lines[headerIndex]);
    const errors: string[] = [];
    let end = headerIndex + 1;
    while (end < lines.length && lines[end].trim() && !lines[end].trimStart().startsWith('<')) {
        const count = countCells(lines[end]);
        // GFM pads short body rows, so only extra cells (usually an unescaped `|`) and a mismatched delimiter fail
        const mismatched = end === headerIndex + 1 ? count !== expected : count > expected;
        if (mismatched) errors.push(`${end + 1}: expected ${expected} cells (header), found ${count}`);
        end++;
    }
    return { errors, last: end - 1 };
}

export function tableErrors(source: string) {
    const lines = source.split('\n');
    const errors: string[] = [];
    let fence = '';
    for (let i = 0; i < lines.length; i++) {
        const marker = /^\s*(`{3,}|~{3,})/.exec(lines[i])?.[1];
        if (marker) {
            if (!fence) fence = marker[0];
            else if (marker[0] === fence) fence = '';
            continue;
        }
        if (fence || !isTableHeader(lines[i], lines[i + 1])) continue;
        const table = checkTable(lines, i);
        errors.push(...table.errors);
        i = table.last;
    }
    return errors;
}

// The astro.config.ts plugins with GFM on and SmartyPants off; the rehype plugins cannot fail
const processor = unified({ remarkPlugins: [remarkDemo], smartypants: false });
assert(processor.createMdxRenderer !== undefined, 'the unified processor renders MDX');
const renderer = await processor.createMdxRenderer({ syntaxHighlight: false }, { optimize: false });

// YAML errors carry a one-based linePos; unclosed tags name a position only in the message; remark-demo none
function describeError(error: { line?: number; column?: number; linePos?: [{ line: number; col: number }, ...unknown[]]; reason?: string; message: string }) {
    const message = error.reason ?? error.message;
    const at = /\((\d+):(\d+)[-)]/.exec(message);
    const line = error.line ?? error.linePos?.[0].line ?? Number(at?.[1] ?? 1);
    const column = error.column ?? error.linePos?.[0].col ?? Number(at?.[2] ?? 1);
    return `${line}:${column}: ${message}`;
}

export async function compileError(source: string, file: string) {
    try {
        // 'empty-with-spaces' keeps the content's line numbers, as Astro strips the frontmatter the same way
        const { frontmatter, content } = parseFrontmatter(source, { frontmatter: 'empty-with-spaces' });
        await renderer.process(content, file, frontmatter);
        // framework-mdx builds index pages once more per other enabled framework, and remark-demo reads the `.<framework>.mdx` suffix
        if (path.basename(file).startsWith('index.')) {
            const demos = globSync('demos/*.{react.tsx,vue,solid.tsx,svelte}', { cwd: path.dirname(file) });
            const enabled = availableFrameworks(demos, frontmatter.frameworks, file);
            for (const framework of frameworks.filter((item) => item !== 'react' && enabled.includes(item))) {
                await renderer.process(content, `${file}.${framework}.mdx`, frontmatter);
            }
        }
        return null;
    } catch (error) {
        return describeError(error as Parameters<typeof describeError>[0]);
    }
}

if (import.meta.main) {
    let failures = 0;
    for (const name of globSync('**/*.mdx', { cwd: contentDir }).toSorted()) {
        const file = path.join(contentDir, name);
        const source = fs.readFileSync(file, 'utf8');
        const compiled = await compileError(source, file);
        const errors = tableErrors(source);
        if (compiled) errors.push(compiled);
        const location = path.relative(process.cwd(), file);
        for (const error of errors) console.error(`${location}:${error}`);
        failures += errors.length;
    }
    if (failures) {
        console.error(`${failures} problem(s): table rows that do not fit the header, or mdx that does not compile.`);
        process.exit(1);
    }
}
