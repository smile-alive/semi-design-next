import { Cascader } from '@fibrae/semi-ui-solid';

const treeData = [
    {
        label: 'Product',
        value: 'Product',
        children: [
            {
                label: 'Semi-Material',
                value: 'Semi-Material',
            },
            {
                label: 'Semi-DSM',
                value: 'Semi-DSM',
            },
            {
                label: 'Semi',
                value: 'Semi',
            },
            {
                label: 'Semi-C2D',
                value: 'Semi-C2D',
            },
            {
                label: 'Semi-D2C',
                value: 'Semi-D2C',
            },
        ],
    },
];

export default function CascaderDemo() {
    return (
        <div>
            <Cascader
                style={{ width: '300px' }}
                treeData={treeData}
                placeholder="输入 s 查看排序效果"
                filterTreeNode
                filterSorter={(first, second, inputValue) => {
                    const firstData = first[first.length - 1];
                    const lastData = second[second.length - 1];
                    if (firstData.label === inputValue) {
                        return -1;
                    } else if (lastData.label === inputValue) {
                        return 1;
                    } else {
                        return String(firstData.label) < String(lastData.label) ? -1 : 1;
                    }
                }}
            />
        </div>
    );
}
