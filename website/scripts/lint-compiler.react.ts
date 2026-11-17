// Checks per component and hook whether the Oxc React Compiler compiled it.
// Usage: pnpm lint:react (repo root), or node website/scripts/lint-compiler.react.ts [file...] (default: all of semi-ui-react and semi-ai-react)
// Output: PASS, SKIP (nothing the compiler picks in infer mode) or FAIL per file, exit code 1 on any FAIL
//
// A skipped function (e.g. `||=`) only yields a recoverable diagnostic, so build and tests stay green.
// FAIL means a function was left uncompiled, or its output calls a hook only on a memo cache miss.
import fs from 'node:fs';
import path from 'node:path';
import { groupBy } from 'es-toolkit';
import { transformSync } from 'oxc-transform-react';
import ts from 'typescript';
import { root } from '../../scripts/lib/paths.ts';

type Fn = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction;

const hookName = /^use([A-Z0-9]|$)/;
const componentOrHookName = /^(use([A-Z0-9]|$)|[A-Z])/;

const isFn = (node: ts.Node): node is Fn => ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node);
const isJsx = (node: ts.Node) => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
const isWrapper = (node: ts.CallExpression) => /^(React\.)?memo$/.test(node.expression.getText());

function isHookCall(node: ts.CallExpression) {
    const callee = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression;
    return ts.isIdentifier(callee) && hookName.test(callee.text);
}

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

// A branch the compiler guards with its memo cache, such as `if ($[3] !== props)`
function readsMemoCache(node: ts.Node): boolean {
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && /^\$\d*$/.test(node.expression.text)) {
        return true;
    }
    return ts.forEachChild(node, readsMemoCache) ?? false;
}

function hasUseNoMemo(fn: Fn) {
    if (!fn.body || !ts.isBlock(fn.body)) return false;
    return fn.body.statements.some((statement) => ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === 'use no memo');
}

function scan(fn: Fn) {
    let hook = false;
    let jsx = false;
    let runtime = false;
    // Hooks the compiled output calls only on a memo cache miss, i.e. not on every render
    const cachedHooks: string[] = [];
    const visit = (node: ts.Node, cached = false) => {
        if (isFn(node) || ts.isClassLike(node)) return;
        if (ts.isCallExpression(node)) {
            if (isHookCall(node)) {
                hook = true;
                if (cached) cachedHooks.push(node.expression.getText());
            }
            if (ts.isIdentifier(node.expression) && node.expression.text === '_c') runtime = true;
        }
        if (isJsx(node)) jsx = true;
        if (ts.isIfStatement(node) && readsMemoCache(node.expression)) {
            visit(node.expression, cached);
            visit(node.thenStatement, true);
            if (node.elseStatement) visit(node.elseStatement, true);
            return;
        }
        ts.forEachChild(node, (child) => visit(child, cached));
    };
    if (fn.body) visit(fn.body);
    return { hook, jsx, runtime, optOut: hasUseNoMemo(fn), cachedHooks };
}

function functions(code: string, kind: ts.ScriptKind) {
    const found: { name: string; node: Fn; facts: ReturnType<typeof scan> }[] = [];
    const visit = (node: ts.Node) => {
        if (isFn(node)) {
            const name = nameOf(node);
            if (name && componentOrHookName.test(name)) found.push({ name, node, facts: scan(node) });
        }
        ts.forEachChild(node, visit);
    };
    visit(ts.createSourceFile('file', code, ts.ScriptTarget.Latest, true, kind));
    return found;
}

function defaultFiles() {
    return ['semi-ui-react', 'semi-ai-react'].flatMap((name) => {
        const dir = path.join(root, 'packages', name, 'src');
        return fs
            .globSync('**/*.{ts,tsx}', { cwd: dir, exclude: (entry) => entry === '__tests__' })
            .filter((file) => !file.endsWith('.d.ts') && !file.includes('.test.'))
            .toSorted()
            .map((file) => path.join(dir, file));
    });
}

function diagnosticsOf(errors: ReturnType<typeof transformSync>['errors'], source: string) {
    return errors.map((error) => {
        const start = error.labels?.[0]?.start;
        const line = start === undefined ? '?' : source.slice(0, start).split('\n').length;
        return { start, text: `[${error.severity}] line ${line}: ${error.message}` };
    });
}

function analyze(file: string) {
    const source = fs.readFileSync(file, 'utf8');
    const result = transformSync(file, source, { reactCompiler: { reportDiagnostics: true } });
    const diagnostics = diagnosticsOf(result.errors, source);

    // Same-named functions match in source order; the compiler only adds `_`-prefixed helpers
    const compiled = groupBy(functions(result.code, ts.ScriptKind.JS), (fn) => fn.name);
    const seen = new Map<string, number>();

    // `_c(n)` is emitted only when something is memoized; a bail-out always carries a diagnostic, which tells
    // "abandoned" from "nothing to memoize"
    const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const all = functions(source, kind).map((fn) => {
        const index = seen.get(fn.name) ?? 0;
        seen.set(fn.name, index + 1);
        const own = diagnostics.filter(({ start }) => start !== undefined && start >= fn.node.pos && start < fn.node.end);
        const output = compiled[fn.name]?.[index]?.facts;
        return { ...fn, own, runtime: output?.runtime ?? false, cachedHooks: output?.cachedHooks ?? [] };
    });
    const candidates = all.filter(({ name, facts }) => !facts.optOut && (hookName.test(name) ? facts.hook : facts.hook || facts.jsx));
    return {
        diagnostics,
        candidates,
        abandoned: candidates.filter(({ runtime, own }) => !runtime && own.length),
        // The compiler can silently memoize an expression with hook calls (`{ left: useRef(null) }`); React then throws
        skippedHooks: candidates.filter(({ cachedHooks }) => cachedHooks.length),
    };
}

// Returns whether the file failed
function report(file: string) {
    const { diagnostics, candidates, abandoned, skippedHooks } = analyze(file);
    const failed = abandoned.length > 0 || skippedHooks.length > 0;
    const status = failed ? 'FAIL' : candidates.length ? 'PASS' : 'SKIP';
    console.log(`${status} ${path.relative(process.cwd(), file)}`);

    for (const { name, own } of abandoned) {
        console.log(`  ${name}: ${own.map(({ text }) => text).join(' | ')}`);
    }
    for (const { name, cachedHooks } of skippedHooks) {
        console.log(`  ${name}: hooks inside a memoized branch, skipped after the first render: ${cachedHooks.join(', ')}`);
    }
    const explained = new Set(abandoned.flatMap(({ own }) => own.map(({ text }) => text)));
    for (const { text } of diagnostics) if (!explained.has(text)) console.log(`  ${text}`);
    return failed;
}

const args = process.argv.slice(2);
const files = args.length ? args.map((arg) => path.resolve(arg)) : defaultFiles();
const failedCount = files.filter(report).length;
process.exit(failedCount ? 1 : 0);
