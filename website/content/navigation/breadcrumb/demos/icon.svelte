<script lang="ts">
    import { IconArticle, IconHome } from '@fibrae/semi-icons-svelte';
    import { Breadcrumb } from '@fibrae/semi-ui-svelte';
</script>

<Breadcrumb routes={['', 'Breadcrumb', 'With Icon']}>
    {#snippet icon(iconContext)}
        {#if iconContext.index === 0}
            <IconHome aria-label="Home" class={iconContext.class} size={iconContext.size} />
        {:else if iconContext.index === 1}
            <IconArticle class={iconContext.class} size={iconContext.size} />
        {/if}
    {/snippet}
</Breadcrumb>
