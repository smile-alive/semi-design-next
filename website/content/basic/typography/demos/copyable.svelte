<script lang="ts">
    import { IconSetting } from '@fibrae/semi-icons-svelte';
    import { Button, TextArea, Toast, Typography } from '@fibrae/semi-ui-svelte';

    const timestamp = 1700000000;
</script>

<div>
    <Typography.Paragraph copyable>点击右边的图标复制文本。</Typography.Paragraph>
    <Typography.Paragraph copyable={{ content: 'Hello, Semi Design!' }}>点击复制文本。</Typography.Paragraph>
    <Typography.Paragraph copyable={{ onCopy: () => Toast.success({ content: '复制文本成功' }) }}>点击右边的图标复制文本。</Typography.Paragraph>
    时间戳:
    <Typography.Numeral copyable truncate="ceil" underline>{timestamp}s</Typography.Numeral>
    <Typography.Paragraph copyable>
        {#snippet copyIcon()}
            <IconSetting style="color: var(--semi-color-link)" />
        {/snippet}
        自定义复制节点
    </Typography.Paragraph>
    <Typography.Paragraph copyable={{ content: 'Custom render!' }}>
        {#snippet copyAction({ copied, copy, config })}
            <Button size="small" onclick={copy}>
                <span>{copied ? '复制成功' : `点击复制:${config.content}`}</span>
            </Button>
        {/snippet}
        自定义复制渲染
    </Typography.Paragraph>
    <br />
    <br />
    <Typography.Text id="typography-copyable-paste" type="secondary">粘贴区域：</Typography.Text>
    <br />
    <TextArea aria-labelledby="typography-copyable-paste" autosize rows={3} style="width: 320px; margin-block-start: 4px" />
</div>
