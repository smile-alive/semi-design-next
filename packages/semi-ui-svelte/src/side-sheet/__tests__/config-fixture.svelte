<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { ConfigProviderProps } from '../../config-provider/interface';
    import SideSheet from '../side-sheet.svelte';

    let { props }: { props: ConfigProviderProps } = $props();
</script>

<ConfigProvider {...props}>
    <SideSheet motion={false} visible />
</ConfigProvider>
