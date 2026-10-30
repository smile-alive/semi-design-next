<script lang="ts">
    import type { TagProps } from '../interface';
    import Tag from '../tag.svelte';

    let { items }: { items: { label: string; props?: TagProps }[] } = $props();
</script>

{#each items as item (item.label)}
    <Tag {...item.props}>{item.label}</Tag>
{/each}
