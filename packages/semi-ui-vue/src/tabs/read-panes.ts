import { Text, type VNode } from 'vue';
import elementType from '../_base/element-type';
import { childSlots, normalizeVNodeProps, toVNodes as toNodes } from '../_base/read-vnode';
import slotNodes from '../_base/slot-nodes';
import type { OverflowItem, PlainTab } from './interface';

/** A tab as the bar renders it: its data plus the slots holding the markup of its tab and icon */
export interface TabEntry extends PlainTab {
    tabSlot?: () => VNode[];
    iconSlot?: () => VNode[];
}

/** A tab of the collapsed bar */
export type BarItem = TabEntry & OverflowItem;

export const isTabPane = (node: VNode) => elementType(node) === 'Tabs.TabPane';

const booleanProps = new Set(['disabled', 'closable']);

function paneProps(node: VNode): PlainTab {
    const raw = normalizeVNodeProps(node.props, booleanProps);
    return { itemKey: raw.itemKey as string, disabled: raw.disabled === true, closable: raw.closable === true };
}

export const paneKey = (node: VNode) => paneProps(node).itemKey;

/**
 * The TabPanes among the direct children of the default slot; other children are content, not tabs. Call it during
 * render or from a computed so the result tracks what the slot reads.
 */
export function readPanes(nodes: VNode[]): TabEntry[] {
    return slotNodes(nodes).flatMap(([node]): TabEntry[] => {
        if (!isTabPane(node)) return [];
        const { tab, icon } = childSlots(node);
        const tabSlot = tab && (() => toNodes(tab()));
        const iconSlot = icon && (() => toNodes(icon()));
        // plain text also reaches a custom tab bar as the entry's `tab`
        const content = tabSlot ? slotNodes(tabSlot()).map(([child]) => child) : [];
        const text = content.length && content.every((child) => child.type === Text) ? content.map((child) => String(child.children)).join('') : undefined;
        return [{ ...paneProps(node), tab: text, tabSlot, iconSlot }];
    });
}
