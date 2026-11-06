<script lang="ts">
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import { ConfigProvider } from '@fibrae/semi-ui-svelte';
    import UseModalConfirm from './parts/use-modal-confirm.svelte';
</script>

<ConfigProvider locale={en_GB}>
    <UseModalConfirm />
</ConfigProvider>
