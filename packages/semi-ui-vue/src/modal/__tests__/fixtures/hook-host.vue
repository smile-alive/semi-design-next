<script setup lang="ts">
    import { provide } from 'vue';
    import ConfigProvider from '../../../config-provider';
    import Modal from '../../index';
    import type { ModalHookApi } from '../../interface';
    import { reachableKey } from './reachable';

    const props = defineProps<{ onApi: (api: ModalHookApi) => void; reachable?: string; direction?: 'ltr' | 'rtl' }>();
    const [modal, Holder] = Modal.useModal();
    if (props.reachable !== undefined) provide(reachableKey, props.reachable);
    props.onApi(modal);
</script>

<template>
    <ConfigProvider :direction="props.direction">
        <div data-testid="holder"><Holder /></div>
    </ConfigProvider>
</template>
