<script lang="ts">
    import { IconSetting } from '@fibrae/semi-icons-svelte';
    import { Button, TextArea, Toast, TypographyNumeral, TypographyParagraph, TypographyText } from '@fibrae/semi-ui-svelte';

    // fixed so the server render and the browser agree
    const timestamp = 1700000000;
</script>

<div>
    <TypographyParagraph copyable>点击右边的图标复制文本。</TypographyParagraph>
    <TypographyParagraph copyable={{ content: 'Hello, Semi Design!' }}>点击复制文本。</TypographyParagraph>
    <TypographyParagraph copyable={{ onCopy: () => Toast.success({ content: '复制文本成功' }) }}>点击右边的图标复制文本。</TypographyParagraph>
    时间戳:
    <TypographyNumeral copyable truncate="ceil" underline>{timestamp}s</TypographyNumeral>
    <TypographyParagraph copyable>
        {#snippet copyIcon()}
            <IconSetting style="color: var(--semi-color-link)" />
        {/snippet}
        自定义复制节点
    </TypographyParagraph>
    <TypographyParagraph copyable={{ content: 'Custom render!' }}>
        {#snippet copyAction({ copied, copy, config })}
            <Button size="small" onclick={copy}>
                <span>{copied ? '复制成功' : `点击复制:${config.content}`}</span>
            </Button>
        {/snippet}
        自定义复制渲染
    </TypographyParagraph>
    <br />
    <br />
    <TypographyText id="typography-copyable-paste" type="secondary">粘贴区域：</TypographyText>
    <br />
    <TextArea aria-labelledby="typography-copyable-paste" autosize rows={3} style="width: 320px; margin-top: 4px" />
</div>
