<script lang="ts">
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { NotificationHookApi } from '../interface';
    import HookHost from './hook-host.svelte';

    let { onApi }: { onApi: (api: NotificationHookApi) => void } = $props();
</script>

<ConfigProvider direction="rtl" locale={ja_JP}>
    <HookHost {onApi} />
</ConfigProvider>
