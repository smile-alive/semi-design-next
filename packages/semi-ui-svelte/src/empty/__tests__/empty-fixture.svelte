<script lang="ts">
    import Empty from '../empty.svelte';
    import type { EmptyProps } from '../interface';

    // each snippet is passed only when its flag is on, so absence stays observable
    let {
        store,
    }: {
        store: {
            props: EmptyProps;
            titleSnippet?: boolean;
            description?: boolean;
            footer?: boolean;
            image?: boolean;
            darkImage?: boolean;
        };
    } = $props();
</script>

{#snippet titleText()}<b>rich</b>{/snippet}
{#snippet descriptionText()}semi design{/snippet}
{#snippet footerText()}<button type="button">action</button>{/snippet}
{#snippet imageNode()}<i data-testid="light"></i>{/snippet}
{#snippet darkImageNode()}<i data-testid="dark"></i>{/snippet}

<Empty
    {...store.props}
    children={store.footer ? footerText : undefined}
    darkModeImage={store.darkImage ? darkImageNode : store.props.darkModeImage}
    description={store.description ? descriptionText : undefined}
    image={store.image ? imageNode : store.props.image}
    title={store.titleSnippet ? titleText : store.props.title}
/>
