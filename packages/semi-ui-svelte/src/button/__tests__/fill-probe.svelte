<script lang="ts">
    let { fill }: { fill?: string | string[] } = $props();
</script>

<span data-fill={JSON.stringify(fill ?? null)} data-testid="icon"></span>
