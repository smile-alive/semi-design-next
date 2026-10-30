<script lang="ts">
    import Highlight from '../highlight.svelte';
    import type { HighlightProps } from '../interface';

    const { store }: { store: HighlightProps } = $props();
</script>

<Highlight {...store} />
