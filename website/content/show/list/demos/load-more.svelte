<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Avatar, Button, List, ListItem, Skeleton, SkeletonAvatar, SkeletonParagraph, SkeletonTitle } from '@fibrae/semi-ui-svelte';

    interface Book {
        title?: string;
        loading: boolean;
    }

    const count = 3;
    const data: Book[] = [];
    for (let i = 0; i < 40; i++) {
        data.push({ title: `Semi Design Title ${i}`, loading: false });
    }
    const placeholders: Book[] = [0, 1, 2].map(() => ({ loading: true }));

    const fetchData = (page: number) =>
        new Promise<Book[]>((resolve) => {
            setTimeout(() => resolve(data.slice(page * count, page * count + count)), 1000);
        });

    let dataSource = $state.raw<Book[]>([]);
    let loading = $state(true);
    let noMore = $state(false);
    let page = 0;
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
        noMore = !newDataSource.length;
    };

    const onLoadMore = () => {
        page += 1;
        void load();
    };

    void load();
</script>

<List dataSource={loading ? [...dataSource, ...placeholders] : dataSource} {loading}>
    {#snippet item({ item: book })}
        <Skeleton loading={book.loading}>
            {#snippet placeholder()}
                <div style="display: flex; align-items: flex-start; padding: 12px; border-bottom: 1px solid var(--semi-color-border)">
                    <SkeletonAvatar style="margin-right: 12px" />
                    <div>
                        <SkeletonTitle style="width: 120px; margin-bottom: 12px; margin-top: 12px" />
                        <SkeletonParagraph rows={2} style="width: 600px" />
                    </div>
                </div>
            {/snippet}
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
        </Skeleton>
    {/snippet}
    {#snippet loadMore()}
        {#if !loading && !noMore}
            <div style="text-align: center; margin-top: 12px; height: 32px; line-height: 32px">
                <Button onclick={onLoadMore}>显示更多</Button>
            </div>
        {/if}
    {/snippet}
</List>
