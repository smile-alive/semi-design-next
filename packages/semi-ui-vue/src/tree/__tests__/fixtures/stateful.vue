<script setup lang="ts">
    import { computed, ref, useSlots } from 'vue';
    import Tree, { type TreeValue } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ initialValue?: TreeValue; initialExpandedKeys?: string[] }>();
    const value = ref(props.initialValue);
    const expandedKeys = ref(props.initialExpandedKeys);
    const slots = useSlots();
    const forwarded = computed(() => Object.keys(slots));
    defineExpose({ value, expandedKeys });
</script>

<template>
    <Tree v-model="value" v-model:expandedKeys="expandedKeys" v-bind="$attrs">
        <template v-for="name in forwarded" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </Tree>
    <span data-testid="value">{{ JSON.stringify(value) }}</span>
</template>
