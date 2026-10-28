<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import Modal from '../../../modal';

    const stage = useTemplateRef<HTMLDivElement>('stage');
    const visible = ref(false);
</script>

<template>
    <div ref="stage" data-testid="stage" style="background: white">
        <button type="button" @click="void stage?.requestFullscreen()">fullscreen</button>
        <button type="button" @click="visible = true">open</button>
        <Modal v-model:visible="visible" :motion="false" title="dialog">
            <input aria-label="name" />
        </Modal>
    </div>
</template>
