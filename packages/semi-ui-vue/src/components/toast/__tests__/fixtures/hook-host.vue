<script setup lang="ts">
    import { provide } from 'vue';
    import Toast from '../../index';
    import type { ToastHookApi } from '../../interface';
    import { reachableKey } from './reachable';

    const props = defineProps<{ onApi: (api: ToastHookApi) => void; reachable?: string }>();
    const [toast, Holder] = Toast.useToast();
    if (props.reachable !== undefined) provide(reachableKey, props.reachable);
    props.onApi(toast);
</script>

<template>
    <div data-testid="holder"><Holder /></div>
</template>
