import { useState } from 'react';
import { Transfer, Button, type TransferProps } from '@fibrae/semi-ui-react';

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

const renderSourceHeader: TransferProps['renderSourceHeader'] = (header) => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid var(--semi-color-border)',
            }}
        >
            <span>
                <strong>文件总数：</strong>
                {header.leafOnlyNum !== undefined ? header.leafOnlyNum : header.num} 个文件
                {header.leafOnlyNum !== undefined && <span style={{ color: 'var(--semi-color-text-2)', marginInlineStart: 8, fontSize: 12 }}>（总节点数：{header.num}）</span>}
            </span>
            {header.showButton && (
                <Button theme="borderless" type="tertiary" size="small" onClick={header.onAllClick}>
                    {header.allChecked ? '取消全选' : '全选'}
                </Button>
            )}
        </div>
    );
};

export default function TransferDemo() {
    const [value, setValue] = useState<Array<string | number>>([]);

    return <Transfer style={{ width: 600 }} dataSource={treeData} type="treeList" value={value} onChange={setValue} renderSourceHeader={renderSourceHeader} />;
}
