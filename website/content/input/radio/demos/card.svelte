<script lang="ts">
    import { Radio, RadioGroup } from '@fibrae/semi-ui-svelte';

    const extraText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
</script>

<RadioGroup aria-label="单选组合示例" direction="vertical" name="demo-radio-group-card" type="card" value={2}>
    <Radio disabled style="width: 280px" value={1}>
        单选框标题
        {#snippet extra()}{extraText}{/snippet}
    </Radio>
    <Radio style="width: 280px" value={2}>
        单选框标题
        {#snippet extra()}{extraText}{/snippet}
    </Radio>
    <Radio style="width: 280px" value={3}>
        单选框标题
        {#snippet extra()}{extraText}{/snippet}
    </Radio>
</RadioGroup>
