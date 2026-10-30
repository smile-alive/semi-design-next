<script lang="ts">
    import { Avatar, List, ListItem, type AvatarColor } from '@fibrae/semi-ui-svelte';

    interface Entry {
        title: string;
        color: AvatarColor;
    }

    const data: Entry[] = [
        { title: 'Semi Design Title 1', color: 'light-blue' },
        { title: 'Semi Design Title 2', color: 'grey' },
        { title: 'Semi Design Title 3', color: 'light-green' },
    ];
</script>

<div style="padding: 12px; border: 1px solid var(--semi-color-border); margin: 12px">
    <List dataSource={data} layout="horizontal">
        {#snippet item({ item: entry })}
            <ListItem>
                {#snippet header()}
                    <Avatar color={entry.color}>SE</Avatar>
                {/snippet}
                {#snippet main()}
                    <div>
                        <span style="color: var(--semi-color-text-0); font-weight: 500">{entry.title}</span>
                        <p style="color: var(--semi-color-text-2); margin: 4px 0">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                    </div>
                {/snippet}
            </ListItem>
        {/snippet}
    </List>
</div>
