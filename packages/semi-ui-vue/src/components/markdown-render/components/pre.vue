<script setup lang="ts">
    import { type VNode, Text, normalizeClass } from 'vue';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/components/markdown-render/foundation';
    import SlotFragment from '../../../base/slot-fragment';
    import elementType from '../../../utils/element-type';
    import { childSlots, toVNodes } from '../../../utils/read-vnode';
    import slotNodes from '../../../utils/slot-nodes';

    defineOptions({ inheritAttrs: false });

    // CodeHighlight's div and pre may not sit inside a pre (phrasing only), so the wrapper of a highlighted block goes.
    // Only a code component marked 'MarkdownRender.Code' is detected: another replacement, or code a plugin split into
    // elements, keeps the pre.
    const isHighlightedBlock = (slot?: () => VNode[]) => {
        const nodes = slotNodes(slot?.() ?? []).filter(([node]) => node.type !== Text || String(node.children).trim() !== '');
        if (nodes.length !== 1) return false;
        const [node] = nodes[0];
        const isPlainText = () => slotNodes(toVNodes(childSlots(node).default?.())).every(([child]) => child.type === Text);
        return elementType(node) === 'MarkdownRender.Code' && Boolean(MarkdownRenderFoundation.getCodeLanguage(normalizeClass(node.props?.class))) && isPlainText();
    };
</script>

<template>
    <component :is="isHighlightedBlock($slots.default) ? SlotFragment : 'pre'" v-bind="$attrs">
        <slot />
    </component>
</template>
