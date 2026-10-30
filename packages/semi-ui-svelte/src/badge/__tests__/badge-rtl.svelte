<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import Badge from '../badge.svelte';

    let { store }: { store: { direction: 'ltr' | 'rtl' } } = $props();
</script>

<ConfigProvider direction={store.direction}>
    <Badge count={5}>Semi</Badge>
</ConfigProvider>
