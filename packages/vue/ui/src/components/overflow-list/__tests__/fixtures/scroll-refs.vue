<script setup lang="ts">
    import type { ComponentPublicInstance } from 'vue';
    import OverflowList from '../..';

    const emit = defineEmits<{ itemRef: [key: string, element: Element | ComponentPublicInstance | null] }>();
    const items = [{ key: 'alarm' }, { key: 'bookmark' }];
</script>

<template>
    <OverflowList :items="items" renderMode="scroll">
        <template #item="{ item }">
            <div :ref="(element) => emit('itemRef', item.key, element)">{{ item.key }}</div>
        </template>
    </OverflowList>
</template>
