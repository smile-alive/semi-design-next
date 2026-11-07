<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import Cascader from '../cascader.svelte';

    const treeData = [{ label: 'Asia', value: 'asia' }];
</script>

<InputGroup disabled size="large">
    <Cascader aria-label="inherit" {treeData} />
    <Cascader aria-label="own" disabled={false} size="small" {treeData} />
    <Cascader aria-label="inner" {treeData}>
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </Cascader>
</InputGroup>
