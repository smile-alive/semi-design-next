<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { ToastHookApi } from '../interface';
    import HookHost from './hook-host.svelte';

    let { onApi }: { onApi: (api: ToastHookApi) => void } = $props();
</script>

<ConfigProvider direction="rtl" locale={en_US}>
    <HookHost {onApi} />
</ConfigProvider>
