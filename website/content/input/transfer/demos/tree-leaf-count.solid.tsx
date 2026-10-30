import { createSignal, Show } from 'solid-js';
import { Transfer, Button, type TransferSourceHeaderProps } from '@fibrae/semi-ui-solid';

const treeData = [
    {
        label: '文件夹 1',
        value: 'folder1',
        key: 'folder1',
        children: [
            {
                label: '文件 1-1',
                value: 'file1-1',
                key: 'file1-1',
            },
            {
                label: '文件 1-2',
                value: 'file1-2',
                key: 'file1-2',
            },
            {
                label: '子文件夹 1',
                value: 'subfolder1',
                key: 'subfolder1',
                children: [
                    {
                        label: '文件 1-1-1',
                        value: 'file1-1-1',
                        key: 'file1-1-1',
                    },
                    {
                        label: '文件 1-1-2',
                        value: 'file1-1-2',
                        key: 'file1-1-2',
                    },
                ],
            },
        ],
    },
    {
        label: '文件夹 2',
        value: 'folder2',
        key: 'folder2',
        children: [
            {
                label: '文件 2-1',
                value: 'file2-1',
                key: 'file2-1',
            },
            {
                label: '文件 2-2',
                value: 'file2-2',
                key: 'file2-2',
            },
        ],
    },
    {
        label: '独立文件',
        value: 'file3',
        key: 'file3',
    },
];

// the header reads its live object in the JSX, so it renders once and follows the selection
function renderSourceHeader(header: TransferSourceHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                padding: '8px 12px',
                'border-bottom': '1px solid var(--semi-color-border)',
            }}
        >
            <span>
                <strong>文件总数：</strong>
                {header.leafOnlyNum !== undefined ? header.leafOnlyNum : header.num} 个文件
                <Show when={header.leafOnlyNum !== undefined}>
                    <span style={{ color: 'var(--semi-color-text-2)', 'margin-left': '8px', 'font-size': '12px' }}>（总节点数：{header.num}）</span>
                </Show>
            </span>
            <Show when={header.showButton}>
                <Button theme="borderless" type="tertiary" size="small" onClick={() => header.onAllClick()}>
                    {header.allChecked ? '取消全选' : '全选'}
                </Button>
            </Show>
        </div>
    );
}

export default function TransferDemo() {
    const [value, setValue] = createSignal<Array<string | number>>([]);

    return <Transfer style={{ width: '600px' }} dataSource={treeData} type="treeList" value={value()} onChange={(values) => setValue(values)} renderSourceHeader={renderSourceHeader} />;
}
