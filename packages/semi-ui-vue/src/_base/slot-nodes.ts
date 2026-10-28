import { type VNode, Comment, Fragment, Text } from 'vue';

export type KeyedNode = [node: VNode, key: string];

// An own key is kept, otherwise the position counts the v-if Comment placeholder too, so toggling a sibling does not
// shift later keys and remount stateful children when the nodes are wrapped in a v-for; each Fragment prefixes its
// children so sibling v-for keys cannot collide.
export default function slotNodes(nodes: VNode[], prefix = ''): KeyedNode[] {
    return nodes.flatMap((node, index): KeyedNode[] => {
        const key = `${prefix}${node.key == null ? `.${index}` : `$${String(node.key)}`}`;
        if (node.type === Comment) return [];
        return node.type === Fragment ? slotNodes(node.children as VNode[], `${key}:`) : [[node, key]];
    });
}

// An empty text node (`{{ undefined }}`), a v-if comment or whitespace is not content. Template whitespace next to an
// interpolation condenses to a space, so `{{ text }}` on its own line after `<template #icon>` yields ' ' for an empty
// text, where JSX would have no children.
export function isSlotContent([node]: KeyedNode) {
    return node.type !== Text || String(node.children).trim() !== '';
}

export function hasSlotContent(slot?: () => VNode[]) {
    return slot ? slotNodes(slot()).some(isSlotContent) : false;
}
