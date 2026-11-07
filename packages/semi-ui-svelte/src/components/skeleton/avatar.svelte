<script lang="ts">
    import type { SkeletonAvatarProps } from './interface.js';
    import SkeletonItem from './skeleton-item.svelte';

    // A static subcomponent: it reads no global defaults
    let { type = 'avatar', ...rest }: SkeletonAvatarProps = $props();
</script>

<SkeletonItem {...rest} {type} />
