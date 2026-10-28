import type { Rule } from 'eslint';

type Range = [number, number];

// vue-eslint-parser reaches the repo only through eslint-plugin-vue, so its AST types cannot be imported
interface TemplateNode {
    type: string;
    range: Range;
}

interface TemplateElement extends TemplateNode {
    type: 'VElement';
    parent: TemplateNode;
    rawName: string;
    startTag: TemplateNode & { attributes: { directive: boolean; key: { name: string | { name: string } } }[] };
    endTag: TemplateNode | null;
    children: TemplateNode[];
}

interface TagToken {
    range: Range;
    element: TemplateElement;
}

type Child = { kind: 1 | 3 | 5; id: number } | { kind: 2; text: string };

const builtins = new Set(['template', 'slot', 'component', 'transition', 'transitiongroup', 'keepalive', 'teleport', 'suspense']);
// The formatter checks below mirror oxfmt's Prettier HTML printer at this repo's printWidth, so the rule never reports a layout that `vp fmt` joins back.
// Known limit: after upgrading oxfmt or changing printWidth, if the rule reports again once lint-staged has run eslint --fix and vp fmt, update these checks for that case and add a test.
// Elements whose content oxfmt always breaks (Prettier's forceBreakContent and forceBreakChildren, table-cell excluded)
const brokenByFormatter = new Set(['body', 'script', 'style', 'html', 'head', 'ul', 'ol', 'select', 'table', 'caption', 'colgroup', 'thead', 'tbody', 'tfoot', 'tr']);

// Mirrors condenseWhitespace in @vue/compiler-core (whitespace: 'condense'); kinds are its node types: 1 element, 2 text, 3 comment, 5 interpolation
function condense(children: Child[]) {
    const nodes: (Child | null)[] = [...children];
    for (const [i, node] of nodes.entries()) {
        if (node?.kind !== 2) continue;
        if (/^[ \n\t\f\r]*$/.test(node.text)) {
            const prev = nodes[i - 1]?.kind;
            const next = nodes[i + 1]?.kind;
            const atEdge = prev == null || next == null;
            const nextToComment = (prev === 3 && (next === 3 || next === 1)) || (prev === 1 && next === 3);
            const elementsOnNewLine = prev === 1 && next === 1 && /[\n\r]/.test(node.text);
            if (atEdge || nextToComment || elementsOnNewLine) {
                nodes[i] = null;
            } else {
                nodes[i] = { kind: 2, text: ' ' };
            }
        } else {
            nodes[i] = { kind: 2, text: node.text.replace(/[ \n\t\f\r]+/g, ' ') };
        }
    }
    return nodes.filter((node) => node != null).map((node) => (node.kind === 2 ? `text:${node.text}` : `${node.kind}:${node.id}`));
}

// Production builds drop comments while parsing, so the texts around a comment merge into one node
function withoutComments(children: Child[]) {
    const merged: Child[] = [];
    for (const child of children) {
        const last = merged.at(-1);
        if (child.kind === 3) continue;
        if (child.kind === 2 && last?.kind === 2) merged[merged.length - 1] = { kind: 2, text: last.text + child.text };
        else merged.push(child);
    }
    return merged;
}

