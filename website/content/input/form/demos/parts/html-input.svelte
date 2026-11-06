<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';

    let { value, ...rest }: HTMLInputAttributes = $props();
</script>

<input {...rest} value={value ?? ''} />
