<script lang="ts">
    import type { Snippet } from 'svelte';
    import { IconEyeClosed } from '@fibrae/semi-icons-svelte';
    import Button from '../../button/button.svelte';
    import type { ModalProps } from '../interface';
    import Modal from '../modal.svelte';

    // The snippets are passed only when their flag is on, so absence stays observable
    let {
        store,
    }: {
        store: {
            props: ModalProps;
            title?: boolean;
            footer?: 'none' | 'custom';
            header?: 'none' | 'custom';
            icon?: boolean;
            closeIcon?: boolean;
            modal?: boolean;
            content?: 'plain' | 'autofocus';
        };
    } = $props();
</script>

{#snippet title()}<strong>SlotTitle</strong>{/snippet}
{#snippet footer()}<span>OwnFooter</span>{/snippet}
{#snippet header()}<span>OwnHeader</span>{/snippet}
{#snippet icon()}<IconEyeClosed />{/snippet}
{#snippet closeIcon()}<span class="my-close"></span>{/snippet}
{#snippet modal(parts: { modal: Snippet })}<div class="wrapped">{@render parts.modal()}</div>{/snippet}

<Modal
    {...store.props}
    bind:visible={store.props.visible}
    closeIcon={store.closeIcon ? closeIcon : undefined}
    footer={store.footer === 'none' ? null : store.footer === 'custom' ? footer : undefined}
    header={store.header === 'none' ? null : store.header === 'custom' ? header : undefined}
    icon={store.icon ? icon : undefined}
    modal={store.modal ? modal : undefined}
    title={store.title ? title : store.props.title}
>
    {#if store.content === 'autofocus'}
        <Button>first</Button>
        <input aria-label="name" autofocus />
    {:else}
        <p>This is content of basic modal</p>
    {/if}
</Modal>
