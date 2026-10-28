import { createSignal } from 'solid-js';
import { Switch, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-solid';

const treeData = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: 'China',
                value: 'China',
                key: '0-0',
                children: [
                    {
                        label: 'Beijing',
                        value: 'Beijing',
                        key: '0-0-0',
                    },
                    {
                        label: 'Shanghai',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                ],
            },
            {
                label: 'Japan',
                value: 'Japan',
                key: '0-1',
                children: [
                    {
                        label: 'Osaka',
                        value: 'Osaka',
                        key: '0-1-0',
                    },
                ],
            },
        ],
    },
    {
        label: 'North America',
        value: 'North America',
        key: '1',
        children: [
            {
                label: 'United States',
                value: 'United States',
                key: '1-0',
            },
            {
                label: 'Canada',
                value: 'Canada',
                key: '1-1',
            },
        ],
    },
];

function onSearch(inputValue: string, filteredExpandedKeys: string[], filteredNodes: TreeNodeData[]) {
    console.log('onSearch', inputValue, filteredExpandedKeys, filteredNodes);
}

export default function TreeSelectDemo() {
    const [showFilteredOnly, setShowFilteredOnly] = createSignal(false);

    return (
        <>
            <span id="treeselect-searchable-filtered-only">showFilteredOnly</span>
            <Switch aria-labelledby="treeselect-searchable-filtered-only" checked={showFilteredOnly()} onChange={(checked) => setShowFilteredOnly(checked)} size="small" />
            <br />
            <br />
            <TreeSelect style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} filterTreeNode showFilteredOnly={showFilteredOnly()} placeholder="单选可搜索的" onSearch={onSearch} />
            <br />
            <br />
            <TreeSelect style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} multiple filterTreeNode maxTagCount={2} showFilteredOnly={showFilteredOnly()} placeholder="多选可搜索的" searchPlaceholder="请输入关键字开始搜索" onSearch={onSearch} />
            <br />
            <br />
            <TreeSelect style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} multiple filterTreeNode maxTagCount={2} showFilteredOnly={showFilteredOnly()} placeholder="搜索框autofocus" searchPlaceholder="autofocus" searchAutoFocus onSearch={onSearch} />
        </>
    );
}
