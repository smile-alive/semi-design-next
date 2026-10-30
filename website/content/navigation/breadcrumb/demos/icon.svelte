<script lang="ts">
    import { IconArticle, IconHome } from '@fibrae/semi-icons-svelte';
    import { Breadcrumb } from '@fibrae/semi-ui-svelte';
</script>

<Breadcrumb routes={['', 'Breadcrumb', 'With Icon']}>
    {#snippet icon({ class: className, index, size })}
        {#if index === 0}
            <IconHome aria-label="Home" class={className} {size} />
        {:else if index === 1}
            <IconArticle class={className} {size} />
        {/if}
    {/snippet}
</Breadcrumb>
