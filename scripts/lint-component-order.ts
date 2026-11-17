// Checks and fixes statement order inside component bodies, SFC setup scripts and composables.
// Usage: pnpm lint:component-order [--fix]
// Output: one "component-order <framework> <kind>: N files" line per target and one line per problem (--fix rewrites the files and prints the count), exit code 1 on misordered statements, parse errors or targets matching no files.
// Each framework's calls and targets come from lint/<framework>/component-order.ts; the rules are in .agents/references/components.md.
// A statement never moves above one it reads, directly or through the bindings it reads: closures may run during setup
// or render, so a read inside a function counts. Calls registering effects, watchers or lifecycle hooks keep their order
// among their own kind; composables may register any of them and keep their order among all such calls. Anything
// unclassified (if, for, assignments, directives, return, await) is a barrier no statement crosses.
// A blank line goes between groups, between functions, around multi-line statements and before a leading comment.
import fs from 'node:fs';
import { parseSync } from 'vite/rolldown/utils';
import { type Calls, type Group, GROUPS, semiCalls, type Sequence } from '../lint/component-order.ts';
import { frameworks } from '../lint/index.ts';
import { children, lineAt, type Node } from './lib/ast.ts';
import { gitFiles } from './lib/git-files.ts';

type Span = Pick<Node, 'start' | 'end'>;

// The exclude pathspec `:!*/__tests__/*` matched the tests locally but not on the CI runner's git
const listed = (pathspecs: string[]) => gitFiles(...pathspecs).filter((file) => !file.includes('/__tests__/'));

// `const [XxxContext, useXxx] = createContext(...)` names context readers that do not end in `Context`
const contextReaders = new Set(
    listed(['packages/*/src/*.ts', 'packages/*/src/*.tsx']).flatMap((file) =>
        fs
            .readFileSync(file, 'utf8')
            .matchAll(/\[\s*\w+\s*,\s*(\w+)\s*\]\s*=\s*createContext\b/g)
            .map((match) => match[1])
            .toArray()
    )
);

const isFunction = (node: Node) => node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';

