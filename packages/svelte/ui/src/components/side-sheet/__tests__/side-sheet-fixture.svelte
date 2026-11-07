<script lang="ts">
    import { IconEyeClosed } from '@fibrae/semi-icons-svelte';
    import Button from '../../button/button.svelte';
    import type { SideSheetProps } from '../interface';
    import SideSheet from '../side-sheet.svelte';

    // The snippets are passed only when their flag is on, so absence stays observable
    let {
        store,
    }: {
        store: { props: SideSheetProps; title?: boolean; footer?: boolean; closeIcon?: boolean; content?: 'plain' | 'autofocus'; afterVisible?: boolean[] };
    } = $props();
</script>

{#snippet title()}<strong>SlotTitle</strong>{/snippet}
{#snippet footer()}<span>F</span>{/snippet}
{#snippet closeIcon()}<IconEyeClosed />{/snippet}

<SideSheet {...store.props} afterVisibleChange={(value) => store.afterVisible?.push(value)} closeIcon={store.closeIcon ? closeIcon : undefined} footer={store.footer ? footer : undefined} title={store.title ? title : store.props.title}>
    {#if store.content === 'autofocus'}
        <Button>first</Button>
        <input aria-label="name" autofocus />
    {:else}
        <p>This is content of basic sideSheet</p>
    {/if}
</SideSheet>
