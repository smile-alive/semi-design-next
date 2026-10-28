import { useCallback, type MouseEvent } from 'react';
import { IconMinus, IconPlus, IconChevronDown } from '@fibrae/semi-icons-react';
import { Tree } from '@fibrae/semi-ui-react';

interface ExpandIconProps {
    expanded: boolean;
    onClick: (e: MouseEvent) => void;
    className: string;
}

export default function TreeDemo() {
    const treeData = [
        {
            label: '亚洲',
            key: 'yazhou',
            children: [
                {
                    label: '中国',
                    key: 'zhongguo',
                    children: [
                        {
                            label: '北京',
                            key: 'beijing',
                        },
                        {
                            label: '上海',
                            key: 'shanghai',
                        },
                    ],
                },
                {
                    label: '日本',
                    key: 'riben',
                },
            ],
        },
        {
            label: '北美洲',
            key: 'beimeizhou',
        },
    ];
    const expandIconFunc = useCallback(({ expanded, onClick, className }: ExpandIconProps) => {
        if (expanded) {
            return <IconMinus size="small" className={className} onClick={onClick} />;
        } else {
            return <IconPlus size="small" className={className} onClick={onClick} />;
        }
    }, []);
    const style = {
        width: 260,
        height: 200,
        border: '1px solid var(--semi-color-border)',
    };

    return (
        <>
            <p>expandIcon 是 ReactNode</p>
            <Tree expandIcon={<IconChevronDown size="small" className="testCls" />} multiple defaultExpandedKeys={['yazhou']} treeData={treeData} style={style} />
            <br />
            <p>expandIcon 是函数 </p>
            <Tree multiple expandIcon={expandIconFunc} defaultExpandedKeys={['yazhou']} treeData={treeData} style={style} />
        </>
    );
}
