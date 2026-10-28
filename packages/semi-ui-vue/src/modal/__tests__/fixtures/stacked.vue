<script setup lang="ts">
    import { ref } from 'vue';
    import type { ModalProps } from '../../interface';
    import Modal from '../../modal.vue';

    const props = defineProps<{ onOuterCancel: ModalProps['onCancel']; onInnerCancel: ModalProps['onCancel'] }>();
    const outer = ref(true);
    const inner = ref(true);
</script>

<template>
    <Modal v-model:visible="outer" :motion="false" :onCancel="props.onOuterCancel" title="Outer">outer</Modal>
    <Modal v-model:visible="inner" :motion="false" :onCancel="props.onInnerCancel" title="Inner">inner</Modal>
</template>
