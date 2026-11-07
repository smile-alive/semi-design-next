<script setup lang="ts">
    import { ref } from 'vue';
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import Button from '../../../button';
    import ConfigProvider from '../../../config-provider';
    import Modal from '../../index';
    import type { ModalHookRef } from '../../interface';

    const props = withDefaults(defineProps<{ onOpen?: (handle: ModalHookRef) => void; destroySoon?: boolean }>(), {
        onOpen: undefined,
        destroySoon: false,
    });
    const [modal, Holder] = Modal.useModal();
    const closed = ref(false);
    const open = () => {
        const handle = modal.confirm({
            title: 'old title',
            content: 'old content',
            afterClose: () => (closed.value = true),
        });
        props.onOpen?.(handle);
        if (props.destroySoon) setTimeout(() => handle.destroy(), 0);
    };
</script>

<template>
    <ConfigProvider :locale="en_GB">
        <Button @click="open">Confirm Modal</Button>
        <output aria-label="closed">{{ `closed: ${closed}` }}</output>
        <Holder />
    </ConfigProvider>
</template>
