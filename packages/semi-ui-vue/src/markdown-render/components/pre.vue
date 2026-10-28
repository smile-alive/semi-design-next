<script setup lang="ts">
    import { type VNode, Text, normalizeClass } from 'vue';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import { childSlots, toVNodes } from '../../_base/read-vnode';
    import SlotFragment from '../../_base/slot-fragment';
    import slotNodes from '../../_base/slot-nodes';
    import Code from './code.vue';

    defineOptions({ inheritAttrs: false });

    // CodeHighlight's div and pre may not sit inside a pre (phrasing only), so the wrapper of a highlighted block goes.
    // Only the Semi code component is detected: a replacement, or code a plugin split into elements, keeps the pre.
    const isHighlightedBlock = (slot?: () => VNode[]) => {
        const nodes = slotNodes(slot?.() ?? []).filter(([node]) => node.type !== Text || String(node.children).trim() !== '');
        if (nodes.length !== 1) return false;
        const [node] = nodes[0];
        const isPlainText = () => slotNodes(toVNodes(childSlots(node).default?.())).every(([child]) => child.type === Text);
        return node.type === Code && Boolean(MarkdownRenderFoundation.getCodeLanguage(normalizeClass(node.props?.class))) && isPlainText();
    };
</script>

<template>
    <component :is="isHighlightedBlock($slots.default) ? SlotFragment : 'pre'" v-bind="$attrs">
        <slot />
    </component>
</template>
