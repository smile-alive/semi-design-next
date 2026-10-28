// Checks every mdx under content/:
// - Table cell counts: GFM renders a table only when header and delimiter rows match; extra body cells are dropped.
// - Compilation with the `site:build` MDX processor, for React and (with Vue demos) Vue; MDX stops at the first error.
import assert from 'node:assert/strict';
import fs, { globSync } from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, unified } from '@astrojs/markdown-remark';
import remarkDemo from '../plugins/remark-demo.ts';
import { availableFrameworks, frameworks } from '../src/lib/frameworks.ts';

const contentDir = path.join(import.meta.dirname, '../content');

// Cell count of a table row; an unescaped `|` splits even inside inline code (remark-gfm)
function countCells(row: string) {
    let text = row.trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1);
    return text.split(/(?<!\\)\|/).length;
}

const delimiterRow = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/** `line: message` for every table row whose cell count does not fit its header */
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
        if (fence || !lines[i].includes('|') || !delimiterRow.test(lines[i + 1] ?? '') || !lines[i + 1].includes('|')) {
            continue;
        }
        const expected = countCells(lines[i]);
        let end = i + 1;
        while (end < lines.length && lines[end].trim() && !lines[end].trimStart().startsWith('<')) {
            const count = countCells(lines[end]);
            // GFM pads short body rows, so only extra cells (usually an unescaped `|`) and a mismatched delimiter fail
            if (end === i + 1 ? count !== expected : count > expected) {
                errors.push(`${end + 1}: expected ${expected} cells (header), found ${count}`);
            }
            end++;
        }
        i = end - 1;
    }
    return errors;
}

// The astro.config.ts plugins with GFM on and SmartyPants off; the rehype plugins cannot fail
const processor = unified({ remarkPlugins: [remarkDemo], smartypants: false });
assert(processor.createMdxRenderer !== undefined, 'the unified processor renders MDX');
const renderer = await processor.createMdxRenderer({ syntaxHighlight: false }, { optimize: false });

/** `line:column: message` of the first error compiling the file, or null when it compiles */
export async function compileError(source: string, file: string) {
    try {
        // 'empty-with-spaces' keeps the content's line numbers, as Astro strips the frontmatter the same way
        const { frontmatter, content } = parseFrontmatter(source, { frontmatter: 'empty-with-spaces' });
        await renderer.process(content, file, frontmatter);
        // framework-mdx builds index pages once more per other enabled framework, and remark-demo reads the `.<framework>.mdx` suffix
        if (path.basename(file).startsWith('index.')) {
            const demos = globSync('demos/*.{react.tsx,vue,solid.tsx}', { cwd: path.dirname(file) });
            const enabled = availableFrameworks(demos, frontmatter.frameworks, file);
            for (const framework of frameworks.filter((item) => item !== 'react' && enabled.includes(item))) {
                await renderer.process(content, `${file}.${framework}.mdx`, frontmatter);
            }
        }
        return null;
    } catch (error) {
        // YAML errors carry a one-based linePos; unclosed tags name a position only in the message; remark-demo none
        const e = error as {
            line?: number;
            column?: number;
            linePos?: [{ line: number; col: number }, ...unknown[]];
            reason?: string;
            message: string;
        };
        const message = e.reason ?? e.message;
        const at = /\((\d+):(\d+)[-)]/.exec(message);
        const line = e.line ?? e.linePos?.[0].line ?? Number(at?.[1] ?? 1);
        const column = e.column ?? e.linePos?.[0].col ?? Number(at?.[2] ?? 1);
        return `${line}:${column}: ${message}`;
    }
}

function* mdxFiles(dir: string): Generator<string> {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* mdxFiles(full);
        else if (entry.name.endsWith('.mdx')) yield full;
    }
}

if (import.meta.main) {
    let failures = 0;
    for (const file of mdxFiles(contentDir)) {
        const source = fs.readFileSync(file, 'utf8');
        const location = path.relative(process.cwd(), file);
        const errors = tableErrors(source);
        const compiled = await compileError(source, file);
        if (compiled) errors.push(compiled);
        for (const error of errors) console.error(`${location}:${error}`);
        failures += errors.length;
    }
    if (failures) {
        console.error(`${failures} problem(s): table rows that do not fit the header, or mdx that does not compile.`);
        process.exit(1);
    }
}
