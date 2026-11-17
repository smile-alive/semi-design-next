// Checks that class members follow the order in coding-style.md and that field initializers do not read `this`.
// Usage: node scripts/lint-class-order.ts
// Output: one `file:line member: reason` per violation on stderr, exit code 1 on any violation or parse error.
// Order: index signatures, fields, constructor, methods; arrow, function, debounce, throttle and bind fields count as methods.
// Within fields and within methods: `#` private, protected, public, each with static first.
// A data field initializer must not read `this`: fields initialize in declaration order, which would tie order to behaviour.
import fs from 'node:fs';
import { parseSync } from 'vite/rolldown/utils';
import { children, isNode, lineAt, type Node } from './lib/ast.ts';
import { gitFiles } from './lib/git-files.ts';

const GROUP_NAMES = ['index signature', 'field', 'constructor', 'method'];
const VISIBILITY_NAMES = ['#private', 'protected', 'public'];
const FIELD = 1;

const files = gitFiles('*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs', ':!legacy').filter((file) => !file.endsWith('.d.ts') && !/(^|\/)(dist|node_modules)\//.test(file));

const isFunctionNode = (node: Node) => node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';

function isFunctionValue(value: unknown, source: string) {
    if (!isNode(value)) return false;
    if (isFunctionNode(value)) return true;
    if (value.type !== 'CallExpression') return false;
    const callee = value.callee as Node;
    return /debounce|throttle|\.bind$/i.test(source.slice(callee.start, callee.end));
}

function groupOf(member: Node, source: string) {
    switch (member.type) {
        case 'TSIndexSignature':
            return 0;
        case 'PropertyDefinition':
        case 'TSAbstractPropertyDefinition':
        case 'AccessorProperty':
            return isFunctionValue(member.value, source) ? 3 : FIELD;
        case 'MethodDefinition':
        case 'TSAbstractMethodDefinition':
            return member.kind === 'constructor' ? 2 : 3;
        default:
            // static blocks and anything newer have no agreed place yet
            throw new Error(`unsupported class element ${member.type}`);
    }
}

// Components are single digits, so the joined strings compare lexicographically
function rank(member: Node, source: string) {
    const key = member.key as Node | undefined;
    const visibility = key?.type === 'PrivateIdentifier' ? 0 : member.accessibility === 'protected' ? 1 : 2;
    return [groupOf(member, source), visibility, member.static ? 0 : 1];
}

const describe = ([group, visibility, staticFirst]: number[]) => `${staticFirst === 0 ? 'static ' : ''}${VISIBILITY_NAMES[visibility]} ${GROUP_NAMES[group]}`;

function constructionTimeThisReads(node: Node, source: string): string[] {
    if (isFunctionNode(node)) return [];
    const own = node.type === 'MemberExpression' && (node.object as Node).type === 'ThisExpression' ? [source.slice(node.start, node.end)] : [];
    return [...own, ...children(node).flatMap((child) => constructionTimeThisReads(child, source))];
}

function checkClassBody(body: Node, file: string, source: string) {
    const problems: string[] = [];
    let previous: number[] | undefined;
    for (const member of body.body as Node[]) {
        const current = rank(member, source);
        const key = member.key as Node | undefined;
        const name = key ? source.slice(key.start, key.end) : member.type;
        const where = `${file}:${lineAt(source, member.start)} ${name}`;
        if (previous && previous.join() > current.join()) problems.push(`${where}: ${describe(current)} after ${describe(previous)}`);
        if (current[0] === FIELD && isNode(member.value)) {
            const reads = constructionTimeThisReads(member.value, source);
            if (reads.length) problems.push(`${where}: initializer reads ${reads.join(', ')}`);
        }
        previous = current;
    }
    return problems;
}

function checkFile(file: string) {
    const source = fs.readFileSync(file, 'utf8');
    if (!/\bclass\b/.test(source)) return [];
    const { program, errors } = parseSync(file, source);
    if (errors.length) return [`${file}: parse error ${errors[0].message}`];
    const visit = (node: Node): string[] => {
        const own = node.type === 'ClassBody' ? checkClassBody(node, file, source) : [];
        return [...own, ...children(node).flatMap(visit)];
    };
    // oxc's Program type has no index signature, which the loosely typed Node walker relies on
    return visit(program as unknown as Node);
}

const problems = files.flatMap(checkFile);

if (problems.length) {
    console.error(problems.join('\n'));
    console.error('\nClass members go: fields, constructor, methods; inside each `#` private, protected, public, static first. ' + 'Read other members lazily, e.g. `debounce(() => this.#x(), 100)`.');
    process.exit(1);
}
