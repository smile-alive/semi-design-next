<script lang="ts">
    import Banner from '../banner.svelte';
    import type { BannerProps } from '../interface';

    type Part = 'default' | 'custom' | 'none';

    // each snippet is passed only when asked for, so absence stays observable; `none` passes null
    let {
        store,
    }: {
        store: {
            props: BannerProps;
            titleSnippet?: boolean;
            description?: boolean;
            extra?: boolean;
            icon?: Part;
            closeIcon?: Part;
            neighbors?: boolean;
        };
    } = $props();
</script>

{#snippet titleText()}slotted{/snippet}
{#snippet descriptionText()}D{/snippet}
{#snippet extraText()}<span>extra</span>{/snippet}
{#snippet myIcon()}<span data-testid="my-icon"></span>{/snippet}
{#snippet myClose()}<span data-testid="my-close"></span>{/snippet}

{#if store.neighbors}<button type="button">before</button>{/if}
<Banner
    {...store.props}
    children={store.extra ? extraText : undefined}
    closeIcon={store.closeIcon === 'custom' ? myClose : store.closeIcon === 'none' ? null : undefined}
    description={store.description ? descriptionText : undefined}
    icon={store.icon === 'custom' ? myIcon : store.icon === 'none' ? null : undefined}
    title={store.titleSnippet ? titleText : store.props.title}
/>
{#if store.neighbors}<button type="button">after</button>{/if}
