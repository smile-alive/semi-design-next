<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { ConfigProviderProps } from '../../config-provider/interface';
    import Modal from '../modal.svelte';

    let { props }: { props: ConfigProviderProps } = $props();
</script>

<ConfigProvider {...props}>
    <Modal motion={false} title="Dialog" visible />
</ConfigProvider>
