import { useState, useEffect } from 'react';
import { List, Skeleton, Button, Avatar, type AvatarColor } from '@fibrae/semi-ui-react';

interface Book {
    color?: AvatarColor;
    title?: string;
    loading: boolean;
}

const count = 3;
const data: Book[] = [];
for (let i = 0; i < 40; i++) {
    data.push({
        color: 'grey',
        title: `Semi Design Title ${i}`,
        loading: false,
    });
}
const placeholders: Book[] = [0, 1, 2].map(() => ({ loading: true }));

function fetchData(page: number) {
    return new Promise<Book[]>((res) => {
        setTimeout(() => {
            res(data.slice(page * count, page * count + count));
        }, 1000);
    });
}

export default function ListDemo() {
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<Book[]>([]);
    const [noMore, setNoMore] = useState(false);
    const list = loading ? [...dataSource, ...placeholders] : dataSource;

    useEffect(() => {
        let ignore = false;
        void fetchData(page).then((newDataSource) => {
            if (!ignore) {
                setDataSource((prevData) => [...prevData, ...newDataSource]);
                setLoading(false);
                setNoMore(!newDataSource.length);
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

    const loadMore =
        !loading && !noMore ? (
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

    const placeholder = (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: 12,
                borderBottom: '1px solid var(--semi-color-border)',
            }}
        >
            <Skeleton.Avatar style={{ marginRight: 12 }} />
            <div>
                <Skeleton.Title style={{ width: 120, marginBottom: 12, marginTop: 12 }} />
                <Skeleton.Paragraph style={{ width: 600 }} rows={2} />
            </div>
        </div>
    );
    return (
        <List
            loading={loading}
            loadMore={loadMore}
            dataSource={list}
            renderItem={(item) => (
                <Skeleton placeholder={placeholder} loading={item.loading}>
                    <List.Item
                        header={<Avatar color={item.color}>SE</Avatar>}
                        main={
                            <div>
                                <span style={{ color: 'var(--semi-color-text-0)', fontWeight: 500 }}>{item.title}</span>
                                <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                            </div>
                        }
                    />
                </Skeleton>
            )}
        />
    );
}
