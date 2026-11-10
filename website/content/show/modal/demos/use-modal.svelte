<script lang="ts">
    import { ConfigProvider } from '@fibrae/semi-ui-svelte';
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import UseModalConfirm from './parts/use-modal-confirm.svelte';
</script>

<ConfigProvider locale={en_US}>
    <UseModalConfirm />
</ConfigProvider>
