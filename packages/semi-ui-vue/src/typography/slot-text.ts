import { type VNode, Text, createTextVNode } from 'vue';
import { toVNodes } from '../_base/read-vnode';
import slotNodes, { type KeyedNode } from '../_base/slot-nodes';

/** The child nodes of an element whose children are an array */
export function elementChildren(node: VNode): KeyedNode[] {
    // h() children may hold strings, numbers and nested arrays, which Vue only normalizes on mount
    return slotNodes(Array.isArray(node.children) ? toVNodes(node.children) : []);
}

/**
 * Slot nodes without the space templates keep at each end, so the full content reads the same as the trimmed text the
 * ellipsis shows before it is measured. New text nodes replace the edges: cached static nodes must not change in place.
 */
export function trimEdgeText(nodes: KeyedNode[]) {
    if (nodes.length === 0) return nodes;
    const trimmed = [...nodes];
    const trimAt = (index: number, cut: (value: string) => string) => {
        const [node, key] = trimmed[index];
        if (node.type === Text) trimmed[index] = [createTextVNode(cut(String(node.children))), key];
    };
    trimAt(0, (value) => value.trimStart());
    trimAt(trimmed.length - 1, (value) => value.trimEnd());
    return trimmed.filter(([node]) => node.type !== Text || node.children !== '');
}

/**
 * The text of slot nodes: text nodes and the text inside elements, formatted piece by piece when `format` is given.
 * Components are not text, so `pure` turns false. The result is trimmed because templates keep one space at each
 * end of the slot content, which JSX drops.
 */
export default function slotText(nodes: KeyedNode[], format?: (value: string) => string): { text: string; pure: boolean } {
    let pure = true;
    const piece = (value: string) => (format ? format(value) : value);
    const collect = (list: KeyedNode[]): string =>
        list
            .map(([node]) => {
                if (node.type === Text) return piece(String(node.children));
                if (typeof node.type === 'string') {
                    return typeof node.children === 'string' ? piece(node.children) : collect(elementChildren(node));
                }
                pure = false;
                return '';
            })
            .join('');
    const text = collect(nodes).trim();
    return { text, pure };
}
