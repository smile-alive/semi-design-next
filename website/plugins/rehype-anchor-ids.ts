// Heading ids and in-site anchors keep the old site's makeAnchorId so existing `#Some Heading` links still resolve.
// It is idempotent, so fragments that are already ids stay unchanged. Ids set here survive Astro's heading handling.
import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

export function makeAnchorId(text: string) {
    return text
        .toLowerCase()
        .replace(/\//g, '')
        .replace(/\s/g, '-')
        .replace(/(\(|\))/g, 'aaa')
        .replace(/\./g, '-')
        .replace(/&/g, '-')
        .replace(/(^[^一-龥^a-z%])/, 'n$1');
}

const textOf = (node: ElementContent): string => (node.type === 'text' ? node.value : 'children' in node ? node.children.map(textOf).join('') : '');

export default function rehypeAnchorIds() {
    return (tree: Root) => {
        // Duplicates get -1, -2 from the second on; the first keeps its id so existing links still hit it.
        const used = new Set<string>();
        visit(tree, 'element', (node: Element) => {
            if (typeof node.properties.id === 'string') {
                used.add(node.properties.id);
            } else if (/^h[1-6]$/.test(node.tagName)) {
                const text = node.children.map(textOf).join('').trim();
                if (text) {
                    const base = makeAnchorId(text);
                    let id = base;
                    for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
                    used.add(id);
                    node.properties.id = id;
                }
            }
            const href = node.tagName === 'a' ? node.properties.href : undefined;
            if (typeof href === 'string' && (href.startsWith('#') || href.startsWith('/')) && href.includes('#')) {
                const [base, fragment] = href.split('#');
                let decoded = fragment;
                try {
                    decoded = decodeURIComponent(fragment);
                } catch {
                    // Malformed escape: keep the fragment as is.
                }
                node.properties.href = `${base}#${makeAnchorId(decoded)}`;
            }
        });
    };
}
