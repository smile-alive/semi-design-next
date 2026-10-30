<script lang="ts">
    import { Radio, RadioGroup } from '@fibrae/semi-ui-svelte';

    const extraText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
    const items = [
        { value: 1, disabled: true },
        { value: 2, disabled: false },
        { value: 3, disabled: false },
    ];
</script>

<RadioGroup aria-label="单选组合示例" direction="vertical" name="demo-radio-group-card" type="card" value={2}>
    {#each items as item (item.value)}
        <Radio disabled={item.disabled} style="width: 280px" value={item.value}>
            单选框标题
            {#snippet extra()}{extraText}{/snippet}
        </Radio>
    {/each}
</RadioGroup>
