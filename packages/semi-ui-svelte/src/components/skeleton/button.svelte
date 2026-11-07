<script lang="ts">
    import type { SkeletonBasicProps } from './interface.js';
    import SkeletonItem from './skeleton-item.svelte';

    // A static subcomponent: it reads no global defaults
    let { type = 'button', ...rest }: SkeletonBasicProps = $props();
</script>

<SkeletonItem {...rest} {type} />
