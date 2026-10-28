import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Avatar, Button, List, Spin } from '@fibrae/semi-ui-solid';

interface Book {
    title: string;
}

const count = 5;
const dataList: Book[] = Array.from({ length: 100 }, (_, i) => ({ title: `Semi Design Title ${i}` }));

const fetchData = (page: number) =>
    new Promise<Book[]>((res) => {
        setTimeout(() => {
            res(dataList.slice(page * count, page * count + count));
        }, 1000);
    });

export default function ListDemo() {
    const [page, setPage] = createSignal(0);
    const [loading, setLoading] = createSignal(true);
    const [dataSource, setDataSource] = createSignal<Book[]>([]);
    const [hasMore, setHasMore] = createSignal(true);

    let disposed = false;
    onCleanup(() => {
        disposed = true;
    });

    const showLoadMore = () => (page() + 1) % 4 === 0;

    const load = (index: number) => {
        setLoading(true);
        void fetchData(index).then((newDataSource) => {
            if (disposed) return;
            setDataSource((prevData) => [...prevData, ...newDataSource]);
            setLoading(false);
            setHasMore(!!newDataSource.length);
        });
    };

    onMount(() => {
        load(0);
    });

    const onLoadMore = () => {
        const next = page() + 1;
        setPage(next);
        load(next);
    };

    // Near the bottom of the scroll container, load the next page unless the load-more button takes over
    const onScroll = (event: { currentTarget: HTMLElement }) => {
        const el = event.currentTarget;
        if (loading() || !hasMore() || showLoadMore()) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight <= 20) onLoadMore();
    };

    return (
        <section aria-label="可滚动列表" class="light-scrollbar" tabIndex={0} style={{ height: '420px', overflow: 'auto', border: '1px solid var(--semi-color-border)', padding: '10px' }} onScroll={onScroll}>
            <List
                loadMore={
                    <Show when={!loading() && hasMore() && showLoadMore()}>
                        <div style={{ 'text-align': 'center', 'margin-top': '12px', height: '32px', 'line-height': '32px' }}>
                            <Button onClick={onLoadMore}>显示更多</Button>
                        </div>
                    </Show>
                }
                dataSource={dataSource()}
                renderItem={(item) => (
                    <List.Item
                        header={<Avatar color="grey">SE</Avatar>}
                        main={
                            <div>
                                <span style={{ color: 'var(--semi-color-text-0)', 'font-weight': '500' }}>{item.title}</span>
                                <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                            </div>
                        }
                    />
                )}
            />
            <Show when={loading() && hasMore()}>
                <div style={{ 'text-align': 'center' }}>
                    <Spin />
                </div>
            </Show>
        </section>
    );
}
