<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import type { ElementProps } from '@fibrae/semi-ui-vue/_base/element-props';
    import CodeHighlight from '@fibrae/semi-ui-vue/code-highlight/index';
    import JsonViewer from '@fibrae/semi-ui-vue/json-viewer/index';
    import type { CodeItemProps, CodeItemSlots } from './interface';

    const props = withDefaults(defineProps<CodeItemProps & /* @vue-ignore */ ElementProps<'div', keyof CodeItemProps>>(), {
        name: undefined,
        language: undefined,
        content: undefined,
        isJson: false,
        jsonViewerProps: undefined,
        codeHighlightProps: undefined,
    });

    defineSlots<CodeItemSlots>();

    const prefix = cssClasses.SIDEBAR;

    const jsonViewerAttrs = computed(() => ({
        height: '100%',
        modelValue: props.content,
        options: strings.JSON_VIEWER_OPTIONS,
        showSearch: false,
        width: '100%',
        ...props.jsonViewerProps,
    }));

    const codeHighlightAttrs = computed(() => ({
        code: props.content,
        language: props.language ?? '',
        ...props.codeHighlightProps,
    }));
</script>

<template>
    <div :class="`${prefix}-code-content`">
        <JsonViewer v-if="props.isJson" v-bind="jsonViewerAttrs">
            <template v-if="$slots.customRender" #customRender="slotProps">
                <slot name="customRender" v-bind="slotProps" />
            </template>
            <template v-if="$slots.searchButton" #searchButton="slotProps">
                <slot name="searchButton" v-bind="slotProps" />
            </template>
        </JsonViewer>
        <CodeHighlight v-else v-bind="codeHighlightAttrs" />
    </div>
</template>
