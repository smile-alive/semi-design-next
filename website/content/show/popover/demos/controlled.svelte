<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-svelte/illustrations';
    import { Empty, Popover, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

    let value = $state<RadioValue | undefined>(false);
</script>

{#snippet content()}
    <Empty style="width: 400px; margin: 0 auto; display: flex; padding: 20px" title="先进的设计 / 研发协作方式">
        {#snippet image()}
            <IllustrationSuccess style="width: 150px; height: 150px" />
        {/snippet}
        {#snippet darkModeImage()}
            <IllustrationSuccessDark style="width: 150px; height: 150px" />
        {/snippet}
        {#snippet description()}使用 Semi D2C 快速还原 Figma 设计稿，一键转代码{/snippet}
    </Empty>
{/snippet}

<Popover {content} trigger="custom" visible={value === true}>
    <span style="display: inline-block">
        <RadioGroup bind:value type="button">
            <Radio value={true}>受控显示</Radio>
            <Radio value={false}>受控隐藏</Radio>
        </RadioGroup>
    </span>
</Popover>
