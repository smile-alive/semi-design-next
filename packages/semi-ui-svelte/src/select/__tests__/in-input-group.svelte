<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import Select from '../select.svelte';

    const optionList = [{ label: 'Abc', value: 'abc' }];
</script>

<InputGroup disabled size="large">
    <Select aria-label="inherit" {optionList} />
    <Select aria-label="own" disabled={false} {optionList} size="small" />
    <Select aria-label="inner" {optionList}>
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </Select>
</InputGroup>
