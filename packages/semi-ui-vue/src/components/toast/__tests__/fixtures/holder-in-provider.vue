<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import { en_US } from '@fibrae/semi-ui-vue/locale';
    import Toast from '../../index';
    import type { ToastHookApi } from '../../interface';

    const props = defineProps<{ onApi: (api: ToastHookApi) => void }>();
    const [toast, Holder] = Toast.useToast();
    props.onApi(toast);
</script>

<template>
    <ConfigProvider direction="rtl" :locale="en_US">
        <div data-testid="holder"><Holder /></div>
    </ConfigProvider>
</template>
