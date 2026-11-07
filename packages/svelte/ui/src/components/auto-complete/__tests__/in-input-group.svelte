<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import AutoComplete from '../auto-complete.svelte';
</script>

<InputGroup disabled size="large">
    <AutoComplete aria-label="inherit" />
    <AutoComplete aria-label="own" disabled={false} size="small" />
    <AutoComplete aria-label="inner">
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </AutoComplete>
</InputGroup>
