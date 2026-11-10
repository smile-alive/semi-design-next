<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { NotificationHookApi } from '../interface';
    import HookHost from './hook-host.svelte';

    let { onApi }: { onApi: (api: NotificationHookApi) => void } = $props();
</script>

<ConfigProvider direction="rtl" locale={en_US}>
    <HookHost {onApi} />
</ConfigProvider>
