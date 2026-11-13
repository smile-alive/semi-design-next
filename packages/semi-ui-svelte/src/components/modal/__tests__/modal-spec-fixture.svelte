<script lang="ts">
    import type { ModalSpecProps } from '@test/specs/modal';
    import Modal from '../modal.svelte';

    let { store }: { store: ModalSpecProps } = $props();

    // The spec's `visible` is controlled: the binding reports user closes but never writes them back
    const visible = $derived(store.visible);
</script>

<Modal
    afterClose={store.afterClose}
    aria-describedby={store['aria-describedby']}
    aria-label={store['aria-label']}
    aria-labelledby={store['aria-labelledby']}
    bind:visible={() => visible, () => undefined}
    cancelText={store.cancelText}
    closable={store.closable}
    closeOnEsc={store.closeOnEsc}
    confirmLoading={store.confirmLoading}
    data-foo={store['data-foo']}
    keepDOM={store.keepDOM}
    lazyRender={store.lazyRender}
    mask={store.mask}
    maskClosable={store.maskClosable}
    motion={false}
    okText={store.okText}
    onCancel={store.onCancel}
    onOk={store.onOk}
    title={store.title}
>
    <p>{store.content}</p>
</Modal>

{#if store.stacked}
    <Modal bind:visible={() => store.stacked?.visible, () => undefined} closeOnEsc={store.stacked.closeOnEsc} motion={false} onCancel={store.stacked.onCancel} title={store.stacked.title} />
{/if}
