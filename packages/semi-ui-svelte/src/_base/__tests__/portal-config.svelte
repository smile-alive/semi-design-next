<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import Portal from '../portal.svelte';

    let { container }: { container: HTMLElement } = $props();
</script>

<ConfigProvider direction="rtl" getPopupContainer={() => container}>
    <Portal>
        <p>config</p>
    </Portal>
</ConfigProvider>
<div class="host">
    <Portal getPopupContainer={() => document.querySelector<HTMLElement>('.host')}>
        <p>sibling</p>
    </Portal>
</div>
