<script lang="ts">
    import { Radio, RadioGroup } from '@fibrae/semi-ui-svelte';

    const extraText = 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用';
</script>

<RadioGroup aria-label="单选组合示例" direction="vertical" name="demo-radio-group-pureCard" type="pureCard" value={2}>
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
