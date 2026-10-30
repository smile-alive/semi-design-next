<script lang="ts">
    import FloatButton from '../float-button.svelte';
    import type { FloatButtonProps } from '../interface';

    // the snippets are passed only when their flag is on, so absence stays observable
    let { store }: { store: { props?: FloatButtonProps; icon?: boolean; badgeCount?: boolean } } = $props();
</script>

{#snippet icon()}<i data-testid="icon"></i>{/snippet}
{#snippet badgeCount()}<b data-testid="count">new</b>{/snippet}

<FloatButton {...store.props} badgeCount={store.badgeCount ? badgeCount : undefined} icon={store.icon ? icon : undefined} />
