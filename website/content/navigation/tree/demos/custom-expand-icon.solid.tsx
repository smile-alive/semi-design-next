import { Show } from 'solid-js';
import { IconChevronDown, IconMinus, IconPlus } from '@fibrae/semi-icons-solid';
import { Tree, type TreeExpandIconProps, type TreeNodeData } from '@fibrae/semi-ui-solid';

const treeData: TreeNodeData[] = [
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

// The tree adds the class and the click to an element, but a function renders the icon itself, so the icon reads
// `expanded` inside Show: a plain `if` would keep the first value
const expandIconFunc = (iconProps: TreeExpandIconProps) => (
    <Show when={iconProps.expanded} fallback={<IconPlus size="small" class={iconProps.class} onClick={iconProps.onClick} />}>
        <IconMinus size="small" class={iconProps.class} onClick={iconProps.onClick} />
    </Show>
);

const style = {
    width: '260px',
    height: '200px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    return (
        <>
            <p>expandIcon 是元素</p>
            <Tree expandIcon={<IconChevronDown size="small" class="testCls" />} multiple defaultExpandedKeys={['yazhou']} treeData={treeData} style={style} />
            <br />
            <p>expandIcon 是函数 </p>
            <Tree multiple expandIcon={expandIconFunc} defaultExpandedKeys={['yazhou']} treeData={treeData} style={style} />
        </>
    );
}