export const builtinOwnLine: Rule.RuleModule = {
    meta: {
        type: 'layout',
        docs: { description: 'Put Vue built-in elements on lines of their own' },
        fixable: 'whitespace',
        schema: [],
        messages: { ownLine: '<{{name}}> must not share a line with another element tag' },
    },
    create(context) {
        const { sourceCode } = context;
        const { text: source } = sourceCode;
        const line = (offset: number) => sourceCode.getLocFromIndex(offset).line;

        const check = (root: TemplateElement & { comments: TemplateNode[] }) => {
            const tokens: TagToken[] = [];
            const candidates: TemplateElement[] = [];
            const visit = (element: TemplateElement, skipped: boolean) => {
                const name = element.rawName.toLowerCase();
                const vPre = element.startTag.attributes.some(({ directive, key }) => directive && typeof key.name === 'object' && key.name.name === 'pre');
                const skip = skipped || name === 'pre' || name === 'textarea' || vPre;
                tokens.push({ range: element.startTag.range, element });
                if (!skip && element !== root && builtins.has(name.replaceAll('-', ''))) candidates.push(element);
                for (const child of element.children) {
                    if (child.type === 'VElement') visit(child as TemplateElement, skip);
                }
                if (element.endTag) tokens.push({ range: element.endTag.range, element });
            };
            visit(root, false);

            const contentOf = (element: TemplateElement): Range => [element.startTag.range[1], element.endTag?.range[0] ?? element.range[1]];
            const nodesOf = (element: TemplateElement) => {
                const [start, end] = contentOf(element);
                const inner = element.children.filter(({ type }) => type !== 'VText');
                const inChild = ([from, to]: Range) => inner.some((child) => child.type === 'VElement' && child.range[0] <= from && to <= child.range[1]);
                const comments = root.comments.filter(({ range }) => range[0] >= start && range[1] <= end && !inChild(range));
                return [...inner, ...comments].toSorted((a, b) => a.range[0] - b.range[0]);
            };
            const childrenOf = (parent: TemplateElement, insertAt: number) => {
                const [start, end] = contentOf(parent);
                const children: Child[] = [];
                const pushText = (from: number, to: number) => {
                    if (from < insertAt && insertAt < to) throw new Error(`builtin-own-line: gap ${insertAt} lies inside a text node`);
                    // Vue decodes character references before condensing, so `&#32;` is whitespace there; VText.value is already decoded
                    const texts = parent.children.filter(({ type, range }) => type === 'VText' && from <= range[0] && range[1] <= to);
                    const text = texts.map((node) => (node as TemplateNode & { value: string }).value).join('');
                    const inserted = insertAt === from ? `\n${text}` : insertAt === to ? `${text}\n` : text;
                    if (inserted) children.push({ kind: 2, text: inserted });
                };
                let cursor = start;
                for (const node of nodesOf(parent)) {
                    pushText(cursor, node.range[0]);
                    children.push({ kind: node.type === 'VElement' ? 1 : node.type === 'VExpressionContainer' ? 5 : 3, id: node.range[0] });
                    cursor = node.range[1];
                }
                pushText(cursor, end);
                return children;
            };
            const neutral = (parent: TemplateElement, offset: number) => {
                const before = childrenOf(parent, -1);
                const after = childrenOf(parent, offset);
                return condense(before).join('\0') === condense(after).join('\0') && condense(withoutComments(before)).join('\0') === condense(withoutComments(after)).join('\0');
            };
            const pickGap = (parent: TemplateElement, near: number, far: number) => {
                const [low, high] = near < far ? [near, far] : [far, near];
                const bounds = [low, high];
                for (const node of nodesOf(parent)) {
                    if (node.range[0] >= low && node.range[1] <= high) bounds.push(...node.range);
                }
                return bounds.toSorted((a, b) => Math.abs(a - near) - Math.abs(b - near)).find((offset) => neutral(parent, offset));
            };

            const breaks = (from: number, to: number, gaps: Set<number>) => /[\n\r]/.test(source.slice(from, to)) || [...gaps].some((gap) => from <= gap && gap <= to);
            // oxfmt (Prettier's HTML printer) joins a container's children back onto one line when they fit, unless forceBreakContent holds or two adjacent children are already on separate lines
            const keptByFormatter = (container: TemplateElement, gaps: Set<number>) => {
                if (container === root || brokenByFormatter.has(container.rawName.toLowerCase())) return true;
                const nodes = nodesOf(container);
                if (nodes.some((node) => node.type === 'VElement' && nodesOf(node as TemplateElement).length)) return true;
                const [start, end] = contentOf(container);
                // Trimmed so that a line break in the whitespace around a text counts as a break between the text and its neighbour
                const texts = container.children.flatMap(({ type, range }) => {
                    const text = source.slice(...range);
                    const from = range[0] + text.search(/[^ \n\t\f\r]|$/);
                    const to = range[0] + text.replace(/[ \n\t\f\r]+$/, '').length;
                    return type === 'VText' && from < to ? [{ type, range: [from, to] as Range }] : [];
                });
                const children = [...nodes, ...texts].toSorted((a, b) => a.range[0] - b.range[0]);
                if (children.slice(1).some((child, i) => breaks(children[i].range[1], child.range[0], gaps))) return true;
                const [only] = nodes;
                return children.length === 1 && only != null && breaks(start, only.range[0], gaps) && breaks(only.range[1], end, gaps);
            };
            // Siblings of one element separated by spaces only: Vue renders that space, a line break there renders nothing
            const spaceGlued = (element: TemplateElement) => {
                const siblings = nodesOf(element.parent as TemplateElement);
                const index = siblings.indexOf(element);
                return [siblings[index - 1], siblings[index + 1]].some((sibling) => {
                    if (sibling?.type !== 'VElement') return false;
                    const between = source.slice(...(sibling.range[0] < element.range[0] ? [sibling.range[1], element.range[0]] : [element.range[1], sibling.range[0]]));
                    return /^[ \t\f]+$/.test(between);
                });
            };
            // oxfmt keeps element children glued without whitespace on one line, while a line break between them renders nothing
            const gluedGaps = (container: TemplateElement) => {
                const nodes = nodesOf(container);
                return nodes.slice(1).flatMap((node, i) => (nodes[i].range[1] === node.range[0] && neutral(container, node.range[0]) ? [node.range[0]] : []));
            };
            const containersOf = (gaps: number[]) => {
                const containers = new Set<TemplateElement>();
                for (const gap of gaps) {
                    for (let node = tokens.find(({ range }) => range[0] >= gap)?.element; node && node !== root; node = node.parent as TemplateElement) {
                        const [start, end] = contentOf(node);
                        if (start <= gap && gap <= end) containers.add(node);
                    }
                }
                return [...containers];
            };
            // An opened element's content needs breaks at both ends too, otherwise oxfmt hangs the bracket of the tag next to it onto the following line
            const openBoundaries = (opened: Set<TemplateElement>, gaps: Set<number>) => {
                for (const node of opened) {
                    const [start, end] = contentOf(node);
                    const content = source.slice(start, end);
                    const first = start + (content.match(/^[ \n\t\f\r]*/)?.[0].length ?? 0);
                    const last = end - (content.match(/[ \n\t\f\r]*$/)?.[0].length ?? 0);
                    for (const [from, to, gap] of [
                        [start, first, start],
                        [last, end, end],
                    ]) {
                        if (breaks(from, to, gaps)) continue;
                        if (!neutral(node, gap)) return false;
                        gaps.add(gap);
                    }
                }
                return true;
            };
            // oxfmt hangs the closing bracket of an element whose content breaks while its end tag is glued to text or an interpolation, and the rule then fires again on that output
            const textAfter = (node: TemplateElement) => node.endTag != null && /[^ \n\t\f\r<]/.test(source[node.endTag.range[1]] ?? '');

            const claimed = new Set<number>();
            for (const element of candidates) {
                const parent = element.parent as TemplateElement;
                const last = element.endTag ?? element.startTag;
                const startIndex = tokens.findIndex(({ range }) => range === element.startTag.range);
                const lastIndex = tokens.findIndex(({ range }) => range === last.range);
                const sides: [TemplateElement, number, number][] = [];
                const before = tokens[startIndex - 1];
                if (before && line(before.range[1]) === line(element.startTag.range[0])) sides.push([parent, element.startTag.range[0], before.range[1]]);
                const after = tokens[lastIndex + 1];
                if (after && line(after.range[0]) === line(last.range[1])) sides.push([parent, last.range[1], after.range[0]]);
                if (element.endTag) {
                    const first = tokens[startIndex + 1];
                    if (first.element !== element && line(first.range[0]) === line(element.startTag.range[1])) sides.push([element, element.startTag.range[1], first.range[0]]);
                    const closing = tokens[lastIndex - 1];
                    if (closing.element !== element && line(closing.range[1]) === line(element.endTag.range[0])) sides.push([element, element.endTag.range[0], closing.range[1]]);
                }
                if (!sides.length) continue;
                const gaps = sides.map(([container, near, far]) => pickGap(container, near, far));
                // Skipped without a report: a tag glued to text or to a space-separated sibling keeps its line, since every break there renders differently or is undone by the formatter
                if (gaps.some((gap) => gap == null)) continue;
                const all = new Set([...claimed, ...gaps]);
                const opened = new Set(containersOf(gaps).filter((node) => line(node.range[0]) === line(node.range[1])));
                // oxfmt wraps the space before an element that turns multi-line, and Vue renders that space but not a line break
                if ([...opened].some(spaceGlued) || !openBoundaries(opened, all)) continue;
                for (const [container] of sides) {
                    if (!keptByFormatter(container, all)) for (const gap of gluedGaps(container)) all.add(gap);
                }
                if (!sides.every(([container]) => keptByFormatter(container, all))) continue;
                // A nested built-in and its parent can pick the same gap; a second '\n' there would leave a blank line
                const fresh = [...all].filter((gap) => !claimed.has(gap)).toSorted((a, b) => a - b);
                if (containersOf(fresh).some(textAfter)) continue;
                for (const gap of fresh) claimed.add(gap);
                context.report({
                    loc: { start: sourceCode.getLocFromIndex(element.startTag.range[0]), end: sourceCode.getLocFromIndex(element.startTag.range[1]) },
                    messageId: 'ownLine',
                    data: { name: element.rawName },
                    fix: fresh.length ? (fixer) => fresh.map((gap) => fixer.insertTextAfterRange([gap, gap], '\n')) : null,
                });
            }
        };

        return sourceCode.parserServices.defineTemplateBodyVisitor({ "VElement[parent.type='VDocumentFragment']": check });
    },
};
