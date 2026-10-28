<script setup lang="ts">
    import { ref } from 'vue';
    import { HotKeys, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
    const hotKeys = [HotKeys.Keys.Control, 'Shift', HotKeys.Keys.A];
</script>

<template>
    <div>
        <HotKeys :hotKeys="hotKeys" @hotKey="visible = true" />
        <Modal v-model:visible="visible" title="Dialog" @ok="close"> This is the Modal opened by hotkey: {{ hotKeys.join('+') }}. </Modal>
    </div>
</template>
