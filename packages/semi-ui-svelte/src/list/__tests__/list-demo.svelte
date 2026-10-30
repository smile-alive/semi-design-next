<script lang="ts">
    import { List, ListItem } from '../index';
    import type { ListItemProps, ListItemSnippetProps, ListProps } from '../interface';

    // `mode` picks what fills the List: the `item` snippet, ListItem children, both, or nothing.
    // `chrome` picks the header, footer, emptyContent and loadMore snippets to supply.
    // `store` is a reactive object a test writes to.
    let {
        mode = 'item',
        rows = [],
        itemProps = {},
        chrome = [],
        store,
        ...props
    }: ListProps<string> & {
        store?: ListProps<string>;
        mode?: 'item' | 'rich' | 'children' | 'both' | 'none';
        rows?: Array<string | { text: string; props: ListItemProps }>;
        itemProps?: ListItemProps;
        chrome?: Array<'header' | 'footer' | 'emptyContent' | 'loadMore'>;
    } = $props();

    const chromeProps = $derived({
        emptyContent: chrome.includes('emptyContent') ? emptySnippet : undefined,
        footer: chrome.includes('footer') ? footerSnippet : undefined,
        header: chrome.includes('header') ? headerSnippet : undefined,
        loadMore: chrome.includes('loadMore') ? loadMoreSnippet : undefined,
    });
</script>

{#snippet textItem({ item }: ListItemSnippetProps<string>)}<ListItem {...itemProps}>{item}</ListItem>{/snippet}
{#snippet richItem({ item }: ListItemSnippetProps<string>)}
    <ListItem {...itemProps}>
        {#snippet header()}<span class="head">SE</span>{/snippet}
        {#snippet main()}<span class="title">示例标题</span>{item}{/snippet}
        {#snippet extra()}<button type="button">编辑</button>{/snippet}
    </ListItem>
{/snippet}
{#snippet headerSnippet()}<span class="header">头部</span>{/snippet}
{#snippet footerSnippet()}<div class="footer">尾部</div>{/snippet}
{#snippet emptySnippet()}<span class="empty">自定义空内容</span>{/snippet}
{#snippet loadMoreSnippet()}<button type="button">加载更多</button>{/snippet}

<!-- children are passed only when the mode has rows: a List without children shows its empty state -->
{#if mode === 'children' || mode === 'both'}
    <List {...props} {...store} {...chromeProps} item={mode === 'both' ? textItem : undefined}>
        {#each rows as row, index (index)}
            {#if typeof row === 'string'}
                <ListItem {...itemProps}>{row}</ListItem>
            {:else}
                <ListItem {...itemProps} {...row.props}>{row.text}</ListItem>
            {/if}
        {/each}
    </List>
{:else}
    <List {...props} {...store} {...chromeProps} item={mode === 'item' ? textItem : mode === 'rich' ? richItem : undefined} />
{/if}
