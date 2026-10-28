import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Tree, { type TreeElement, type TreeNodeData, type TreeProps } from '..';
import Button from '../../button';

const treeData = [
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

const getNode = (key: string) => document.querySelector<HTMLElement>(`[role="treeitem"][data-key="${key}"]`);
const manyRoots = (length: number) => Array.from({ length }, (_, i) => ({ label: `Node ${i}`, value: `${i}`, key: `${i}` }));

describe('tree', () => {
    it('清空搜索值', async () => {
        render(() => <Tree filterTreeNode multiple treeData={treeData} treeNodeFilterProp="value" />);
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
        function Demo() {
            const [data, setData] = createSignal<TreeNodeData[]>([
                { label: 'Expand to load', key: '0' },
                { label: 'Expand to load', key: '1' },
                { label: 'Tree Node', key: '2', isLeaf: true },
            ]);
            const loadData = (node?: TreeNodeData) =>
                new Promise<void>((resolve) => {
                    if (!node || node.children) {
                        resolve();
                        return;
                    }
                    setTimeout(() => {
                        setData((origin) => origin.map((item) => (item.key === node.key ? { ...item, children: [0, 1].map((i) => ({ label: 'Child Node', key: `${node.key}-${i}` })) } : item)));
                        resolve();
                    }, 50);
                });
            return <Tree loadData={loadData} treeData={data()} />;
        }
        render(() => <Demo />);
        expect(screen.queryByText('Child Node')).toBeNull();
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-tree_triangle_down`) as HTMLElement);
        await waitFor(() => expect(screen.getAllByText('Child Node')).toHaveLength(2));
    });

    it('过滤数据', async () => {
        function Demo() {
            const [data, setData] = createSignal<TreeNodeData[]>([{ key: '0', label: 'item-0', value: '0' }]);
            const [inputValue, setInputValue] = createSignal('');
            const [expandedKeys, setExpandedKeys] = createSignal<string[]>([]);
            const [autoExpandParent, setAutoExpandParent] = createSignal(false);
            const update = (nextData: TreeNodeData[], nextInputValue: string) => {
                const keys: string[] = [];
                const collect = (nodes: TreeNodeData[]) =>
                    nodes.forEach((node) => {
                        if (String(node.label).includes(nextInputValue)) {
                            keys.push(node.key as string);
                        }
                        if (node.children) {
                            collect(node.children);
                        }
                    });
                collect(nextData);
                setData(nextData);
                setInputValue(nextInputValue);
                setExpandedKeys(keys);
                setAutoExpandParent(true);
            };
            const changeData = () =>
                update(
                    [0, 1].map((i) => ({
                        key: `${i}`,
                        label: `Item-${i}`,
                        value: `${i}`,
                        children: [0, 1].map((ci) => ({
                            key: `${i}-${ci}`,
                            label: `Leaf-${i}-${ci}`,
                            value: `${i}-${ci}`,
                        })),
                    })),
                    inputValue()
                );
            return (
                <div>
                    <Tree
                        autoExpandParent={autoExpandParent()}
                        expandedKeys={expandedKeys()}
                        filterTreeNode
                        treeData={data()}
                        onExpand={(keys) => {
                            setExpandedKeys(keys);
                            setAutoExpandParent(false);
                        }}
                        onSearch={(value) => update(data(), value)}
                    />
                    <Button onClick={changeData}>动态改变数据</Button>
                </div>
            );
        }
        render(() => <Demo />);
        const expandIconSelector = `.${BASE_CLASS_PREFIX}-tree-option-expand-icon`;
        expect(document.querySelector(expandIconSelector)).toBeNull();
        await userEvent.type(screen.getByRole('textbox'), '0-0');
        await userEvent.click(screen.getByRole('button', { name: '动态改变数据' }));
        await waitFor(() => expect(document.querySelector(expandIconSelector)).not.toBeNull());
        const labels = () => document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tree-option-label-text`);
        await waitFor(() => expect([...labels()].map((label) => label.textContent)).toContain('Leaf-0-0'));
    });
});

