/** @jsxImportSource vue */
import { nextTick, type VNodeChild } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Tree, { type TreeEmits, type TreeFullLabelSlotProps, type TreeHandle, type TreeLabelSlotProps, type TreeNodeData } from '..';
import Button from '../../button';
import ConfigProvider from '../../config-provider';
import AsyncTree from './fixtures/async-tree.vue';
import FilterDemo from './fixtures/filter-demo.vue';

const treeData: TreeNodeData[] = [
    {
        label: '亚洲',
        value: 'yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'zhongguo',
                key: 'zhongguo',
                disabled: true,
                children: [
                    { label: '北京', value: 'beijing', key: 'beijing' },
                    { label: '上海', value: 'shanghai', key: 'shanghai' },
                ],
            },
            {
                label: '日本',
                value: 'riben',
                key: 'riben',
                children: [
                    { label: '东京', value: 'dongjing', key: 'dongjing' },
                    { label: '大阪', value: 'daban', key: 'daban' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'beimeizhou',
        key: 'beimeizhou',
        children: [
            { label: '美国', value: 'meiguo', key: 'meiguo' },
            { label: '加拿大', value: 'jianada', key: 'jianada' },
        ],
    },
];
const manyRoots = Array.from({ length: 100 }, (_, i) => ({ label: `Node ${i}`, value: `${i}`, key: `${i}` }));

const mount = (node: () => VNodeChild) => render(() => <ConfigProvider locale={en_US}>{node}</ConfigProvider>);
const getNode = (key: string) => document.querySelector(`[role="treeitem"][data-key="${key}"]`);
const activeRow = () => document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant') ?? '');

describe('Tree（浏览器）', () => {
    it('清空搜索值', async () => {
        mount(() => <Tree multiple filterTreeNode treeData={treeData} treeNodeFilterProp="value" />);
        const input = screen.getByRole('textbox');
        await userEvent.type(input, 'riben');
        await waitFor(() => expect(screen.getByText('日本')).toBeInTheDocument());

        await userEvent.hover(input);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(input).toHaveValue('');
        await waitFor(() => expect(screen.queryByText('日本')).toBeNull());
        expect(screen.queryByText('中国')).toBeNull();
    });

    it('加载数据', async () => {
        mount(() => <AsyncTree />);
        expect(screen.queryByText(/Child Node/)).toBeNull();
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-tree_triangle_down`) as HTMLElement);
        await waitFor(() => expect(screen.getAllByText(/Child Node/)).toHaveLength(2));
    });

    it('过滤数据', async () => {
        mount(() => <FilterDemo />);
        const expandIconSelector = `.${BASE_CLASS_PREFIX}-tree-option-expand-icon`;
        expect(document.querySelector(expandIconSelector)).toBeNull();
        await userEvent.type(screen.getByRole('textbox'), '0-0');
        await userEvent.click(screen.getByRole('button', { name: '动态改变数据' }));
        await waitFor(() => expect(document.querySelector(expandIconSelector)).not.toBeNull());
        const labels = () => document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tree-option-label-text`);
        await waitFor(() => expect([...labels()].map((label) => label.textContent)).toContain('Leaf-0-0'));
    });
});

describe('Tree 键盘焦点（浏览器）', () => {
    it('树获得键盘焦点时，主题焦点环跟随当前行', async () => {
        mount(() => <Tree defaultExpandAll treeData={treeData} />);
        await tabTo(screen.getByRole('tree'));
        expectThemeFocusRing(activeRow() as HTMLElement);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', 'zhongguo'));
        expectThemeFocusRing(activeRow() as HTMLElement);
        expect(screen.getByRole('tree')).toHaveFocus();
    });

    it('行内按钮是自行响应 Enter 的 Tab 停留点，指针聚焦的复选框仍可用方向键', async () => {
        const onSelect = vi.fn<(...args: TreeEmits['select']) => void>();
        // a click would bubble to the row and select it; stopping it isolates the key handling
        const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        const first = mount(() => (
            <Tree treeData={treeData} onSelect={onSelect}>
                {{
                    label: ({ label }: TreeLabelSlotProps) => <button type="button" onClick={onClick}>{`open ${label}`}</button>,
                }}
            </Tree>
        ));
        await tabTo(screen.getByRole('tree'));
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'open 亚洲' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();
        first.unmount();

        mount(() => <Tree multiple treeData={treeData} />);
        await userEvent.click(screen.getByText('亚洲'));
        (document.querySelector('input[type="checkbox"]') as HTMLInputElement).focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', 'beimeizhou'));
    });

    it('虚拟树将当前行滚动到可见区域，且只占一个 Tab 停留点', async () => {
        mount(() => (
            <>
                <Tree treeData={manyRoots} virtualize={{ height: 200, width: 300, itemSize: 30 }} />
                <Button>{() => 'after'}</Button>
            </>
        ));
        const tree = screen.getByRole('tree');
        await tabTo(tree);
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', '99'));
        expect(activeRow()?.getBoundingClientRect().bottom).toBeLessThanOrEqual(tree.getBoundingClientRect().bottom);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('ShadowRoot 内按 End 时把当前行滚进树的可视区', async () => {
        const roots = manyRoots.slice(0, 30);
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const view = render(() => <Tree style={{ height: '100px', overflow: 'auto' }} treeData={roots} />, { container });
        try {
            const tree = shadow.querySelector('[role="tree"]') as HTMLElement;
            tree.focus();
            await userEvent.keyboard('{End}');
            await waitFor(() => {
                const row = shadow.getElementById(tree.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
                expect(row).toHaveAttribute('data-key', '29');
                expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual((shadow.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`) as HTMLElement).getBoundingClientRect().bottom + 1);
            });
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('大数据量搜索后立即在树上按 Enter，选中的正是 aria-activedescendant 指向的、匹配关键字的节点', async () => {
        const data = Array.from({ length: 3000 }, (_, i) => ({ label: `Option ${i}`, value: `v${i}`, key: `k${i}` }));
        const onSelect = vi.fn<(...args: TreeEmits['select']) => void>();
        mount(() => <Tree filterTreeNode showFilteredOnly treeData={data} onSelect={onSelect} />);
        let atEnter: string | null | undefined;
        const record = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                const id = document.activeElement?.getAttribute('aria-activedescendant');
                atEnter = id ? document.getElementById(id)?.textContent : undefined;
            }
        };
        document.addEventListener('keydown', record, true);
        try {
            await userEvent.click(screen.getByRole('textbox'));
            await userEvent.keyboard('9{Tab}{Tab}{Enter}');
            await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        } finally {
            document.removeEventListener('keydown', record, true);
        }
        const label = data.find((node) => node.key === onSelect.mock.calls[0][0])?.label;
        expect(label).toBe(atEnter);
        expect(label).toContain('9');
    });
});

describe('Tree 虚拟滚动（浏览器）', () => {
    it('ref.scrollTo 将虚拟化树滚动到指定节点', async () => {
        let handle: TreeHandle | undefined;
        const capture = (value: unknown) => {
            if (value) handle = value as TreeHandle;
        };
        mount(() => <Tree ref={capture} defaultExpandAll treeData={treeData} virtualize={{ itemSize: 30, height: 60 }} />);
        expect(getNode('jianada')).toBeNull();
        await nextTick();
        handle?.scrollTo({ key: 'jianada', align: 'start' });
        await waitFor(() => expect(getNode('jianada')).not.toBeNull());
        handle?.scrollTo({ key: 'nowhere' });
        expect(getNode('jianada')).not.toBeNull();
    });

    it('Tab 进入虚拟树时，已选中的视口外行被渲染且 aria-activedescendant 指向它', async () => {
        mount(() => <Tree defaultValue="99" treeData={manyRoots} virtualize={{ height: 200, width: 300, itemSize: 30 }} />);
        const tree = screen.getByRole('tree');
        await tabTo(tree);
        await waitFor(() => expect(getNode('99')).not.toBeNull());
        expect(activeRow()).toBe(getNode('99'));
    });

    it('用户滚动虚拟树后渲染靠后的节点', async () => {
        mount(() => <Tree treeData={manyRoots} virtualize={{ height: 200, width: 300, itemSize: 30 }} />);
        await nextTick();
        const list = getNode('0')?.closest(`.${BASE_CLASS_PREFIX}-tree-virtual-list`) as HTMLElement;
        list.scrollTop = 30 * 80;
        await waitFor(() => expect(getNode('80')).not.toBeNull());
        expect(getNode('0')).toBeNull();
    });

    it('滚动后指针点击靠后的行：选中该行且不滚动', async () => {
        mount(() => <Tree treeData={manyRoots} virtualize={{ height: 200, width: 300, itemSize: 30 }} />);
        await nextTick();
        const list = getNode('0')?.closest(`.${BASE_CLASS_PREFIX}-tree-virtual-list`) as HTMLElement;
        list.scrollTop = 30 * 80;
        await waitFor(() => expect(getNode('81')).not.toBeNull());
        const scrollTop = list.scrollTop;
        await userEvent.click(getNode('81') as HTMLElement);
        await waitFor(() => expect(getNode('81')).toHaveAttribute('aria-selected', 'true'));
        expect(list.scrollTop).toBe(scrollTop);
    });

    it('同一次调用中先 ref.search 再 ref.scrollTo，滚动到搜索展开后的节点', async () => {
        const groups = Array.from({ length: 10 }, (_, g) => ({
            label: `Group ${g}`,
            value: `g${g}`,
            key: `g${g}`,
            children: Array.from({ length: 20 }, (_, c) => ({ label: `Leaf ${g}-${c}`, value: `l${g}-${c}`, key: `l${g}-${c}` })),
        }));
        let handle: TreeHandle | undefined;
        const capture = (value: unknown) => {
            if (value) handle = value as TreeHandle;
        };
        mount(() => <Tree ref={capture} filterTreeNode treeData={groups} virtualize={{ height: 60, width: 300, itemSize: 30 }} />);
        await nextTick();
        handle?.search('Leaf 9-19');
        handle?.scrollTo({ key: 'l9-19', align: 'start' });
        await waitFor(() => expect(getNode('l9-19')).not.toBeNull());
    });
});

describe('Tree 样式（浏览器）', () => {
    const paddings = (element: Element) => {
        const { paddingInlineStart, paddingTop, paddingBottom } = getComputedStyle(element);
        return { paddingInlineStart, paddingTop, paddingBottom };
    };

    it('树根 ul 没有浏览器默认外边距，#fullLabel 行的内边距与内置行一致', () => {
        const first = mount(() => <Tree treeData={treeData} />);
        expect(getComputedStyle(screen.getByRole('tree')).marginBlockStart).toBe('0px');
        const builtIn = paddings(getNode('yazhou') as HTMLElement);
        first.unmount();
        mount(() => (
            <Tree treeData={treeData}>
                {{
                    fullLabel: ({ class: cls, data }: TreeFullLabelSlotProps) => (
                        <div class={cls} data-testid={`row-${data.key}`}>
                            {String(data.label)}
                        </div>
                    ),
                }}
            </Tree>
        ));
        expect(paddings(screen.getByTestId('row-yazhou'))).toEqual(builtIn);
    });
});
