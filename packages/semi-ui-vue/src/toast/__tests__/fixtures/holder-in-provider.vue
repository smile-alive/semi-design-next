<script setup lang="ts">
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import ConfigProvider from '../../../config-provider';
    import Toast from '../../index';
    import type { ToastHookApi } from '../../interface';

    const props = defineProps<{ onApi: (api: ToastHookApi) => void }>();
    const [toast, Holder] = Toast.useToast();
    props.onApi(toast);
</script>

<template>
    <ConfigProvider direction="rtl" :locale="ja_JP">
        <div data-testid="holder"><Holder /></div>
    </ConfigProvider>
</template>
