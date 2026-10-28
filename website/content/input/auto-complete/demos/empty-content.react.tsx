import { useState } from 'react';
import { IllustrationNoContent } from '@fibrae/semi-illustrations-react';
import { AutoComplete, Empty } from '@fibrae/semi-ui-react';

export default function AutoCompleteDemo() {
    let [data, setData] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = (v: string) => {
        setLoading(true);
        setTimeout(() => {
            if (!v) {
                setData([]);
                setLoading(false);
                return;
            }
            setData(() => {
                const res = Array.from(Array(5)).map(() => Math.random());
                return res;
            });
            setLoading(false);
        }, 1000);
    };

    return <AutoComplete aria-label="搜索" loading={loading} data={data} emptyContent={<Empty style={{ padding: 12, width: 300 }} image={<IllustrationNoContent style={{ width: 150, height: 150 }} />} description="暂无内容" />} onSearch={fetchData} />;
}
