<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Avatar, Button, List, ListItem, Spin } from '@fibrae/semi-ui-svelte';

    interface Book {
        title: string;
    }

    const count = 5;
    const dataList: Book[] = [];
    for (let i = 0; i < 100; i++) {
        dataList.push({ title: `Semi Design Title ${i}` });
    }

    const fetchData = (page: number) =>
        new Promise<Book[]>((resolve) => {
            setTimeout(() => resolve(dataList.slice(page * count, page * count + count)), 1000);
        });

    let dataSource = $state.raw<Book[]>([]);
    let loading = $state(true);
    let hasMore = $state(true);
    let page = $state(0);
    let disposed = false;
    onDestroy(() => {
        disposed = true;
    });

    const load = async () => {
        loading = true;
        const newDataSource = await fetchData(page);
        if (disposed) return;
        dataSource = [...dataSource, ...newDataSource];
        loading = false;
        hasMore = !!newDataSource.length;
    };

    const onLoadMore = () => {
        page += 1;
        void load();
    };

    const showLoadMore = $derived((page + 1) % 4 === 0);

    const onScroll = (event: Event) => {
        const el = event.currentTarget as HTMLElement;
        if (loading || !hasMore || showLoadMore) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight <= 20) onLoadMore();
    };

    void load();
</script>

<section aria-label="可滚动列表" class="light-scrollbar" style="height: 420px; overflow: auto; border: 1px solid var(--semi-color-border); padding: 10px" tabindex="0" onscroll={onScroll}>
    <List {dataSource}>
        {#snippet item({ item: book })}
            <ListItem>
                {#snippet header()}
                    <Avatar color="grey">SE</Avatar>
                {/snippet}
                {#snippet main()}
                    <div>
                        <span style="color: var(--semi-color-text-0); font-weight: 500">{book.title}</span>
                        <p style="color: var(--semi-color-text-2); margin: 4px 0">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                    </div>
                {/snippet}
            </ListItem>
        {/snippet}
        {#snippet loadMore()}
            {#if !loading && hasMore && showLoadMore}
                <div style="text-align: center; margin-top: 12px; height: 32px; line-height: 32px">
                    <Button onclick={onLoadMore}>显示更多</Button>
                </div>
            {/if}
        {/snippet}
    </List>
    {#if loading && hasMore}
        <div style="text-align: center">
            <Spin />
        </div>
    {/if}
</section>
