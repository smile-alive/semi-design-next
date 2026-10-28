/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconMapPin } from '@fibrae/semi-icons-vue';
import type { TreeIconSlotProps, TreeLabelSlotProps, TreeNodeData } from '..';
import Button from '../../button';
import { getNode, renderTree as renderBase, spyOn } from './fixtures/data';

const treeChildren = [
    { label: '北京', value: 'beijing', key: 'beijing' },
    { label: '上海', value: 'shanghai', key: 'shanghai' },
];
const treeDataDisabled = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            { label: '中国', value: 'Zhongguo', key: 'zhongguo', disabled: true, children: treeChildren },
            { label: '日本', value: 'Riben', key: 'riben' },
        ],
    },
];
const treeDataExtra = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            { label: '中国', value: 'Zhongguo', key: 'zhongguo', info: 'extra', children: treeChildren },
            { label: '日本', value: 'Riben', key: 'riben' },
        ],
    },
];

const renderTree = (props: Record<string, unknown>, slots = {}) => renderBase({ defaultExpandAll: true, ...props }, slots);

describe('Tree 节点属性', () => {
    it('disable 节点属性', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ treeData: treeDataDisabled, onChange });
        const node = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`) as HTMLElement;
        expect(node).toHaveTextContent(/^中国$/);
        expect(node).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(node);
        expect(onChange).not.toHaveBeenCalled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-selected`)).toBeNull();
    });

    it('disable 节点属性配合多选', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ treeData: treeDataDisabled, onChange, multiple: true });
        const node = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`) as HTMLElement;
        expect(node).toHaveTextContent(/^中国$/);
        await userEvent.click(node);
        expect(onChange).not.toHaveBeenCalled();
        expect(node.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-disabled`)).not.toBeNull();
        expect(node.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).toBeNull();
    });

    it('禁用的树中节点数据 disabled:false 仍是禁用状态', async () => {
        const onChange = spyOn<'change'>();
        renderTree({
            treeData: [{ label: '北京', value: 'beijing', key: 'beijing', disabled: false }],
            disabled: true,
            onChange,
        });
        const node = getNode('beijing');
        expect(node).toHaveAttribute('aria-disabled', 'true');
        expect(node).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-disabled`);
        await userEvent.click(node);
        expect(onChange).not.toHaveBeenCalled();
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

    it('#icon 插槽按节点数据返回不同图标', () => {
        const icon = ({ item }: TreeIconSlotProps) => (item.key === 'zhongguo' ? <IconMapPin /> : null);
        renderTree({ treeData: treeDataDisabled }, { icon });
        const icons = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-map_pin`);
        expect(icons).toHaveLength(1);
        expect(getNode('zhongguo')).toContainElement(icons[0] as HTMLElement);
    });

    it('自定义节点属性配合 changeWithObject', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ treeData: treeDataExtra, changeWithObject: true, onChange });
        await userEvent.click(getNode('zhongguo'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'zhongguo', info: 'extra' }));
    });

    it('#label 插槽渲染节点', async () => {
        const onClick = vi.fn<() => void>();
        const label = ({ label: text }: TreeLabelSlotProps) => (
            <span>
                <span style={{ marginRight: '30px' }}>{text}</span>
                <Button
                    style={{ zIndex: 2 }}
                    onClick={(event: MouseEvent) => {
                        onClick();
                        event.stopPropagation();
                    }}
                >
                    {() => 'Click'}
                </Button>
            </span>
        );
        const treeData: TreeNodeData[] = [{ label: '亚洲', value: 'yazhou', key: 'yazhou' }];
        renderTree({ treeData }, { label });
        await userEvent.click(screen.getByRole('button', { name: 'Click' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-selected`)).toBeNull();
    });
});
