// Checks per component and hook whether the Oxc React Compiler compiled it. A skipped function (e.g. `||=`) only
// yields a recoverable diagnostic, so build and tests stay green; a file-level runtime check would miss it.
// usage: node scripts/compiler-check.ts [file...]   (no files: all of semi-ui-react and semi-ai-react)
//   PASS  every component / hook compiled
//   FAIL  one was left uncompiled, or its output calls a hook only on a memo cache miss; exit code 1
//   SKIP  no component or hook the compiler would pick in infer mode
import fs from 'node:fs';
import path from 'node:path';
import { groupBy } from 'es-toolkit';
import { transformSync } from 'oxc-transform-react';
import ts from 'typescript';

type Fn = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction;

const isFn = (node: ts.Node): node is Fn => ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node);
function isHookCall(node: ts.CallExpression) {
    const callee = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression;
    return ts.isIdentifier(callee) && /^use([A-Z0-9]|$)/.test(callee.text);
}
const isWrapper = (node: ts.CallExpression) => /^(React\.)?memo$/.test(node.expression.getText());

// The name the compiler keys on: the function's own, else its assigned variable or property, through memo()
function nameOf(fn: Fn) {
    if (!ts.isArrowFunction(fn) && fn.name) return fn.name.text;
    let parent = fn.parent;
    while (ts.isCallExpression(parent) && isWrapper(parent)) parent = parent.parent;
    if ((ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }
    return undefined;
}

interface Facts {
    hook: boolean;
    jsx: boolean;
    runtime: boolean;
    optOut: boolean;
    // hooks the compiled output only calls when a memo cache slot misses, i.e. not on every render
    cachedHooks: string[];
}

// A branch the compiler guards with its memo cache, such as `if ($[3] !== props)` or
// `if ($[0] === Symbol.for("react.memo_cache_sentinel"))`.
function readsMemoCache(node: ts.Node): boolean {
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && /^\$\d*$/.test(node.expression.text)) {
        return true;
    }
    return ts.forEachChild(node, readsMemoCache) ?? false;
}

function scan(fn: Fn) {
    const facts: Facts = { hook: false, jsx: false, runtime: false, optOut: false, cachedHooks: [] };
    const visit = (node: ts.Node, cached = false) => {
        if (isFn(node) || ts.isClassLike(node)) return;
        if (ts.isCallExpression(node)) {
            if (isHookCall(node)) {
                facts.hook = true;
                if (cached) facts.cachedHooks.push(node.expression.getText());
            }
            if (ts.isIdentifier(node.expression) && node.expression.text === '_c') facts.runtime = true;
        }
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) facts.jsx = true;
        if (ts.isIfStatement(node) && readsMemoCache(node.expression)) {
            visit(node.expression, cached);
            visit(node.thenStatement, true);
            if (node.elseStatement) visit(node.elseStatement, true);
            return;
        }
        ts.forEachChild(node, (child) => visit(child, cached));
    };
    if (fn.body) {
        if (ts.isBlock(fn.body)) {
            for (const statement of fn.body.statements) {
                if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === 'use no memo') {
                    facts.optOut = true;
                }
            }
        }
        visit(fn.body);
    }
    return facts;
}

function functions(code: string, kind: ts.ScriptKind) {
    const found: { name: string; node: Fn; facts: Facts }[] = [];
    const visit = (node: ts.Node) => {
        if (isFn(node)) {
            const name = nameOf(node);
            if (name && /^(use([A-Z0-9]|$)|[A-Z])/.test(name)) found.push({ name, node, facts: scan(node) });
        }
        ts.forEachChild(node, visit);
    };
    visit(ts.createSourceFile('file', code, ts.ScriptTarget.Latest, true, kind));
    return found;
}

const defaultFiles = () =>
    ['semi-ui-react', 'semi-ai-react'].flatMap((name) => {
        const dir = path.resolve(import.meta.dirname, '../../packages', name, 'src');
        return fs
            .globSync('**/*.{ts,tsx}', { cwd: dir, exclude: (entry) => entry === '__tests__' })
            .filter((file) => !file.endsWith('.d.ts') && !file.includes('.test.'))
            .sort()
            .map((file) => path.join(dir, file));
    });
const args = process.argv.slice(2);

let failed = 0;
for (const file of args.length ? args.map((arg) => path.resolve(arg)) : defaultFiles()) {
    const source = fs.readFileSync(file, 'utf8');
    const result = transformSync(file, source, { reactCompiler: { reportDiagnostics: true } });
    const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

    // Same-named functions match in source order; the compiler only adds `_`-prefixed helpers
    const compiled = groupBy(functions(result.code, ts.ScriptKind.JS), (fn) => fn.name);
    const seen = new Map<string, number>();
    const diagnostics = result.errors.map((error) => {
        const start = error.labels?.[0]?.start;
        const line = start === undefined ? '?' : source.slice(0, start).split('\n').length;
        return { start, text: `[${error.severity}] line ${line}: ${error.message}` };
    });

    // `_c(n)` is emitted only when something is memoized; a bail-out always carries a diagnostic, which tells
    // "abandoned" from "nothing to memoize"
    const all = functions(source, kind).map((fn) => {
        const index = seen.get(fn.name) ?? 0;
        seen.set(fn.name, index + 1);
        const own = diagnostics.filter(({ start }) => start !== undefined && start >= fn.node.pos && start < fn.node.end);
        const output = compiled[fn.name]?.[index]?.facts;
        return { ...fn, own, runtime: output?.runtime ?? false, cachedHooks: output?.cachedHooks ?? [] };
    });
    const candidates = all.filter(({ name, facts }) => {
        const isHook = /^use([A-Z0-9]|$)/.test(name);
        return !facts.optOut && (isHook ? facts.hook : facts.hook || facts.jsx);
    });
    const abandoned = candidates.filter(({ runtime, own }) => !runtime && own.length);
    // The compiler can silently memoize an expression with hook calls (`{ left: useRef(null) }`); React then throws
    const skippedHooks = candidates.filter(({ cachedHooks }) => cachedHooks.length);

    const rel = path.relative(process.cwd(), file);
    if (abandoned.length || skippedHooks.length) {
        failed++;
        console.log(`FAIL ${rel}`);
    } else {
        console.log(`${candidates.length ? 'PASS' : 'SKIP'} ${rel}`);
    }
    const explained = new Set<string>();
    for (const { name, own } of abandoned) {
        own.forEach(({ text }) => explained.add(text));
        console.log(`  ${name}: ${own.map(({ text }) => text).join(' | ')}`);
    }
    for (const { name, cachedHooks } of skippedHooks) {
        console.log(`  ${name}: hooks inside a memoized branch, skipped after the first render: ${cachedHooks.join(', ')}`);
    }
    for (const { text } of diagnostics) if (!explained.has(text)) console.log(`  ${text}`);
}
process.exit(failed ? 1 : 0);
