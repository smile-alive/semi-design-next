<script setup lang="ts">
    import { ref } from 'vue';
    import type { ModalProps } from '../../interface';
    import Modal from '../../modal.vue';

    const props = withDefaults(defineProps<{ onCancel?: ModalProps['onCancel']; onOk?: ModalProps['onOk'] }>(), {
        onCancel: undefined,
        onOk: undefined,
    });
    const visible = ref(true);
    const closed = ref(0);
</script>

<template>
    <Modal v-model:visible="visible" :motion="false" :onCancel="props.onCancel" :onOk="props.onOk" title="Model" @afterClose="closed++"> body </Modal>
    <output aria-label="visible">{{ visible }}</output>
    <output aria-label="closed">{{ closed }}</output>
</template>
