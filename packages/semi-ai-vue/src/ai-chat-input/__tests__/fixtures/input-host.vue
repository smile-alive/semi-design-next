<script setup lang="ts">
    import { onMounted, useSlots, useTemplateRef } from 'vue';
    import AIChatInput, { type AIChatInputHandle, type AIChatInputSlots } from '../../index';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ onReady: (handle: AIChatInputHandle) => void }>();
    const slotNames = Object.keys(useSlots()) as (keyof AIChatInputSlots)[];
    const input = useTemplateRef('input');
    onMounted(() => props.onReady(input.value as AIChatInputHandle));
</script>

<template>
    <AIChatInput ref="input" v-bind="$attrs">
        <template v-for="name in slotNames" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </AIChatInput>
</template>
