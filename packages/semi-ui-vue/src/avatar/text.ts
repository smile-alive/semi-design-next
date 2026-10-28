import { Text, type VNode } from 'vue';
import slotNodes, { isSlotContent } from '../_base/slot-nodes';

// Text beside a v-if text, or a render function returning ['A', 1], arrives as several Text nodes, so they are joined.
// Whitespace-only nodes between them stay, as React keeps them.
export default function getAvatarText(nodes: VNode[]) {
    const keyed = slotNodes(nodes);
    const content = keyed.map(([node]) => node);
    return keyed.some(isSlotContent) && content.every((node) => node.type === Text) ? content.map((node) => String(node.children)).join('') : undefined;
}
