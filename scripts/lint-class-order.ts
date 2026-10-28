// Class member order from .agents/references/coding-style.md (oxlint has no member-ordering rule): index signatures,
// fields, constructor, methods. Arrow, function, debounce, throttle and bind fields count as methods.
// Within fields and within methods: `#` private, protected, public, static first inside each visibility.
// A data field initializer must not read `this`: fields initialize in declaration order, tying order to behaviour.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { parseSync } from 'vite/rolldown/utils';

interface Node {
    type: string;
    start: number;
    end: number;
    [key: string]: unknown;
}

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs', ':!legacy'], { encoding: 'utf8' })
    .split('\n')
    // --cached still lists files deleted in the worktree but not yet staged
    .filter((file) => file && !file.endsWith('.d.ts') && !/(^|\/)(lib|dist|node_modules)\//.test(file) && fs.existsSync(file));

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && typeof (value as Node).type === 'string';

function children(node: Node) {
    return Object.values(node).flatMap((value) => (Array.isArray(value) ? value.filter(isNode) : isNode(value) ? [value] : []));
}

function isFunctionValue(value: unknown, source: string) {
    if (!isNode(value)) return false;
    if (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression') return true;
    if (value.type !== 'CallExpression') return false;
    const callee = value.callee as Node;
    return /debounce|throttle|\.bind$/i.test(source.slice(callee.start, callee.end));
}

const GROUP_NAMES = ['index signature', 'field', 'constructor', 'method'];
const VISIBILITY_NAMES = ['#private', 'protected', 'public'];

function rank(member: Node, source: string) {
    let group: number;
    switch (member.type) {
        case 'TSIndexSignature':
            group = 0;
            break;
        case 'PropertyDefinition':
        case 'TSAbstractPropertyDefinition':
        case 'AccessorProperty':
            group = isFunctionValue(member.value, source) ? 3 : 1;
            break;
        case 'MethodDefinition':
        case 'TSAbstractMethodDefinition':
            group = member.kind === 'constructor' ? 2 : 3;
            break;
        default:
            // static blocks and anything newer have no agreed place yet
            throw new Error(`unsupported class element ${member.type}`);
    }
    const key = member.key as Node | undefined;
    const visibility = key?.type === 'PrivateIdentifier' ? 0 : member.accessibility === 'protected' ? 1 : 2;
    return [group, visibility, member.static ? 0 : 1];
}

function describe(r: number[]) {
    return `${r[2] === 0 ? 'static ' : ''}${VISIBILITY_NAMES[r[1]]} ${GROUP_NAMES[r[0]]}`;
}

function constructionTimeThisReads(node: Node, source: string, found: string[] = []) {
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') return found;
    if (node.type === 'MemberExpression' && (node.object as Node).type === 'ThisExpression') {
        found.push(source.slice(node.start, node.end));
    }
    for (const child of children(node)) constructionTimeThisReads(child, source, found);
    return found;
}

const problems: string[] = [];
for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    if (!/\bclass\b/.test(source)) continue;
    const { program, errors } = parseSync(file, source);
    if (errors.length) {
        problems.push(`${file}: parse error ${errors[0].message}`);
        continue;
    }
    const line = (offset: number) => source.slice(0, offset).split('\n').length;
    const visit = (node: Node) => {
        if (node.type === 'ClassBody') {
            const members = node.body as Node[];
            members.reduce<number[] | undefined>((previous, member) => {
                const current = rank(member, source);
                const key = member.key as Node | undefined;
                const name = key ? source.slice(key.start, key.end) : member.type;
                // every rank component is a single digit, so string comparison is lexicographic order
                if (previous && previous.join() > current.join()) {
                    problems.push(`${file}:${line(member.start)} ${name}: ${describe(current)} after ${describe(previous)}`);
                }
                if (current[0] === 1 && isNode(member.value)) {
                    const reads = constructionTimeThisReads(member.value, source);
                    if (reads.length) problems.push(`${file}:${line(member.start)} ${name}: initializer reads ${reads.join(', ')}`);
                }
                return current;
            }, undefined);
        }
        for (const child of children(node)) visit(child);
    };
    visit(program as unknown as Node);
}

if (problems.length) {
    console.error(problems.join('\n'));
    console.error('\nClass members go: fields, constructor, methods; inside each `#` private, protected, public, static first. ' + 'Read other members lazily, e.g. `debounce(() => this.#x(), 100)`.');
    process.exit(1);
}
