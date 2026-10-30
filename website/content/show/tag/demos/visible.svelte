<script lang="ts">
    import { Radio, RadioGroup, Tag, type RadioValue } from '@fibrae/semi-ui-svelte';

    let value = $state<RadioValue | undefined>(0);
</script>

<div>
    <RadioGroup aria-label="标签可见性" bind:value name="demo-tag-visible" type="button">
        <Radio value={1}>Show</Radio>
        <Radio value={0}>Hide</Radio>
    </RadioGroup>
    <div style="margin-top: 10px">
        <Tag color="light-blue" size="large" visible={value === 1}>Invisible tag</Tag>
    </div>
</div>
