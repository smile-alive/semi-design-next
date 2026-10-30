import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Avatar, Button, List, Skeleton, type AvatarColor } from '@fibrae/semi-ui-solid';

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
const placeholders: Book[] = [{ loading: true }, { loading: true }, { loading: true }];

function fetchData(page: number) {
    return new Promise<Book[]>((res) => {
        setTimeout(() => {
            res(data.slice(page * count, page * count + count));
        }, 1000);
    });
}

function Placeholder() {
    return (
        <div
            style={{
                display: 'flex',
                'align-items': 'flex-start',
                padding: '12px',
                'border-bottom': '1px solid var(--semi-color-border)',
            }}
        >
            <Skeleton.Avatar style={{ 'margin-right': '12px' }} />
            <div>
                <Skeleton.Title style={{ width: '120px', 'margin-bottom': '12px', 'margin-top': '12px' }} />
                <Skeleton.Paragraph style={{ width: '600px' }} rows={2} />
            </div>
        </div>
    );
}

export default function ListDemo() {
    let page = 0;
    const [loading, setLoading] = createSignal(true);
    const [dataSource, setDataSource] = createSignal<Book[]>([]);
    const [noMore, setNoMore] = createSignal(false);
    const list = createMemo(() => (loading() ? [...dataSource(), ...placeholders] : dataSource()));

    let disposed = false;
    onCleanup(() => {
        disposed = true;
    });

    const load = (index: number) => {
        void fetchData(index).then((newDataSource) => {
            if (disposed) return;
            setDataSource((prevData) => [...prevData, ...newDataSource]);
            setLoading(false);
            setNoMore(!newDataSource.length);
        });
    };

    onMount(() => {
        load(0);
    });

    const onLoadMore = () => {
        setLoading(true);
        load(++page);
    };

    return (
        <List
            loading={loading()}
            loadMore={
                <Show when={!loading() && !noMore()}>
                    <div
                        style={{
                            'text-align': 'center',
                            'margin-top': '12px',
                            height: '32px',
                            'line-height': '32px',
                        }}
                    >
                        <Button onClick={onLoadMore}>显示更多</Button>
                    </div>
                </Show>
            }
            dataSource={list()}
            renderItem={(item) => (
                <Skeleton placeholder={<Placeholder />} loading={item.loading}>
                    <List.Item
                        header={<Avatar color={item.color}>SE</Avatar>}
                        main={
                            <div>
                                <span style={{ color: 'var(--semi-color-text-0)', 'font-weight': '500' }}>{item.title}</span>
                                <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                            </div>
                        }
                    />
                </Skeleton>
            )}
        />
    );
}
