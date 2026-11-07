<script setup lang="ts">
    import AutoComplete, { type AutoCompleteItems } from '../..';

    const props = defineProps<{ data: AutoCompleteItems[]; skip?: string }>();
    const text = (item: AutoCompleteItems) => (typeof item === 'object' ? String(item.email ?? item.label ?? item.value) : String(item));
    const source = (item: AutoCompleteItems) => (typeof item === 'object' ? String(props.data.indexOf(item)) : typeof item);
</script>

<template>
    <AutoComplete aria-label="mail" :data="props.data" defaultOpen :motion="false">
        <template #item="{ item, index }">
            <span v-if="text(item) !== props.skip" class="custom-item" :data-source="source(item)">{{ index }}:{{ text(item) }}</span>
        </template>
    </AutoComplete>
</template>
