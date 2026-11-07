import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconMapPin } from '@fibrae/semi-icons-solid';
import Tree, { type TreeProps } from '..';
import Button from '../../button';

const treeChildren = [
    {
        label: '北京',
        value: 'beijing',
        key: 'beijing',
    },
    {
        label: '上海',
        value: 'shanghai',
        key: 'shanghai',
    },
];

const treeDataDisabled = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'Zhongguo',
                key: 'zhongguo',
                disabled: true,
                children: treeChildren,
            },
            {
                label: '日本',
                value: 'Riben',
                key: 'riben',
            },
        ],
    },
];

const treeDataExtra = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'Zhongguo',
                key: 'zhongguo',
                info: 'extra',
                children: treeChildren,
            },
            {
                label: '日本',
                value: 'Riben',
                key: 'riben',
            },
        ],
    },
];

function renderTree(props: TreeProps) {
    return render(() => <Tree defaultExpandAll {...props} />);
}

const getNode = (key: string) => document.querySelector<HTMLElement>(`[role="treeitem"][data-key="${key}"]`) as HTMLElement;

describe('Tree', () => {
    it('disable 节点属性', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: treeDataDisabled,
            onChange: spyOnChange,
        });
        const node = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`) as HTMLElement;
        expect(node).toHaveTextContent(/^中国$/);
        expect(node).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(node);
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-selected`)).toBeNull();
    });

    it('disable 节点属性配合多选', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: treeDataDisabled,
            onChange: spyOnChange,
            multiple: true,
        });
        const node = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`) as HTMLElement;
        expect(node).toHaveTextContent(/^中国$/);
        await userEvent.click(node);
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(node.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-disabled`)).not.toBeNull();
        expect(node.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).toBeNull();
    });

    it('禁用的树中节点数据 disabled:false 仍是禁用状态', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: [{ label: '北京', value: 'beijing', key: 'beijing', disabled: false }],
            disabled: true,
            onChange: spyOnChange,
        });
        const node = getNode('beijing');
        expect(node).toHaveAttribute('aria-disabled', 'true');
        expect(node).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-disabled`);
        await userEvent.click(node);
        expect(spyOnChange).not.toHaveBeenCalled();
    });

    it('多选的树里节点直接位于 tree 之下，没有多余的 group', () => {
        renderTree({ treeData: treeChildren, multiple: true });
        expect(screen.getByRole('tree').querySelector('[role="group"]')).toBeNull();
        expect(screen.getAllByRole('treeitem')[0].parentElement).toBe(screen.getByRole('tree'));
    });

    it('节点数据里的 active 字段不会给节点加样式', () => {
        renderTree({ treeData: [{ label: '北京', value: 'beijing', key: 'beijing', active: true }] });
        expect(getNode('beijing')).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-active`);
    });

    it('icon 函数按行决定图标', () => {
        render(() => <Tree defaultExpandAll treeData={treeDataExtra} icon={(row) => (row.eventKey === 'zhongguo' ? <IconMapPin /> : null)} />);
        const icons = document.querySelectorAll<SVGElement>(`.${BASE_CLASS_PREFIX}-icon-map_pin`);
        expect(icons).toHaveLength(1);
        expect(getNode('zhongguo')).toContainElement(icons[0]);
    });

    it('自定义节点属性配合 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: treeDataExtra,
            onChangeWithObject: true,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('zhongguo'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'zhongguo', info: 'extra' }));
    });

    it('renderLabel 渲染的标签内容', async () => {
        const spyOnClick = vi.fn<() => void>();
        render(() => (
            <Tree
                defaultExpandAll
                treeData={[{ label: '亚洲', value: 'yazhou', key: 'yazhou' }]}
                renderLabel={(label) => (
                    <span>
                        <span style={{ 'margin-inline-end': '30px' }}>{label}</span>
                        <Button
                            onClick={(e: MouseEvent) => {
                                spyOnClick();
                                e.stopPropagation();
                            }}
                        >
                            Click
                        </Button>
                    </span>
                )}
            />
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Click' }));
        expect(spyOnClick).toHaveBeenCalledTimes(1);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-selected`)).toBeNull();
    });
});
