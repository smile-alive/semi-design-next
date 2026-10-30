<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-svelte';
    import { Empty, Popover, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

    let value = $state<RadioValue | undefined>(0);
    const imageStyle = 'width: 150px; height: 150px';
</script>

{#snippet content()}
    <Empty style="width: 400px; margin: 0 auto; display: flex; padding: 20px" title="先进的设计 / 研发协作方式">
        {#snippet image()}
            <IllustrationSuccess style={imageStyle} />
        {/snippet}
        {#snippet darkModeImage()}
            <IllustrationSuccessDark style={imageStyle} />
        {/snippet}
        {#snippet description()}使用 Semi D2C 快速还原 Figma 设计稿，一键转代码{/snippet}
    </Empty>
{/snippet}

<Popover {content} trigger="custom" visible={value === 1}>
    <span style="display: inline-block">
        <RadioGroup bind:value type="button">
            <Radio value={1}>受控显示</Radio>
            <Radio value={0}>受控隐藏</Radio>
        </RadioGroup>
    </span>
</Popover>
