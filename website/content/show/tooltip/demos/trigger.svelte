<script lang="ts">
    import { Button, Input, Radio, RadioGroup, Tooltip, type RadioValue } from '@fibrae/semi-ui-svelte';

    let visible = $state<RadioValue | undefined>(false);
</script>

{#snippet text()}hi semi{/snippet}

<div>
    <Tooltip content={text}>
        {#snippet child({ props })}
            <Button {...props} style="margin-block-end: 20px" theme="solid" type="tertiary">悬停显示</Button>
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="click">
        {#snippet child({ props })}
            <Button {...props} style="margin-block-end: 20px">点击显示</Button>
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="focus">
        {#snippet child({ props })}
            <Input {...props} aria-label="聚焦显示" placeholder="聚焦显示" style="width: 100px; margin-block-end: 20px" />
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="contextMenu">
        {#snippet child({ props })}
            <Button {...props} style="margin-block-end: 20px" theme="solid" type="secondary">右键点击展示</Button>
        {/snippet}
    </Tooltip>
    <br />
    <Tooltip content={text} trigger="custom" visible={visible === true}>
        {#snippet child({ props })}
            <span {...props} style="display: inline-block" tabindex="-1">
                <RadioGroup bind:value={visible} type="button">
                    <Radio value={true}>受控显示</Radio>
                    <Radio value={false}>受控隐藏</Radio>
                </RadioGroup>
            </span>
        {/snippet}
    </Tooltip>
</div>
