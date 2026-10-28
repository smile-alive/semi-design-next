<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, DragMove, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
</script>

<template>
    <div>
        <Button @click="visible = true">Open Modal</Button>
        <Modal v-model:visible="visible" centered title="可拖拽Modal">
            <template #modal="{ modal }">
                <DragMove positionStrategy="relative">
                    <component :is="modal" />
                </DragMove>
            </template>
            <p>This is the content of a basic sidesheet.</p>
            <p>Here is more content...</p>
        </Modal>
    </div>
</template>
