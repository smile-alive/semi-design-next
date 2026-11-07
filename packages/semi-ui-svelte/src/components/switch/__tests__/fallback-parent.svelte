<script lang="ts">
    import FallbackProbe from './fallback-probe.svelte';

    let value: boolean | undefined = $state(undefined);
</script>

<FallbackProbe bind:value />
