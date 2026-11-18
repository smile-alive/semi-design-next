<script lang="ts">
    import useBreakpoint from '../use-breakpoint.svelte';

    const breakpoint = useBreakpoint();
    const matched = $derived(
        Object.entries(breakpoint.screens)
            .filter(([, matches]) => matches)
            .map(([name]) => name)
            .join(',') || 'none'
    );
</script>

<p>{matched}</p>