describe('Tree 键盘焦点', () => {
    const activeRow = () => {
        const tree = screen.getByRole('tree');
        return document.getElementById(tree.getAttribute('aria-activedescendant') as string) as HTMLElement;
    };

    it('树获得键盘焦点时，主题焦点环跟随当前行', async () => {
        render(() => <Tree defaultExpandAll treeData={treeData} />);
        await tabTo(screen.getByRole('tree'));
        expectThemeFocusRing(activeRow());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', 'zhongguo'));
        expectThemeFocusRing(activeRow());
        expect(screen.getByRole('tree')).toHaveFocus();
    });

    it('行内按钮是自行响应 Enter 的 Tab 停留点，指针聚焦的复选框仍可用方向键', async () => {
        const onSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        // a click would bubble to the row and select it, as with the mouse; stopping it isolates the key handling
        const onClick = vi.fn<(e: MouseEvent) => void>((e) => e.stopPropagation());
        const [multiple, setMultiple] = createSignal(false);
        render(() => (
            <Tree
                multiple={multiple()}
                renderLabel={
                    multiple()
                        ? undefined
                        : (label) => (
                              <button type="button" onClick={onClick}>
                                  open {label}
                              </button>
                          )
                }
                treeData={treeData}
                onSelect={onSelect}
            />
        ));
        await tabTo(screen.getByRole('tree'));
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'open 亚洲' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();

        setMultiple(true);
        await userEvent.click(screen.getByText('亚洲'));
        const checkbox = document.querySelector<HTMLInputElement>('input[type="checkbox"]') as HTMLInputElement;
        checkbox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', 'beimeizhou'));
    });

    it('虚拟树将当前行滚动到可见区域，且只占一个 Tab 停留点', async () => {
        render(() => (
            <>
                <Tree treeData={manyRoots(100)} virtualize={{ height: 200, width: 300, itemSize: 30 }} />
                <Button>after</Button>
            </>
        ));
        const tree = screen.getByRole('tree');
        await tabTo(tree);
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', '99'));
        expect(activeRow().getBoundingClientRect().bottom).toBeLessThanOrEqual(tree.getBoundingClientRect().bottom);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('ShadowRoot 内按 End 时把当前行滚进树的可视区', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(() => <Tree style={{ height: '100px', overflow: 'auto' }} treeData={manyRoots(30)} />, { container: mount });
        try {
            const tree = shadow.querySelector<HTMLElement>('[role="tree"]') as HTMLElement;
            tree.focus();
            await userEvent.keyboard('{End}');
            await waitFor(() => {
                const row = shadow.getElementById(tree.getAttribute('aria-activedescendant') as string) as HTMLElement;
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
        const onSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        render(() => <Tree filterTreeNode showFilteredOnly treeData={data} onSelect={onSelect} />);
        let atEnter: string | null | undefined;
        const record = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
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

describe('Tree 虚拟滚动', () => {
    function renderWithHandle(props: TreeProps) {
        let handle!: TreeElement;
        render(() => <Tree ref={(h) => (handle = h)} {...props} />);
        return () => handle;
    }

    it('ref 是根元素，不带 key 的 scrollTo 交给根元素的原生 scrollTo', () => {
        const native = vi.spyOn(Element.prototype, 'scrollTo');
        const handle = renderWithHandle({ defaultExpandAll: true, treeData });
        expect(handle()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-wrapper`);
        handle().scrollTo({ top: 30 });
        handle().scrollTo(0, 10);
        expect(native.mock.calls).toEqual([[{ top: 30 }], [0, 10]]);
        expect(native.mock.contexts).toEqual([handle(), handle()]);
        native.mockRestore();
    });

    it('ref.scrollTo 将虚拟化树滚动到指定节点', async () => {
        const handle = renderWithHandle({ defaultExpandAll: true, treeData, virtualize: { itemSize: 30, height: 60 } });
        expect(getNode('jianada')).toBeNull();
        handle().scrollTo({ key: 'jianada', align: 'start' });
        await waitFor(() => expect(getNode('jianada')).not.toBeNull());
        handle().scrollTo({ key: 'nowhere' });
        expect(getNode('jianada')).not.toBeNull();
    });

    it('Tab 进入虚拟树时，已选中的视口外行被渲染且 aria-activedescendant 指向它', async () => {
        render(() => <Tree defaultValue="99" treeData={manyRoots(100)} virtualize={{ height: 200, width: 300, itemSize: 30 }} />);
        const tree = screen.getByRole('tree');
        await tabTo(tree);
        await waitFor(() => expect(getNode('99')).not.toBeNull());
        expect(document.getElementById(tree.getAttribute('aria-activedescendant') as string)).toBe(getNode('99'));
    });

    it('用户滚动虚拟树后渲染靠后的节点', async () => {
        render(() => <Tree treeData={manyRoots(100)} virtualize={{ height: 200, width: 300, itemSize: 30 }} />);
        const list = getNode('0')?.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-virtual-list`) as HTMLElement;
        list.scrollTop = 30 * 80;
        await waitFor(() => expect(getNode('80')).not.toBeNull());
        expect(getNode('0')).toBeNull();
    });

    it('滚动后指针点击靠后的行：选中该行且不滚动', async () => {
        render(() => <Tree treeData={manyRoots(100)} virtualize={{ height: 200, width: 300, itemSize: 30 }} />);
        const list = getNode('0')?.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-virtual-list`) as HTMLElement;
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
        const handle = renderWithHandle({ filterTreeNode: true, treeData: groups, virtualize: { height: 60, width: 300, itemSize: 30 } });
        handle().search('Leaf 9-19');
        handle().scrollTo({ key: 'l9-19', align: 'start' });
        await waitFor(() => expect(getNode('l9-19')).not.toBeNull());
    });
});

describe('Tree 样式', () => {
    const paddings = (element: Element) => {
        const { paddingInlineStart, paddingTop, paddingBottom } = getComputedStyle(element);
        return { paddingInlineStart, paddingTop, paddingBottom };
    };

    it('树根列表没有外边距，renderFullLabel 内容（div）的内边距与内置行一致', () => {
        const { unmount } = render(() => <Tree treeData={treeData} />);
        expect(getComputedStyle(screen.getByRole('tree')).marginBlockStart).toBe('0px');
        const builtIn = paddings(screen.getByRole('treeitem', { name: '亚洲' }));
        unmount();
        render(() => (
            <Tree
                renderFullLabel={(row) => (
                    <div class={row.class} data-testid={`row-${row.data.key}`}>
                        {row.data.label}
                    </div>
                )}
                treeData={treeData}
            />
        ));
        expect(paddings(screen.getByTestId('row-yazhou'))).toEqual(builtIn);
    });
});
