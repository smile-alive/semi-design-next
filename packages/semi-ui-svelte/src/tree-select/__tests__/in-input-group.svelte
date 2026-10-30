<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import TreeSelect from '../tree-select.svelte';

    const treeData = [{ label: 'Asia', value: 'asia', key: 'asia' }];
</script>

<InputGroup disabled size="large">
    <TreeSelect aria-label="inherit" {treeData} />
    <TreeSelect aria-label="own" disabled={false} size="small" {treeData} />
    <TreeSelect aria-label="inner" {treeData}>
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </TreeSelect>
</InputGroup>
