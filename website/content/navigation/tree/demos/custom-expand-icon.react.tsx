import type { MouseEvent } from 'react';
import { IconMinus, IconPlus, IconChevronDown } from '@fibrae/semi-icons-react';
import { Tree } from '@fibrae/semi-ui-react';

interface ExpandIconProps {
    expanded: boolean;
    onClick: (e: MouseEvent) => void;
    className: string;
}

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

const expandIconFunc = (iconProps: ExpandIconProps) => {
    if (iconProps.expanded) {
        return <IconMinus size="small" className={iconProps.className} onClick={iconProps.onClick} />;
    } else {
        return <IconPlus size="small" className={iconProps.className} onClick={iconProps.onClick} />;
    }
};

const style = {
    width: 260,
    height: 200,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    return (
        <>
            <p>expandIcon 是固定的图标</p>
            <Tree expandIcon={<IconChevronDown size="small" className="testCls" />} multiple defaultExpandedKeys={['yazhou']} treeData={treeData} style={style} />
            <br />
            <p>expandIcon 随展开状态变化</p>
            <Tree multiple expandIcon={expandIconFunc} defaultExpandedKeys={['yazhou']} treeData={treeData} style={style} />
        </>
    );
}
