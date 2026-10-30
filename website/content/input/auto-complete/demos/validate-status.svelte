<script lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-svelte';

    let warning = $state('ies');
    let error = $state('ies');
    let normal = $state('ies');
</script>

<AutoComplete aria-label="Warning status" bind:value={warning} validateStatus="warning" />
<br />
<br />
<AutoComplete aria-label="Error status" bind:value={error} validateStatus="error" />
<br />
<br />
<AutoComplete aria-label="Default status" bind:value={normal} />