const WRAPPERS = ['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'ParenthesizedExpression', 'ChainExpression'];

function unwrap(node: Node) {
    while (WRAPPERS.includes(node.type)) node = node.expression as Node;
    return node;
}

function calleeName(call: Node): string | undefined {
    const callee = unwrap(call.callee as Node);
    if (callee.type === 'Identifier') return callee.name as string;
    if (callee.type === 'MemberExpression' && !callee.computed) {
        const object = callee.object as Node;
        const property = callee.property as Node;
        // Svelte runes are `$name.variant`; the variant alone (`by`, `id`, `raw`) would collide with ordinary methods
        return object.type === 'Identifier' && (object.name as string).startsWith('$') ? `${object.name as string}.${property.name as string}` : (property.name as string);
    }
    return undefined;
}

function classifyCall(call: Node, declared: boolean, calls: Calls): [Group, Sequence?] | undefined {
    const name = calleeName(call);
    if (!name) return undefined;
    if (calls[name]) return calls[name];
    if (semiCalls[name]) return semiCalls[name];
    // Svelte's createContext returns [get, set], so the second name contextReaders collects is the setter
    if (/^provide[A-Z]/.test(name) || /^set\w*Context$/.test(name)) return ['provide'];
    if (contextReaders.has(name) || /^(use|require|get)\w*Context$/.test(name)) return ['context'];
    if (/^use[A-Z]/.test(name)) return [declared ? 'composable' : 'effect', 'opaque'];
    return undefined;
}

function hasTopLevelAwait(node: Node) {
    if (isFunction(node)) return false;
    if (node.type === 'AwaitExpression' || (node.type === 'ForOfStatement' && node.await)) return true;
    return children(node).some(hasTopLevelAwait);
}

interface Kind {
    group: Group;
    sequence?: Sequence;
    barrier: boolean;
}

const kind = (group: Group, sequence?: Sequence): Kind => ({ group, sequence, barrier: false });

function classify(node: Node, propsNames: Set<string>, calls: Calls): Kind {
    const barrier: Kind = { group: node.type === 'ReturnStatement' ? 'return' : 'other', barrier: true };
    if (hasTopLevelAwait(node)) return barrier;
    switch (node.type) {
        case 'ImportDeclaration':
            return kind('import');
        case 'TSTypeAliasDeclaration':
        case 'TSInterfaceDeclaration':
            return kind('type');
        case 'ExportNamedDeclaration': {
            const declaration = node.declaration as Node | null;
            // a .svelte script's `export function` is the component's handle for parents
            if (declaration?.type === 'FunctionDeclaration') return kind('expose');
            return node.exportKind === 'type' || declaration?.type === 'TSTypeAliasDeclaration' || declaration?.type === 'TSInterfaceDeclaration' ? kind('type') : barrier;
        }
        case 'FunctionDeclaration':
            return kind('function');
        case 'ExpressionStatement': {
            const expression = unwrap(node.expression as Node);
            if (node.directive || expression.type !== 'CallExpression') return barrier;
            const call = classifyCall(expression, false, calls);
            return call ? kind(...call) : barrier;
        }
        case 'VariableDeclaration': {
            const kinds = (node.declarations as Node[]).map((declarator) => classifyDeclarator(declarator, node.kind === 'let', propsNames, calls));
            if (kinds.some((k) => k.group !== kinds[0].group)) return barrier;
            return kinds.length === 1 ? kinds[0] : kind(kinds[0].group, kinds.some((k) => k.sequence) ? 'opaque' : undefined);
        }
        default:
            return barrier;
    }
}

function classifyDeclarator(declarator: Node, mutable: boolean, propsNames: Set<string>, calls: Calls): Kind {
    if (!declarator.init) return kind('state');
    if ((declarator.id as Node).name === 'props') return kind('props');
    const init = unwrap(declarator.init as Node);
    if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') return kind('function');
    if (init.type === 'NewExpression') return kind('state');
    if (init.type === 'Identifier' && propsNames.has(init.name as string)) return kind('props');
    if (init.type === 'CallExpression') {
        const call = classifyCall(init, true, calls);
        if (call) return kind(...call);
    }
    return kind(mutable ? 'state' : 'derived');
}

function patternNames(node: Node | null, names: Set<string>) {
    if (!node) return names;
    switch (node.type) {
        case 'Identifier':
            names.add(node.name as string);
            break;
        case 'ObjectPattern':
            for (const property of node.properties as Node[]) patternNames(property.type === 'RestElement' ? (property.argument as Node) : (property.value as Node), names);
            break;
        case 'ArrayPattern':
            for (const element of node.elements as (Node | null)[]) patternNames(element, names);
            break;
        case 'RestElement':
            patternNames(node.argument as Node, names);
            break;
        case 'AssignmentPattern':
            patternNames(node.left as Node, names);
            break;
    }
    return names;
}

function declaredNames(node: Node): Set<string> {
    if (node.type === 'VariableDeclaration') {
        const names = new Set<string>();
        for (const declarator of node.declarations as Node[]) patternNames(declarator.id as Node, names);
        return names;
    }
    if (node.type === 'ImportDeclaration') return new Set((node.specifiers as Node[]).map((specifier) => (specifier.local as Node).name as string));
    if (node.type === 'ExportNamedDeclaration') return node.declaration ? declaredNames(node.declaration as Node) : new Set();
    const id = node.id as Node | null | undefined;
    return new Set(id?.type === 'Identifier' ? [id.name as string] : []);
}

// keys that name something rather than read it
const isNameKey = (node: Node, key: string) => (key === 'property' && node.type === 'MemberExpression' && !node.computed) || (key === 'key' && !node.computed) || (key === 'name' && node.type === 'JSXAttribute') || key === 'label';

function readNames(node: Node, names = new Set<string>()) {
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') names.add(node.name as string);
    const read = Object.fromEntries(Object.entries(node).filter(([key]) => !isNameKey(node, key))) as Node;
    for (const child of children(read)) readNames(child, names);
    return names;
}

interface Chunk extends Kind {
    // from the leading comment, through the statement, to a comment on its last line
    start: number;
    end: number;
    statement: Node;
    declares: Set<string>;
    reads: Set<string>;
}

interface Ordered {
    text: string;
    // first chunk out of place, or undefined when only blank lines differ
    misplaced?: Chunk;
}

// A comment on the statement's last line belongs to it
function endWithTrailingComments(source: string, comments: Span[], statementEnd: number) {
    let end = statementEnd;
    for (const comment of comments) {
        if (comment.start < end) continue;
        if (!/^[ \t]*$/.test(source.slice(end, comment.start))) break;
        end = comment.end;
    }
    return end;
}

function toChunks(source: string, statements: Node[], comments: Span[], bodyStart: number, propsNames: Set<string>, calls: Calls) {
    const chunks: Chunk[] = [];
    let previous = bodyStart;
    for (const node of statements) {
        const leading = comments.find((comment) => comment.start >= previous && comment.end <= node.start);
        const start = leading?.start ?? node.start;
        const end = endWithTrailingComments(source, comments, node.end);
        if (!/^\s*$/.test(source.slice(previous, start))) throw new Error(`unexpected text before offset ${start}`);
        chunks.push({ ...classify(node, propsNames, calls), start, end, statement: node, declares: declaredNames(node), reads: readNames(node) });
        previous = end;
    }
    return chunks;
}

// A chunk also reads whatever the bindings it reads read
function propagateReads(chunks: Chunk[]) {
    const declaredBy = new Map<string, Chunk>();
    for (const chunk of chunks) for (const name of chunk.declares) declaredBy.set(name, chunk);
    for (let changed = true; changed;) {
        changed = false;
        for (const chunk of chunks) {
            for (const name of chunk.reads) {
                for (const inherited of declaredBy.get(name)?.reads ?? []) {
                    if (!chunk.reads.has(inherited)) {
                        chunk.reads.add(inherited);
                        changed = true;
                    }
                }
            }
        }
    }
}

const sequenced = (a: Chunk, b: Chunk) => a.sequence && b.sequence && (a.sequence === b.sequence || a.sequence === 'opaque' || b.sequence === 'opaque');
const mustPrecede = (a: Chunk, b: Chunk) => a.barrier || b.barrier || sequenced(a, b) || !a.declares.isDisjointFrom(b.reads);

// Greedy: repeatedly place the lowest-group statement that no remaining earlier statement must precede
function placementOrder(chunks: Chunk[]) {
    const rank = (index: number) => GROUPS.indexOf(chunks[index].group) * chunks.length + index;
    const placed: number[] = [];
    const remaining = new Set(chunks.keys());
    while (remaining.size) {
        let pick: number | undefined;
        for (const j of remaining) {
            const ready = [...remaining].every((i) => i >= j || !mustPrecede(chunks[i], chunks[j]));
            if (ready && (pick === undefined || rank(j) < rank(pick))) pick = j;
        }
        if (pick === undefined) throw new Error('no statement can go first');
        placed.push(pick);
        remaining.delete(pick);
    }
    return placed;
}

function renderBody(source: string, chunks: Chunk[], placed: number[], prefix: string, indent: string, bodyEnd: number) {
    const multiline = (chunk: Chunk) => source.slice(chunk.statement.start, chunk.statement.end).includes('\n');
    let text = prefix;
    for (const [position, index] of placed.entries()) {
        const chunk = chunks[index];
        if (position > 0) {
            const last = chunks[placed[position - 1]];
            const commented = chunk.start < chunk.statement.start;
            const blank = !(last.group === 'import' && chunk.group === 'import') && (last.group !== chunk.group || chunk.group === 'function' || multiline(last) || multiline(chunk) || commented);
            text += (blank ? '\n\n' : '\n') + indent;
        }
        text += source.slice(chunk.start, chunk.end);
    }
    return text + source.slice(chunks[chunks.length - 1].end, bodyEnd);
}

function orderBody(source: string, statements: Node[], comments: Span[], bodyStart: number, bodyEnd: number, propsNames: Set<string>, calls: Calls): Ordered | undefined {
    if (statements.length < 2) return undefined;
    const chunks = toChunks(source, statements, comments, bodyStart, propsNames, calls);
    const prefix = source.slice(bodyStart, chunks[0].start);
    if (!prefix.includes('\n')) return undefined;
    const indent = prefix.slice(prefix.lastIndexOf('\n') + 1);

    propagateReads(chunks);
    const placed = placementOrder(chunks);
    const moved = placed.findIndex((index, position) => index !== position);
    return { text: renderBody(source, chunks, placed, prefix, indent, bodyEnd), misplaced: moved === -1 ? undefined : chunks[placed[moved]] };
}

interface Edit {
    start: number;
    end: number;
    ordered: Ordered;
    name: string;
}

const isFunctionExpression = (node: Node | null): node is Node => node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression';

function topLevelFunction(statement: Node): [string, Node] | undefined {
    const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? (statement.declaration as Node | null) : statement;
    if (declaration?.type === 'FunctionDeclaration') return [((declaration.id as Node | null)?.name as string) ?? '', declaration];
    if (declaration?.type !== 'VariableDeclaration') return undefined;
    const [declarator] = declaration.declarations as Node[];
    const init = declarator.init as Node | null;
    return isFunctionExpression(init) ? [((declarator.id as Node).name as string) ?? '', init] : undefined;
}

const functionsNamed = (program: Node, pattern: RegExp) => (program.body as Node[]).map(topLevelFunction).filter((found): found is [string, Node] => found !== undefined && pattern.test(found[0]));

// the first parameter is a component's props, or a composable's input, which is likewise there from the start
function bodyEdits(source: string, comments: Span[], functions: [string, Node][], calls: Calls): Edit[] {
    return functions.flatMap(([name, fn]) => {
        const body = fn.body as Node;
        if (body.type !== 'BlockStatement') return [];
        const [param] = fn.params as Node[];
        const propsNames = new Set(['props']);
        if (param?.type === 'Identifier') propsNames.add(param.name as string);
        const ordered = orderBody(source, body.body as Node[], comments, body.start + 1, body.end - 1, propsNames, calls);
        return ordered ? [{ start: body.start + 1, end: body.end - 1, ordered, name }] : [];
    });
}

const fix = process.argv.includes('--fix');
const problems: string[] = [];
let fixedFiles = 0;

function applyEdits(source: string, edits: Edit[]) {
    let next = source;
    for (const edit of edits.toSorted((a, b) => b.start - a.start)) next = next.slice(0, edit.start) + edit.ordered.text + next.slice(edit.end);
    return next;
}

function report(file: string, source: string, edits: Edit[]) {
    const changed = edits.filter((edit) => edit.ordered.text !== source.slice(edit.start, edit.end));
    if (!changed.length) return;
    if (fix) {
        fs.writeFileSync(file, applyEdits(source, changed));
        fixedFiles++;
        return;
    }
    for (const { start, ordered, name } of changed) {
        const { misplaced } = ordered;
        problems.push(misplaced ? `${file}:${lineAt(source, misplaced.start)} ${name}: ${misplaced.group} statement belongs earlier` : `${file}:${lineAt(source, start)} ${name}: blank lines between groups and around multi-line statements`);
    }
}

function parse(file: string, source: string, parseName = file) {
    const { program, comments, errors } = parseSync(parseName, source);
    if (errors.length) {
        problems.push(`${file}: parse error ${errors[0].message}`);
        return undefined;
    }
    return { program: program as unknown as Node, comments };
}

function componentEdits(file: string, source: string, calls: Calls) {
    const parsed = parse(file, source);
    if (!parsed) return [];
    return bodyEdits(source, parsed.comments, functionsNamed(parsed.program, /^[A-Z]/), calls);
}

/** What `--fix` writes for a file of capitalised component functions */
export const fixComponents = (file: string, source: string, calls: Calls) => applyEdits(source, componentEdits(file, source, calls));

function components(files: string[], calls: Calls) {
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        report(file, source, componentEdits(file, source, calls));
    }
}

