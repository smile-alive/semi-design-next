import { Text, type VNode } from 'vue';
import elementType from './element-type';
import slotNodes from './slot-nodes';

export type SlotKind = 'text' | 'icon' | 'node' | undefined;

// Input-like fields style a lone text, a lone icon and other content differently. Slots are not reactive, so callers
// read the kind during render.
export default function slotKind(slot?: () => VNode[]): SlotKind {
    const nodes = slotNodes(slot?.() ?? []);
    if (nodes.length === 0) return undefined;
    if (nodes.length > 1) return 'node';
    const [node] = nodes[0];
    if (node.type === Text) return 'text';
    return elementType(node) === 'Icon' ? 'icon' : 'node';
}
