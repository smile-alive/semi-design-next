<script setup lang="ts">
    import { ref } from 'vue';
    import Popover from '../../popover.vue';

    const visible = ref(false);
</script>

<template>
    <Popover v-model:visible="visible" aria-label="Details" :motion="false" trigger="custom" @escKeyDown="visible = false">
        <button type="button" @click="visible = !visible">trigger</button>
        <template #content>
            <button type="button">first</button>
            <button type="button">last</button>
        </template>
    </Popover>
</template>
