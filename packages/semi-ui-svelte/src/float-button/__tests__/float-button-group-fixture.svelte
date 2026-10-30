<script lang="ts">
    import FloatButtonGroup from '../float-button-group.svelte';
    import type { FloatButtonGroupItemSnippetArgs, FloatButtonGroupProps } from '../interface';

    // the snippets are passed only when their flag is on, so absence and the default content stay observable
    let { store }: { store: { props: FloatButtonGroupProps; icon?: boolean; content?: boolean; badgeCount?: boolean } } = $props();
</script>

{#snippet icon({ item, index }: FloatButtonGroupItemSnippetArgs)}<i data-icon={`${index}:${item.value}`} data-testid={`icon-${item.value}`}></i>{/snippet}
{#snippet content({ item, index }: FloatButtonGroupItemSnippetArgs)}<b data-testid={`content-${index}`}>{`${item.value}!`}</b>{/snippet}
{#snippet badgeCount({ item, index }: FloatButtonGroupItemSnippetArgs)}<i data-testid="count">{`${index}:${item.value}`}</i>{/snippet}

<FloatButtonGroup {...store.props} badgeCount={store.badgeCount ? badgeCount : undefined} content={store.content ? content : undefined} icon={store.icon ? icon : undefined} />
