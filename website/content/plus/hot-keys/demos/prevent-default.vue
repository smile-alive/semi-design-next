<script setup lang="ts">
    import { ref } from 'vue';
    import { HotKeys, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
    const metaKeys = [HotKeys.Keys.Meta, HotKeys.Keys.S];
    const controlKeys = [HotKeys.Keys.Control, HotKeys.Keys.S];
</script>

<template>
    <div>
        <HotKeys :hotKeys="metaKeys" preventDefault @hotKey="visible = true" />
        <br />
        <HotKeys :hotKeys="controlKeys" preventDefault @hotKey="visible = true" />
        <Modal v-model:visible="visible" title="Dialog" @ok="close"> This is the Modal opened by hotkey: Meta/Control + S. </Modal>
    </div>
</template>
