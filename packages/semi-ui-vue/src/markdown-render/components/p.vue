<script setup lang="ts">
    import type { VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import { childSlots, toVNodes } from '../../_base/read-vnode';
    import { TypographyParagraph } from '../../typography';
    import A from './a.vue';
    import Img from './img.vue';

    // TypographyParagraph's props reach it as fallthrough attrs; typed behind `@vue-ignore` for call sites only
    defineProps</* @vue-ignore */ InstanceType<typeof TypographyParagraph>['$props']>();

    // The image component renders a div, invalid inside a p, so a paragraph holding one becomes a div. Known limit: only
    // the Semi img is detected. shortcut: only the Semi link is entered, since calling another component's default slot
    // without scope params throws for a scoped slot; upgrade when a component can declare its slot as unscoped.
    const containsImage = (nodes: VNode[]): boolean =>
        nodes.some((node) => {
            if (node.type === Img) return true;
            if (Array.isArray(node.children)) return containsImage(toVNodes(node.children));
            return node.type === A && containsImage(toVNodes(childSlots(node).default?.()));
        });

    const hasImage = (slot?: () => VNode[]) => containsImage(slot?.() ?? []);
</script>

<template>
    <TypographyParagraph :class="`${cssClasses.PREFIX}-component-p`" :component="hasImage($slots.default) ? 'div' : undefined">
        <slot />
    </TypographyParagraph>
</template>
