<script lang="ts">
    import { Radio, RadioGroup, type RadioChangeEvent, type RadioValue } from '@fibrae/semi-ui-svelte';

    let value = $state<RadioValue | undefined>(1);
    const onChange = (e: RadioChangeEvent) => console.log('radio checked', e.target.value);
</script>

<RadioGroup aria-label="单选组合示例" bind:value name="demo-radio-group" {onChange}>
    <Radio value={1}>A</Radio>
    <Radio value={2}>B</Radio>
    <Radio value={3}>C</Radio>
    <Radio value={4}>D</Radio>
</RadioGroup>
