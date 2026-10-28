<script setup lang="ts">
    import { Text, normalizeClass, useAttrs, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import slotNodes from '../../_base/slot-nodes';
    import CodeHighlight from '../../code-highlight';
    import codeText from '../code-text';

    // only the class (the fence language) carries meaning
    defineOptions({ inheritAttrs: false });
    const slots = defineSlots<{ default?(): VNode[] }>();
    const attrs = useAttrs();

    // the class is an array when an MDX author writes class and className together
    const language = () => MarkdownRenderFoundation.getCodeLanguage(normalizeClass(attrs.class));

    const nodes = () => slotNodes(slots.default?.() ?? []);

    // a rehype plugin may split the text into elements, which have no source text to highlight
    const isPlainText = () => nodes().every(([node]) => node.type === Text);
</script>

<template>
    <CodeHighlight v-if="language() && isPlainText()" :code="codeText(slots.default?.() ?? [])" :language="language() ?? ''" lineNumber />
    <code v-else-if="language()" :class="attrs.class">
        <slot />
    </code>
    <code v-else :class="`${cssClasses.PREFIX}-simple-code`">
        <slot />
    </code>
</template>
