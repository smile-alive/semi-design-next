<script lang="ts">
    import type { SplitTagGroupProps, TagShape } from '../interface';
    import SplitTagGroup from '../split-tag-group.svelte';
    import Tag from '../tag.svelte';

    let { store }: { store: { props?: SplitTagGroupProps; count: number; shape?: TagShape; nested?: boolean } } = $props();
</script>

<SplitTagGroup {...store.props}>
    {#each { length: store.count } as _, index (index)}
        <Tag shape={store.shape}>
            {index + 1}
            {#if store.nested && index === 0}
                <Tag class="nested" shape={store.shape}>nested</Tag>
            {/if}
        </Tag>
    {/each}
</SplitTagGroup>
