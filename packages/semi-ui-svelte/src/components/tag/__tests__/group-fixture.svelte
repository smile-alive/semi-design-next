<script lang="ts">
    import TagGroup from '../group.svelte';
    import type { TagGroupItem, TagGroupProps } from '../interface';

    let { store }: { store: { props: TagGroupProps; custom?: boolean } } = $props();
</script>

{#snippet custom({ tag, index }: { tag: TagGroupItem; index: number })}<strong>{index}:{tag.children}</strong>{/snippet}

<TagGroup {...store.props} tag={store.custom ? custom : undefined} />
