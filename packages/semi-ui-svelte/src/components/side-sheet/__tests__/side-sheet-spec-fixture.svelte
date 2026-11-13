<script lang="ts">
    import type { SideSheetSpecProps } from '@test/specs/side-sheet';
    import SideSheet from '../side-sheet.svelte';

    let { store }: { store: SideSheetSpecProps } = $props();

    // The spec's `visible` is controlled: the binding reports user closes but never writes them back
    const visible = $derived(store.visible);
</script>

<SideSheet
    afterVisibleChange={store.afterVisibleChange}
    aria-describedby={store['aria-describedby']}
    aria-label={store['aria-label']}
    aria-labelledby={store['aria-labelledby']}
    bind:visible={() => visible, () => undefined}
    closable={store.closable}
    closeOnEsc={store.closeOnEsc}
    data-foo={store['data-foo']}
    keepDOM={store.keepDOM}
    mask={store.mask}
    maskClosable={store.maskClosable}
    motion={false}
    onCancel={store.onCancel}
    title={store.title}
>
    <p>{store.content}</p>
    <button type="button">Inner</button>
</SideSheet>

{#if store.stacked}
    <SideSheet bind:visible={() => store.stacked?.visible, () => undefined} closeOnEsc={store.stacked.closeOnEsc} motion={false} onCancel={store.stacked.onCancel} title={store.stacked.title} />
{/if}
