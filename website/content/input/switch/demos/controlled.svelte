<script lang="ts">
    import { Switch } from '@fibrae/semi-ui-svelte';

    let checked = $state(true);
</script>

<Switch aria-label="a switch for demo" bind:checked />
