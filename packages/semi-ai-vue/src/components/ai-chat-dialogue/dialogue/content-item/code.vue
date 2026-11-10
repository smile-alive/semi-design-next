<script setup lang="ts">
    import { Text, type VNode, normalizeClass } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/components/markdown-render/foundation';
    import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-vue';
    import { useCopied, useLocale } from '@fibrae/semi-ui-vue/composables';
    import { code as MarkdownCode } from '@fibrae/semi-ui-vue/markdown-render/components/index';
    import { codeText } from '@fibrae/semi-ui-vue/markdown-render/index';
    import { slotNodes } from '@fibrae/semi-ui-vue/utils';

    // markdown attributes belong to the wrapped code element, which reads the language from class; the mark lets the
    // markdown pre drop its wrapper, which may not hold the div
    defineOptions({ inheritAttrs: false, elementType: 'MarkdownRender.Code' });
    const slots = defineSlots<{ default?: () => VNode[] }>();

    const locale = useLocale('AIChatDialogue');

    const [copied, copy] = useCopied(() => 2000);

    const { PREFIX_CODE } = cssClasses;

    const language = (cls: unknown) => MarkdownRenderFoundation.getCodeLanguage(normalizeClass(cls));

    // a highlighter plugin can turn the code into elements, which MarkdownCode then leaves unhighlighted
    const isPlainText = () => slotNodes(slots.default?.() ?? []).every(([node]) => node.type === Text);

    const onCopy = () => void copy(codeText(slots.default?.() ?? []));
</script>

<template>
    <div v-if="language($attrs.class) && isPlainText()" :class="PREFIX_CODE">
        <div :class="`${PREFIX_CODE}-topSlot`">
            <span :class="`${PREFIX_CODE}-topSlot-type`">{{ language($attrs.class) }}</span>
            <span :class="`${PREFIX_CODE}-topSlot-copy`">
                <!-- one element for both states, so focus survives the swap -->
                <button :aria-label="copied ? locale.locale.copySuccess : locale.locale.copy" :class="`${PREFIX_CODE}-topSlot-copy-wrapper`" type="button" @click="copied ? undefined : onCopy()">
                    <IconTick v-if="copied" />
                    <IconCopyStroked v-else />
                </button>
            </span>
        </div>
        <MarkdownCode v-bind="$attrs">
            <slot />
        </MarkdownCode>
    </div>
    <MarkdownCode v-else v-bind="$attrs">
        <slot />
    </MarkdownCode>
</template>
