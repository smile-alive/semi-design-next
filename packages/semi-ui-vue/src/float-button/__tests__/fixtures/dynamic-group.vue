<script setup lang="ts">
    import { ref } from 'vue';
    import FloatButtonGroup from '../../float-button-group.vue';
    import type { FloatButtonGroupItem } from '../../interface';

    const items = ref<FloatButtonGroupItem[]>([{ content: 'Editor', value: 'editor' }]);
    const add = () => items.value.push({ content: 'Search', value: 'search' });
    const disableFirst = () => {
        items.value[0].disabled = true;
    };
    const removeFirst = () => items.value.shift();
</script>

<template>
    <button type="button" @click="add">add</button>
    <button type="button" @click="disableFirst">disable</button>
    <button type="button" @click="removeFirst">remove</button>
    <FloatButtonGroup :items="items">
        <template #icon="{ item, index }">
            <i :data-icon="`${index}:${item.value}`" />
        </template>
    </FloatButtonGroup>
</template>
