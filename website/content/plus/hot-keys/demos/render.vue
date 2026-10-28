<script setup lang="ts">
    import { ref } from 'vue';
    import { HotKeys, Modal, Tag } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
    const hotKeys = [HotKeys.Keys.Control, HotKeys.Keys.R];
</script>

<template>
    <div>
        <HotKeys :hotKeys="hotKeys" @hotKey="visible = true">
            <Tag>Press Ctrl+R to Open Modal</Tag>
        </HotKeys>
        <Modal v-model:visible="visible" title="Dialog" @ok="close"> This is the Modal opened by hotkey: {{ hotKeys.join('+') }}. </Modal>
    </div>
</template>
