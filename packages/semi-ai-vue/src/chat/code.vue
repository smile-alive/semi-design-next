<script setup lang="ts">
    import { type VNode, normalizeClass, useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-vue';
    import { useCopied, useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { code as MarkdownCode } from '@fibrae/semi-ui-vue/markdown-render/components/index';
    import { codeText } from '@fibrae/semi-ui-vue/markdown-render/index';

    // markdown attributes belong to the wrapped code element, which reads the language from class
    defineOptions({ inheritAttrs: false });
    const slots = defineSlots<{ default?(): VNode[] }>();
    const attrs = useAttrs();

    const i18n = useLocale('Chat');

    const [copied, copy] = useCopied(() => 2000);

    const { PREFIX_CHAT_BOX } = cssClasses;
    const bar = `${PREFIX_CHAT_BOX}-content-code-topSlot`;

    const language = () => MarkdownRenderFoundation.getCodeLanguage(normalizeClass(attrs.class));

    const onCopy = () => {
        if (!copied.value) {
            void copy(codeText(slots.default?.() ?? []));
        }
    };
</script>

<template>
    <div v-if="language()" :class="[`${PREFIX_CHAT_BOX}-content-code`, `${BASE_CLASS_PREFIX}-always-dark`]">
        <div :class="bar">
            <span :class="`${bar}-type`">{{ language() }}</span>
            <span :class="`${bar}-copy`">
                <!-- one element for both states, so focus survives the swap -->
                <button :class="[`${bar}-copy-wrapper`, { [`${bar}-toCopy`]: !copied }]" type="button" @click="onCopy">
                    <IconTick v-if="copied" />
                    <IconCopyStroked v-else />
                    {{ copied ? i18n.locale.copied : i18n.locale.copy }}
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
