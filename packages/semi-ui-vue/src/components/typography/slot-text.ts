import { type VNode, Text, createTextVNode } from 'vue';
import { toVNodes, slotNodes, type KeyedNode } from '../../utils/index';

export function elementChildren(node: VNode): KeyedNode[] {
    // h() children may hold strings, numbers and nested arrays, which Vue only normalizes on mount
    return slotNodes(Array.isArray(node.children) ? toVNodes(node.children) : []);
}

/**
 * New text nodes replace the edges: cached static nodes must not change in place.
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
