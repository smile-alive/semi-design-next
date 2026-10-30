<script lang="ts">
    import { Radio, RadioGroup, Space } from '@fibrae/semi-ui-svelte';

    const sizes = ['small', 'middle', 'large'] as const;
</script>

<Space align="start" spacing="loose" vertical>
    {#each sizes as size (size)}
        <RadioGroup aria-label="单选组合示例" buttonSize={size} name={`demo-radio-${size}`} type="button" value={1}>
            <Radio value={1}>即时推送</Radio>
            <Radio value={2}>定时推送</Radio>
            <Radio value={3}>动态推送</Radio>
        </RadioGroup>
    {/each}
</Space>
