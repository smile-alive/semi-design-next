<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { ConfigProviderProps } from '../../config-provider/interface';
    import Feedback from '../feedback.svelte';

    let { props }: { props: ConfigProviderProps } = $props();
</script>

<ConfigProvider {...props}>
    <Feedback title="T" type="text" visible />
</ConfigProvider>
