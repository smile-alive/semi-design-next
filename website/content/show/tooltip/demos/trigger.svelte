<script lang="ts">
    import { Button, Input, Radio, RadioGroup, Tooltip, type RadioValue } from '@fibrae/semi-ui-svelte';

    let visible = $state<RadioValue | undefined>(0);
</script>

{#snippet text()}hi bytedance{/snippet}

<div>
    <Tooltip content={text}>
        {#snippet child({ props })}
            <Button {...props} style="margin-bottom: 20px" theme="solid" type="tertiary">悬停显示</Button>
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="click">
        {#snippet child({ props })}
            <Button {...props} style="margin-bottom: 20px">点击显示</Button>
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="focus">
        {#snippet child({ props })}
            <Input {...props} aria-label="聚焦显示" placeholder="聚焦显示" style="width: 100px; margin-bottom: 20px" />
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="contextMenu">
        {#snippet child({ props })}
            <Button {...props} style="margin-bottom: 20px" theme="solid" type="secondary">右键点击展示</Button>
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="custom" visible={visible === 1}>
        {#snippet child({ props })}
            <span {...props} style="display: inline-block" tabindex="-1">
                <RadioGroup bind:value={visible} type="button">
                    <Radio value={1}>受控显示</Radio>
                    <Radio value={0}>受控隐藏</Radio>
                </RadioGroup>
            </span>
        {/snippet}
    </Tooltip>
</div>
