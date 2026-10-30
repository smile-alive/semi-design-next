<script lang="ts">
    import type { SpaceProps } from '../interface';
    import Space from '../space.svelte';

    let { store }: { store: { props: SpaceProps; count: number } } = $props();
</script>

<Space {...store.props}>
    {#each { length: store.count } as _, index (index)}
        <span>content</span>
    {/each}
</Space>
