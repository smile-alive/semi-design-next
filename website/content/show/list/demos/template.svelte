<script lang="ts">
    import { Avatar, Button, ButtonGroup, List, ListItem } from '@fibrae/semi-ui-svelte';

    const text = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。';

    const data = [
        {
            text,
            style: 'color: var(--semi-color-text-2); margin: 4px 0; width: 420px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis',
        },
        { text, style: 'color: var(--semi-color-text-2); margin: 4px 0; width: 500px' },
        {
            text: 'Semi Design 以用户中心、内容优先、设计人性化的设计系统，打造一致、好看、好用、高效的用户体验。',
            style: 'color: var(--semi-color-text-2); margin: 4px 0; width: 500px',
        },
    ];
</script>

<div style="padding: 12px; border: 1px solid var(--semi-color-border); margin: 12px">
    <List dataSource={data}>
        {#snippet item({ item: entry })}
            <ListItem>
                {#snippet header()}
                    <Avatar color="blue">SE</Avatar>
                {/snippet}
                {#snippet main()}
                    <div>
                        <span style="color: var(--semi-color-text-0); font-weight: 500">示例标题</span>
                        <p style={entry.style}>{entry.text}</p>
                    </div>
                {/snippet}
                {#snippet extra()}
                    <ButtonGroup theme="borderless">
                        <Button>编辑</Button>
                        <Button>更多</Button>
                    </ButtonGroup>
                {/snippet}
            </ListItem>
        {/snippet}
    </List>
</div>
