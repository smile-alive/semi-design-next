import { useState, useMemo } from 'react';
import { debounce } from 'es-toolkit';
import { Cascader, Spin, type CascaderData } from '@fibrae/semi-ui-react';

const fetchByKeyword = (keyword: string) =>
    new Promise<CascaderData[]>((resolve) => {
        const delay = 200 + Math.floor(Math.random() * 800);
        setTimeout(() => {
            if (!keyword) {
                resolve([]);
                return;
            }
            resolve([
                { label: `${keyword} - 选项 A`, value: `${keyword}-a` },
                { label: `${keyword} - 选项 B`, value: `${keyword}-b` },
                { label: `${keyword} - 选项 C`, value: `${keyword}-c` },
            ]);
        }, delay);
    });

export default function CascaderDemo() {
    const [treeData, setTreeData] = useState<CascaderData[]>([]);
    const [loading, setLoading] = useState(false);
    const handleSearch = useMemo(() => {
        const latest = { token: 0 };
        return debounce((input: string) => {
            if (!input) {
                setTreeData([]);
                setLoading(false);
                return;
            }
            latest.token += 1;
            const token = latest.token;
            setLoading(true);
            void fetchByKeyword(input).then((next) => {
                // Drop stale results that arrive after a newer request
                if (token !== latest.token) {
                    return;
                }
                setTreeData(next);
                setLoading(false);
            });
        }, 300);
    }, []);

    return (
        <Spin spinning={loading}>
            <Cascader style={{ width: 300 }} placeholder="输入关键词远程搜索" filterTreeNode remote treeData={treeData} onSearch={handleSearch} onChange={(v) => console.log('selected:', v)} />
        </Spin>
    );
}
