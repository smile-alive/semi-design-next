import { createSignal } from 'solid-js';
import { IllustrationNoContent } from '@fibrae/semi-illustrations-solid';
import { AutoComplete, Empty } from '@fibrae/semi-ui-solid';

export default function AutoCompleteDemo() {
    const [data, setData] = createSignal<number[]>([]);
    const [loading, setLoading] = createSignal(false);

    const fetchData = (input: string) => {
        setLoading(true);
        setTimeout(() => {
            setData(input ? Array.from({ length: 5 }, () => Math.random()) : []);
            setLoading(false);
        }, 1000);
    };

    return <AutoComplete aria-label="搜索" loading={loading()} data={data()} emptyContent={<Empty style={{ padding: '12px', width: '300px' }} image={<IllustrationNoContent style={{ width: '150px', height: '150px' }} />} description="暂无内容" />} onSearch={fetchData} />;
}
