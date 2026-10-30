<script lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-svelte';

    const values = ['A', 'B', 'C', 'D', 'E'];
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" style="width: 100%" value={['A', 'B']}>
    {#each values as value (value)}
        <Checkbox {value}>{value}</Checkbox>
    {/each}
</CheckboxGroup>
