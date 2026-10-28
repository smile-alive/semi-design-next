// Wide API tables scroll inside their own container instead of stretching the page on narrow screens.
import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

export default function rehypeTableContainer() {
    return (tree: Root) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.tagName !== 'table' || !parent || index === undefined) return;
            parent.children[index] = {
                type: 'element',
                tagName: 'div',
                properties: { className: ['table-container'] },
                children: [node],
            };
            return 'skip';
        });
    };
}
