import { Text, type VNode } from 'vue';
import type { NavItemType } from '@fibrae/semi-foundation/navigation/foundation';
import type { ItemKey } from '@fibrae/semi-foundation/navigation/item-foundation';
import elementType from '../_base/element-type';
import slotNodes from '../_base/slot-nodes';

/**
 * A Semi icon takes the size of its slot unless it sets its own; any other node is no Semi icon and gets no `size`
 * attribute. A class, when given, goes to every element (the sub list toggle rotates through it).
 */
export function iconAttrs(node: VNode, size: string, className?: string): Record<string, unknown> {
    if (node.type === Text) return {};
    // an own size key, even undefined, would replace the size the icon was given
    return { class: className, ...(elementType(node) === 'Icon' && node.props?.size == null ? { size } : {}) };
}

/** A template writes item-key as well as itemKey */
export function itemKeyOf(node: VNode): ItemKey | undefined {
    return node.props?.itemKey ?? node.props?.['item-key'];
}

/**
 * The itemKey tree of the nodes with an itemKey among the direct children (v-for, v-if and template are already
 * flattened), so a component that forwards itemKey to Nav.Item or Nav.Sub counts as well. It cannot be collected by
 * registration from the mounted items: a closed Sub does not mount its children, and the first render needs the tree
 * to open the ancestors of the selected item. Only a Nav.Sub's default slot is known to hold navigation items and to
 * take no slot props, so only that slot is called; any other slot would run user code here, outside its own render,
 * without the props it destructures. A component that wraps Nav.Sub is therefore one entry whose items stay unread.
 * Calling the slots here is also what makes a change inside a Sub reach the computed that holds the tree.
 */
export function readItemTree(nodes: VNode[]): NavItemType[] {
    return slotNodes(nodes).flatMap(([node]): NavItemType[] => {
        const itemKey = itemKeyOf(node);
        if (itemKey == null) return [];
        if (elementType(node) !== 'Nav.Sub') return [{ itemKey }];
        // a raw vnode slot is not normalized: an h() slot may return one node or nothing
        const children = node.children as { default?: () => VNode | VNode[] | null } | null;
        return [{ itemKey, items: readItemTree([children?.default?.() ?? []].flat()) }];
    });
}