// attribute values match whole: `generic="T extends Record<string, any>"` contains `>`
const scriptOpen = /<script\b(?:\s+[^\s=>]+(?:="[^"]*"|='[^']*'|=[^\s>]+)?)*\s*>/g;

function orderScript(file: string, source: string, open: RegExpExecArray, name: string, calls: Calls) {
    const start = open.index + open[0].length;
    const end = source.indexOf('</script>', start);
    const content = source.slice(start, end);
    const parsed = parse(file, content, `${file}.ts`);
    if (!parsed) return;
    const ordered = orderBody(content, parsed.program.body as Node[], parsed.comments, 0, content.length, new Set(), calls);
    if (ordered) report(file, source, [{ start, end, ordered, name }]);
}

function scriptSetup(files: string[], calls: Calls) {
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        if (!source.includes('<script')) continue;
        const open = new RegExp(scriptOpen).exec(source);
        if (!open || !/\ssetup\b/.test(open[0])) {
            problems.push(`${file}: the first script block must be <script setup>`);
            continue;
        }
        orderScript(file, source, open, '<script setup>', calls);
    }
}

// The instance script is the one without `module` (or Svelte 4's `context="module"`); a component without one has nothing to order
function svelteScript(files: string[], calls: Calls) {
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        const open = source.matchAll(scriptOpen).find((match) => !/\s(?:module|context)\b/.test(match[0]));
        if (!open) continue;
        if (!/\slang=["']ts["']/.test(open[0])) {
            problems.push(`${file}: the instance script must be <script lang="ts">`);
            continue;
        }
        orderScript(file, source, open, '<script>', calls);
    }
}

