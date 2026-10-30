<script lang="ts">
    import { Switch } from '@fibrae/semi-ui-svelte';

    let checked = $state(true);
</script>

<Switch aria-label="受控开关" bind:checked />
