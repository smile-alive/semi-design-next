<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import type { PopoverHandle } from '../../interface';
    import Popover from '../../popover.vue';

    const visible = ref(false);
    const popover = useTemplateRef<PopoverHandle>('popover');
</script>

<template>
    <Popover ref="popover" v-model:visible="visible" aria-label="Details" :motion="false" trigger="click">
        <button type="button">trigger</button>
        <template #content="{ initialFocusRef }">
            <button type="button">first</button>
            <input :ref="initialFocusRef" aria-label="initial" />
            <button type="button">last</button>
        </template>
    </Popover>
    <button type="button" @click="popover?.focusTrigger()">focus</button>
    <output aria-label="visible">{{ visible }}</output>
</template>
