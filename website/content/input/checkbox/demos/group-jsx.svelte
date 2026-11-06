<script lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-svelte';
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" style="width: 100%" value={['A', 'B']}>
    <Checkbox value="A">A</Checkbox>
    <Checkbox value="B">B</Checkbox>
    <Checkbox value="C">C</Checkbox>
    <Checkbox value="D">D</Checkbox>
    <Checkbox value="E">E</Checkbox>
</CheckboxGroup>
