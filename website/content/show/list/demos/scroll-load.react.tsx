import { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Button, Avatar, Spin } from '@fibrae/semi-ui-react';

interface Book {
    title: string;
}

const count = 5;
const dataList: Book[] = Array.from({ length: 100 }, (_, i) => ({ title: `Semi Design Title ${i}` }));

function fetchData(page: number) {
    return new Promise<Book[]>((res) => {
        setTimeout(() => {
            res(dataList.slice(page * count, page * count + count));
        }, 1000);
    });
}

export default function ListDemo() {
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<Book[]>([]);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        let ignore = false;
        void fetchData(page).then((newDataSource) => {
            if (!ignore) {
                setDataSource((prevData) => [...prevData, ...newDataSource]);
                setLoading(false);
                setHasMore(!!newDataSource.length);
            }
        });
        return () => {
            ignore = true;
        };
    }, [page]);

    const onLoadMore = () => {
        setLoading(true);
        setPage(page + 1);
    };

    const showLoadMore = (page + 1) % 4 === 0;
    const loadMore =
        !loading && hasMore && showLoadMore ? (
            <div
                style={{
                    textAlign: 'center',
                    marginTop: 12,
                    height: 32,
                    lineHeight: '32px',
                }}
            >
                <Button onClick={onLoadMore}>显示更多</Button>
            </div>
        ) : null;

    return (
        <section className="light-scrollbar" tabIndex={0} aria-label="可滚动列表" style={{ height: 420, overflow: 'auto', border: '1px solid var(--semi-color-border)', padding: 10 }}>
            <InfiniteScroll initialLoad={false} pageStart={0} threshold={20} loadMore={onLoadMore} hasMore={!loading && hasMore && !showLoadMore} useWindow={false}>
                <List
                    loadMore={loadMore}
                    dataSource={dataSource}
                    renderItem={(item) => (
                        <List.Item
                            header={<Avatar color="grey">SE</Avatar>}
                            main={
                                <div>
                                    <span style={{ color: 'var(--semi-color-text-0)', fontWeight: 500 }}>{item.title}</span>
                                    <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                                </div>
                            }
                        />
                    )}
                />
                {loading && hasMore && (
                    <div style={{ textAlign: 'center' }}>
                        <Spin />
                    </div>
                )}
            </InfiniteScroll>
        </section>
    );
}
