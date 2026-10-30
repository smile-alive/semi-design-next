<script lang="ts">
    import { Input } from '@fibrae/semi-ui-svelte';

    let value = $state('controlInput');
</script>

<Input aria-label="Controlled input" bind:value />
