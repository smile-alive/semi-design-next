<script lang="ts">
    import type { Snippet } from 'svelte';
    import Feedback from '../feedback.svelte';
    import type { FeedbackProps } from '../interface';

    // The snippets are passed only when their flag is on, so absence stays observable
    let {
        store,
        onReady,
    }: {
        store: {
            props: FeedbackProps;
            children?: boolean;
            title?: boolean;
            closeIcon?: boolean;
            footer?: 'none' | 'custom';
            header?: boolean;
            icon?: boolean;
            modal?: boolean;
            content?: 'wrap' | 'only';
            radioParts?: boolean;
            checkboxParts?: boolean;
        };
        onReady?: (handle: { getRoot: () => HTMLDivElement | null } | null) => void;
    } = $props();

    let handle = $state.raw<{ getRoot: () => HTMLDivElement | null } | null>(null);

    $effect(() => onReady?.(handle));
</script>

{#snippet children()}<span>mine</span>{/snippet}
{#snippet title()}<em>slot title</em>{/snippet}
{#snippet closeIcon()}<i class="my-close"></i>{/snippet}
{#snippet footer()}<span>own footer</span>{/snippet}
{#snippet header()}<div id="own-header">own header</div>{/snippet}
{#snippet icon()}<i id="own-icon"></i>{/snippet}
{#snippet modal(parts: { modal: Snippet })}<div id="wrap">{@render parts.modal()}</div>{/snippet}
{#snippet wrap(parts: { content: Snippet })}<div data-testid="wrap">{@render parts.content()}</div>{/snippet}
{#snippet only()}<p>only mine</p>{/snippet}
{#snippet radioLabel(parts: { option: { label?: string | number }; index: number })}<b>{`L${parts.index}:${parts.option.label}`}</b>{/snippet}
{#snippet radioExtra(parts: { option: { extra?: string | number }; index: number })}<i>{`E${parts.index}:${parts.option.extra ?? '-'}`}</i>{/snippet}

<Feedback
    bind:this={handle}
    {...store.props}
    bind:visible={store.props.visible}
    checkboxExtra={store.checkboxParts ? radioExtra : undefined}
    checkboxLabel={store.checkboxParts ? radioLabel : undefined}
    children={store.children ? children : undefined}
    closeIcon={store.closeIcon ? closeIcon : undefined}
    content={store.content === 'wrap' ? wrap : store.content === 'only' ? only : undefined}
    footer={store.footer === 'none' ? null : store.footer === 'custom' ? footer : undefined}
    header={store.header ? header : undefined}
    icon={store.icon ? icon : undefined}
    modal={store.modal ? modal : undefined}
    radioExtra={store.radioParts ? radioExtra : undefined}
    radioLabel={store.radioParts ? radioLabel : undefined}
    title={store.title ? title : store.props.title}
/>
