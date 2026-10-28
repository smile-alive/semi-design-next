<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { HotKeys, Input, Modal, type InputHandle } from '@fibrae/semi-ui-vue';

    const hotKeys = ['Control', 'q'];
    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
    const input = useTemplateRef<InputHandle>('input');
    const getListenerTarget = () => input.value?.input;
</script>

<template>
    <div>
        <Input ref="input" placeholder="test for target" />
        <HotKeys :getListenerTarget="getListenerTarget" :hotKeys="hotKeys" @hotKey="visible = true" />
        <Modal v-model:visible="visible" title="Dialog" @ok="close"> This is the Modal opened by hotkey: {{ hotKeys.join('+') }}. </Modal>
    </div>
</template>
