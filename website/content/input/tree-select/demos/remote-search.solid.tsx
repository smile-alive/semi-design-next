import { createSignal } from 'solid-js';
import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-solid';

export default function TreeSelectDemo() {
    const [value, setValue] = createSignal<string | number>();
    const [treeData, setTreeData] = createSignal<TreeNodeData[]>([]);

    function handleSearch(inputValue: string) {
        if (!inputValue) {
            setTreeData([]);
            return;
        }

        setTimeout(() => {
            const mockData = [
                { label: `${inputValue} - 结果1`, value: `${inputValue}-1`, key: `${inputValue}-1` },
                { label: `${inputValue} - 结果2`, value: `${inputValue}-2`, key: `${inputValue}-2` },
                { label: `${inputValue} - 结果3`, value: `${inputValue}-3`, key: `${inputValue}-3` },
            ];
            setTreeData(mockData);
        }, 500);
    }

    return <TreeSelect style={{ width: '300px' }} placeholder="请输入关键字进行远程搜索" treeData={treeData()} filterTreeNode remote value={value()} onChange={(next) => setValue(next)} onSearch={handleSearch} />;
}
