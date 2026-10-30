<script lang="ts">
    import Tooltip from '../../tooltip/tooltip.svelte';
    import AvatarGroup from '../avatar-group.svelte';
    import Avatar from '../avatar.svelte';

    let { kind }: { kind: 'content' | 'more' } = $props();
</script>

{#snippet inside()}<Avatar data-testid="inside">I</Avatar>{/snippet}
{#snippet more()}
    <Tooltip motion={false} trigger="custom" visible>
        {#snippet content()}<Avatar data-testid="inside">I</Avatar>{/snippet}
        <Avatar>+</Avatar>
    </Tooltip>
{/snippet}
{#snippet tip()}
    <Tooltip content={inside} motion={false} trigger="custom" visible><span>T</span></Tooltip>
{/snippet}

{#if kind === 'content'}
    <AvatarGroup item={tip} items={[{}]} shape="square" size="small" />
{:else}
    <AvatarGroup items={[{ alt: 'A' }, { alt: 'B' }]} maxCount={1} {more} />
{/if}
