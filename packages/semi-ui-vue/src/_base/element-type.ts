import { isVNode } from 'vue';

// Components mark themselves with an elementType option (Icon, Button, Tabs.TabPane) so a parent can recognize them
// among slot nodes without importing them.
export default function elementType(node: unknown) {
    return isVNode(node) ? (node.type as { elementType?: string }).elementType : undefined;
}
