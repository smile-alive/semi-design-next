import { Text, type VNode } from 'vue';
import slotNodes from '../_base/slot-nodes';

/** The source of a code element from its slot, untrimmed: a fenced block ends with its newline, as in React. */
export default function codeText(nodes: VNode[]): string {
    return slotNodes(nodes)
        .map(([node]) => {
            if (node.type === Text) return String(node.children);
            if (typeof node.type !== 'string') return '';
            if (typeof node.children === 'string') return node.children;
            // rehype plugins such as highlighters split the source into nested elements
            return Array.isArray(node.children) ? codeText(node.children as VNode[]) : '';
        })
        .join('');
}
