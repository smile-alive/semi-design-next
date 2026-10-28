<script setup lang="ts">
    import { computed, shallowRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconAISearchLevel2, IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '@fibrae/semi-ui-vue/_base/element-props';
    import Collapsible from '@fibrae/semi-ui-vue/collapsible/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import MarkdownRender from '@fibrae/semi-ui-vue/markdown-render/index';
    import type { ReasoningWidgetProps, ReasoningWidgetSlots } from '../../interface';

    const props = defineProps<ReasoningWidgetProps & /* @vue-ignore */ ElementProps<'div', keyof ReasoningWidgetProps>>();
    defineSlots<ReasoningWidgetSlots>();

    const locale = useLocale('AIChatDialogue');

    // open while the model is still thinking; later status changes leave the reader's choice alone, as in React
    const isOpen = shallowRef(props.status !== 'completed');

    const prefixCls = cssClasses.PREFIX_REASONING;

    const text = computed(() => {
        const parts = props.summary?.length ? props.summary : (props.content ?? []);
        return parts.map((item) => item.text).join('\n');
    });
</script>

<template>
    <div :class="`${prefixCls}-wrapper`">
        <button :aria-expanded="isOpen" :class="`${prefixCls}-header`" type="button" @click="isOpen = !isOpen">
            <span :class="`${prefixCls}-header-prefix`"><IconAISearchLevel2 /></span>
            <span :class="`${prefixCls}-header-title`">
                {{ props.status === 'completed' ? locale.locale.reasoning.completed : locale.locale.reasoning.thinking }}
            </span>
            <span :class="`${prefixCls}-header-suffix`">
                <IconChevronUp v-if="isOpen" />
                <IconChevronDown v-else />
            </span>
        </button>
        <Collapsible :isOpen="isOpen">
            <div :class="`${prefixCls}-content`">
                <slot v-if="$slots.content" :content="props.content" :markdownRenderProps="props.markdownRenderProps" name="content" :status="props.status" :summary="props.summary" />
                <MarkdownRender v-else v-bind="{ format: 'md', ...props.markdownRenderProps, raw: text }" />
            </div>
        </Collapsible>
    </div>
</template>
