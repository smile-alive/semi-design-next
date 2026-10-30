<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Button, Toast, ToastFactory } from '@fibrae/semi-ui-svelte';

    const ToastInCustomContainer = ToastFactory.create({
        getPopupContainer: () => document.getElementById('custom-toast-container') as HTMLElement,
    });
    onDestroy(() => ToastInCustomContainer.destroyAll());
</script>

<div>
    <Button onclick={() => Toast.info('Toast')}>Default Toast</Button>
    <br />
    <br />
    <Button onclick={() => ToastInCustomContainer.info('Toast in some container')}>Toast in custom container</Button>
    <div id="custom-toast-container">custom container</div>
</div>
