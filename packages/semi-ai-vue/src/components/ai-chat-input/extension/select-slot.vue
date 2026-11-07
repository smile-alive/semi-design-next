<script setup lang="ts">
    import { computed } from 'vue';
    import type { NodeViewProps } from '@tiptap/core';
    import { NodeViewWrapper } from '@tiptap/vue-3';
    import Select from '@fibrae/semi-ui-vue/select/index';

    const props = defineProps<NodeViewProps>();

    const value = computed(() => (props.node.attrs.value as string | null) ?? '');

    const options = computed(() =>
        (JSON.parse((props.node.attrs.options as string) || '[]') as string[]).map((option) => ({
            value: option,
            label: option,
        }))
    );

    const onChange = (next: unknown) => {
        if (typeof next === 'string') {
            props.updateAttributes({ value: next });
        }
    };
</script>

<template>
    <NodeViewWrapper as="span" class="node-selectSlot">
        <span class="select-slot-wrapper">
            <Select class="select-slot" :modelValue="value" :optionList="options" @update:modelValue="onChange" />
        </span>
    </NodeViewWrapper>
</template>