// Composables and defineComponent setups run inside a component's setup, so they take the <script setup> order
function composables(files: string[], calls: Calls) {
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        const parsed = parse(file, source);
        if (!parsed) continue;
        const functions = functionsNamed(parsed.program, /^use[A-Z]/);
        // the search skips functions already taken, whose bodies would otherwise be rewritten twice
        const search = (node: Node) => {
            if (functions.some(([, fn]) => fn === node)) return;
            if (node.type === 'CallExpression' && calleeName(node) === 'defineComponent') {
                const [options] = node.arguments as Node[];
                const setup = options?.type === 'ObjectExpression' ? ((options.properties as Node[]).find((property) => (property.key as Node | undefined)?.name === 'setup')?.value as Node | undefined) : options;
                if (setup && isFunction(setup)) functions.push(['defineComponent', setup]);
            }
            children(node).forEach(search);
        };
        search(parsed.program);
        report(file, source, bodyEdits(source, parsed.comments, functions, calls));
    }
}

// A framework whose component bodies fit none of these shapes needs a new kind here; JSX frameworks whose
// components are capitalised functions use `components`
const handlers = { components, 'script-setup': scriptSetup, 'svelte-script': svelteScript, composables };

function main() {
    for (const framework of frameworks) {
        for (const { kind, pathspecs } of framework.componentOrder.targets) {
            const files = listed(pathspecs);
            console.log(`component-order ${framework.name.toLowerCase()} ${kind}: ${files.length} files`);
            if (!files.length) problems.push(`${framework.name} ${kind}: no files match ${pathspecs.join(', ')}`);
            handlers[kind](files, framework.componentOrder.calls);
        }
    }

    if (fix) console.log(`reordered ${fixedFiles} files`);
    if (problems.length) {
        console.error(problems.join('\n'));
        console.error(`\nComponent statements go: ${GROUPS.slice(0, -2).join(', ')}, with a blank line between groups and around multi-line statements. ` + 'A statement stays below what it reads, order-sensitive calls keep their order, and other statements are barriers. Run `pnpm lint:component-order --fix`.');
        process.exit(1);
    }
}

if (import.meta.main) main();
