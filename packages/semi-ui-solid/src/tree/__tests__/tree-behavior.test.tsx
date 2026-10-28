import { createSignal } from 'solid-js';
import { createEvent, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Tree, { type RenderFullLabelProps, type TreeHandle, type TreeNodeData, type TreeProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Tooltip from '../../tooltip';

const treeData = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'Zhongguo',
                key: 'zhongguo',
                children: [
                    { label: '北京', value: 'Beijing', key: 'beijing' },
                    { label: '上海', value: 'Shanghai', key: 'shanghai' },
                ],
            },
            {
                label: '日本',
                value: 'Riben',
                key: 'riben',
                children: [
                    { label: '东京', value: 'Dongjing', key: 'dongjing' },
                    { label: '大阪', value: 'Daban', key: 'daban' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'Beimeizhou',
        key: 'beimeizhou',
        children: [
            { label: '美国', value: 'Meiguo', key: 'meiguo' },
            { label: '加拿大', value: 'Jianada', key: 'jianada' },
        ],
    },
];

const prefix = `${BASE_CLASS_PREFIX}-tree`;
const optionCls = `${prefix}-option`;
const collapsedCls = `${optionCls}-collapsed`;
const selectedCls = `${optionCls}-selected`;

const getNode = (key: string) => document.querySelector<HTMLElement>(`[role="treeitem"][data-key="${key}"]`) as HTMLElement;
const getExpandIcon = (node: HTMLElement) => node.querySelector<HTMLElement>(`.${optionCls}-expand-icon`) as HTMLElement;
const getVisibleKeys = () => [...document.querySelectorAll('[role="treeitem"]')].map((node) => node.getAttribute('data-key'));
const isChecked = (key: string) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
const isHalfChecked = (key: string) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-indeterminate`) !== null;
const activeKey = () => document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant') as string)?.getAttribute('data-key');
const focusTree = () => screen.getByRole('tree').focus();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function renderTree(initial: TreeProps) {
    const [props, setProps] = createSignal(initial);
    let handle!: TreeHandle;
    const result = render(() => <Tree ref={(h) => (handle = h)} {...props()} />);
    return { ...result, handle: () => handle, rerender: (next: TreeProps) => setProps(next) };
}

describe('Tree 行为', () => {
    it('renderLabel 接收标签、节点数据和搜索词', () => {
        const renderLabel = vi.fn<NonNullable<TreeProps['renderLabel']>>((label, data, keyword) => `${label}|${data?.value}|${keyword ?? ''}`);
        const { handle } = renderTree({ filterTreeNode: true, treeData, renderLabel });
        expect(getNode('yazhou')).toHaveTextContent('亚洲|Yazhou|');
        handle().search('北');
        expect(getNode('beijing')).toHaveTextContent('北京|Beijing|北');
        expect(renderLabel).toHaveBeenCalledWith('北京', expect.objectContaining({ key: 'beijing' }), '北');
    });

    it('renderFullLabel 渲染行内容，其回调驱动选择和展开', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        const renderFullLabel = (row: RenderFullLabelProps) => (
            <div class={row.class} data-expanded={String(row.expandStatus.expanded)} data-level={row.level}>
                <button type="button" onClick={(e) => row.onExpand(e)}>
                    toggle {row.data.key}
                </button>
                <button type="button" onClick={(e) => row.onClick(e)}>
                    select {row.data.key}
                </button>
            </div>
        );
        render(() => <Tree motion={false} renderFullLabel={renderFullLabel} treeData={treeData} onChange={onChange} />);
        const content = (key: string) => getNode(key).firstElementChild as HTMLElement;
        expect(content('yazhou')).toHaveClass(`${optionCls}-fullLabel-level-1`);
        expect(content('yazhou')).toHaveAttribute('data-expanded', 'false');
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(screen.getByRole('button', { name: 'toggle yazhou' }));
        expect(content('yazhou')).toHaveAttribute('data-expanded', 'true');
        expect(content('zhongguo')).toHaveAttribute('data-level', '1');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'select zhongguo' }));
        expect(onChange).toHaveBeenCalledWith('Zhongguo');
    });

    it('renderFullLabel 收到 checkStatus、filtered、searchWord，onCheck 勾选节点，expandIcon 渲染展开箭头', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        const renderFullLabel = (row: RenderFullLabelProps) => (
            <div data-testid={`row-${row.data.key}`} data-checked={String(row.checkStatus.checked)} data-filtered={String(row.filtered)} data-word={row.searchWord}>
                {row.expandIcon()}
                <button type="button" onClick={(e) => row.onCheck(e)}>
                    check {row.data.key}
                </button>
            </div>
        );
        render(() => <Tree motion={false} multiple filterTreeNode defaultExpandAll renderFullLabel={renderFullLabel} treeData={treeData} onChange={onChange} />);
        expect(screen.getByTestId('row-yazhou')).toHaveAttribute('data-checked', 'false');
        await userEvent.click(screen.getByRole('button', { name: 'check zhongguo' }));
        expect(screen.getByTestId('row-zhongguo')).toHaveAttribute('data-checked', 'true');
        expect(onChange).toHaveBeenCalledTimes(1);
        fireEvent.input(screen.getByRole('textbox'), { target: { value: '中国' } });
        await waitFor(() => expect(screen.getByTestId('row-zhongguo')).toHaveAttribute('data-word', '中国'));
        expect(screen.getByTestId('row-zhongguo')).toHaveAttribute('data-filtered', 'true');
    });

    it('renderFullLabel 保留自身样式，虚拟行位置落在包住它的行上', () => {
        const renderFullLabel = (row: RenderFullLabelProps) => (
            <span class={row.class} style={{ color: 'red' }}>
                {row.data.label}
            </span>
        );
        render(() => <Tree defaultExpandAll renderFullLabel={renderFullLabel} treeData={treeData} virtualize={{ itemSize: 30, height: 300 }} />);
        const node = getNode('zhongguo');
        expect((node.firstElementChild as HTMLElement).style.color).toBe('red');
        expect(node.style.position).toBe('absolute');
        expect(node.style.top).toBe('30px');
    });

    describe('键盘操作（APG tree view）', () => {
        it('树是唯一的 Tab 停靠点，并从已选行开始', () => {
            render(() => <Tree defaultExpandAll defaultValue="Shanghai" treeData={treeData} />);
            expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '0');
            expect(screen.getAllByRole('treeitem').filter((row) => row.hasAttribute('tabindex'))).toHaveLength(0);
            expect(activeKey()).toBe('shanghai');
        });

        it('Up、Down、Home 和 End 在可见行之间移动', async () => {
            render(() => <Tree treeData={treeData} />);
            focusTree();
            expect(activeKey()).toBe('yazhou');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('beimeizhou');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('beimeizhou');
            await userEvent.keyboard('{Home}');
            expect(activeKey()).toBe('yazhou');
            await userEvent.keyboard('{End}');
            expect(activeKey()).toBe('beimeizhou');
        });

        it('Right 展开分支后进入其中；Left 先回到父级，再收起', async () => {
            const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
            render(() => <Tree motion={false} treeData={treeData} onExpand={onExpand} />);
            focusTree();
            await userEvent.keyboard('{ArrowRight}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
            expect(onExpand).toHaveBeenLastCalledWith(['yazhou'], expect.objectContaining({ expanded: true }));
            await userEvent.keyboard('{ArrowRight}');
            expect(activeKey()).toBe('zhongguo');
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeKey()).toBe('yazhou');
            await userEvent.keyboard('{ArrowLeft}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
            expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
        });

        it('RTL 下 Left 展开分支，Right 收起', async () => {
            render(() => (
                <ConfigProvider direction="rtl">
                    <Tree motion={false} treeData={treeData} />
                </ConfigProvider>
            ));
            focusTree();
            await userEvent.keyboard('{ArrowLeft}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
        });

        it('数字标签参与键入跳转', async () => {
            render(() => (
                <Tree
                    treeData={[
                        { label: 'alpha', value: 'a', key: 'a' },
                        { label: 2024, value: 'y', key: 'y' },
                    ]}
                />
            ));
            focusTree();
            await userEvent.keyboard('2');
            expect(activeKey()).toBe('y');
        });

        it('Enter 选中当前行；多选树中 Space 勾选当前行', async () => {
            const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
            const { rerender } = renderTree({ treeData, onChange });
            focusTree();
            await userEvent.keyboard('{ArrowDown}{Enter}');
            expect(onChange).toHaveBeenLastCalledWith('Beimeizhou');
            expect(getNode('beimeizhou')).toHaveClass(selectedCls);

            rerender({ multiple: true, treeData, onChange });
            focusTree();
            await userEvent.keyboard('{End} ');
            expect(onChange).toHaveBeenLastCalledWith(['Beimeizhou']);
            expect(getNode('beimeizhou')).toHaveAttribute('aria-checked', 'true');
        });

        it('输入字符时移动到标签以输入内容开头的下一行', async () => {
            render(() => <Tree treeData={treeData} />);
            focusTree();
            await userEvent.keyboard('北');
            expect(activeKey()).toBe('beimeizhou');
        });

        it('行内可聚焦控件保留自身的 Enter 和 Space', async () => {
            const onSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
            // a click would bubble to the row and select it, as with the mouse; stopping it isolates the key handling
            const onClick = vi.fn<(e: MouseEvent) => void>((e) => e.stopPropagation());
            render(() => (
                <Tree
                    renderLabel={(label) => (
                        <button type="button" onClick={onClick}>
                            open {label}
                        </button>
                    )}
                    treeData={treeData}
                    onSelect={onSelect}
                />
            ));
            screen.getByRole('button', { name: 'open 亚洲' }).focus();
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(onClick).toHaveBeenCalledTimes(2);
            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    it('aria-setsize 和 aria-posinset 统计同级节点', () => {
        render(() => <Tree defaultExpandAll treeData={treeData} />);
        expect(getNode('shanghai')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('shanghai')).toHaveAttribute('aria-posinset', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-posinset', '2');
    });

    it('showFilteredOnly 搜索时 aria-setsize 和 aria-posinset 只统计可见的同级节点', () => {
        const { handle } = renderTree({ filterTreeNode: true, showFilteredOnly: true, treeData });
        handle().search('东京');
        for (const key of ['yazhou', 'riben', 'dongjing']) {
            expect(getNode(key)).toHaveAttribute('aria-setsize', '1');
            expect(getNode(key)).toHaveAttribute('aria-posinset', '1');
        }
    });

    it('多选树把勾选状态报告在行上；箭头和复选框是隐藏的图片', () => {
        render(() => <Tree defaultValue={['Beijing']} multiple treeData={treeData} />);
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'mixed');
        expect(getNode('yazhou')).not.toHaveAttribute('aria-selected');
        expect(getExpandIcon(getNode('yazhou'))).toHaveAttribute('aria-hidden', 'true');
        const checkbox = getNode('yazhou').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement;
        expect(checkbox.closest('[aria-hidden="true"]')).not.toBeNull();
        expect(checkbox.querySelector('input')).toHaveAttribute('tabindex', '-1');
    });

    it('ref.search 过滤树并调用 onSearch', () => {
        const onSearch = vi.fn<NonNullable<TreeProps['onSearch']>>();
        const { handle } = renderTree({ filterTreeNode: true, showFilteredOnly: true, treeData, searchRender: false, onSearch });
        expect(document.querySelector(`.${prefix}-search-wrapper`)).toBeNull();
        handle().search('东京');
        expect(onSearch).toHaveBeenCalledWith('东京', ['riben', 'yazhou']);
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        handle().search('');
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
    });

    it('data-* 透传到根元素，aria-label 透传到被命名的树', () => {
        const { container } = render(() => <Tree aria-label="Regions" data-testid="tree" treeData={treeData} />);
        expect(container.firstElementChild).toHaveAttribute('data-testid', 'tree');
        expect(container.firstElementChild).toHaveClass(`${prefix}-wrapper`);
        expect(container.firstElementChild).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('tree', { name: 'Regions' })).toBeInTheDocument();
    });

    it('aria-labelledby、aria-describedby 落在 role="tree" 元素上', () => {
        const { container } = render(() => (
            <>
                <span id="tree-title">目录</span>
                <span id="tree-hint">提示</span>
                <Tree aria-describedby="tree-hint" aria-labelledby="tree-title" treeData={treeData} />
            </>
        ));
        expect(screen.getByRole('tree', { name: '目录', description: '提示' })).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('aria-labelledby');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('aria-describedby');
    });

    describe('指针操作后的键盘当前行', () => {
        it('单选树：点击行后，方向键从被点击的行继续', async () => {
            render(() => <Tree defaultExpandAll motion={false} treeData={treeData} />);
            focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('zhongguo');
            await userEvent.click(getNode('riben'));
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('dongjing');
        });

        it('多选树：点击勾选行后，方向键从被勾选的行继续', async () => {
            render(() => <Tree defaultExpandAll motion={false} multiple treeData={treeData} />);
            await userEvent.click(getNode('beijing'));
            focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('shanghai');
        });

        it('点击展开箭头、右键、双击的行同样成为当前行', async () => {
            render(() => <Tree defaultExpandAll motion={false} treeData={treeData} />);
            focusTree();
            fireEvent.contextMenu(getNode('shanghai'));
            await userEvent.keyboard('{ArrowUp}');
            expect(activeKey()).toBe('beijing');
            fireEvent.dblClick(getNode('riben'));
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('dongjing');
            await userEvent.click(getExpandIcon(getNode('zhongguo')));
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).not.toBe('beijing');
        });
    });

    it.each([
        ['字符串', (row: RenderFullLabelProps) => row.data.label],
        ['Fragment', (row: RenderFullLabelProps) => <b>{row.data.label}</b>],
    ])('renderFullLabel 返回%s时，行仍由 treeitem 包住', (_name, renderFullLabel) => {
        render(() => <Tree motion={false} renderFullLabel={renderFullLabel} treeData={treeData} />);
        expect(screen.getAllByRole('treeitem')).toHaveLength(2);
        focusTree();
        const active = document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant') as string);
        expect(active).toBe(screen.getAllByRole('treeitem')[0]);
        expect(active).toHaveAttribute('aria-level', '1');
    });

    it('组件属性不会泄露到 DOM', async () => {
        const { container } = render(() => (
            <Tree
                autoMergeValue={false}
                defaultExpandAll
                draggable
                expandIcon={<span>+</span>}
                filterTreeNode
                hideDraggingNode
                keyMaps={{}}
                multiple
                renderLabel={(label) => label}
                treeData={treeData}
                onChange={() => {}}
                onContextMenu={() => {}}
                onDoubleClick={() => {}}
                onDragEnd={() => {}}
                onDragEnter={() => {}}
                onDragLeave={() => {}}
                onDragOver={() => {}}
                onDragStart={() => {}}
                onDrop={() => {}}
                onExpand={() => {}}
                onLoad={() => {}}
                onSearch={() => {}}
                onSelect={() => {}}
            />
        ));
        await userEvent.click(getNode('beijing'));
        expect((container.firstElementChild as HTMLElement).getAttributeNames()).toEqual(['class']);
        expect(screen.getByRole('tree').getAttributeNames().toSorted()).toEqual(['aria-activedescendant', 'aria-multiselectable', 'class', 'role', 'tabindex']);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Tree: { defaultExpandAll: true, blockNode: false } };
        try {
            render(() => <Tree treeData={treeData} />);
            expect(getNode('beijing')).not.toBeNull();
            expect(document.querySelector(`.${prefix}-option-list`)).not.toHaveClass(`${prefix}-option-list-block`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('每次操作只展开和选中一次', async () => {
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        const onSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(() => <Tree motion={false} treeData={treeData} onChange={onChange} onExpand={onExpand} onSelect={onSelect} />);
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(getNode('zhongguo')).not.toBeNull();
        await userEvent.click(getNode('zhongguo'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getNode('zhongguo')).toHaveClass(selectedCls);
    });

    it('节点只加载一次', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeProps['onLoad']>>();
        render(() => <Tree loadData={loadData} motion={false} treeData={[{ label: 'Async', value: 'async', key: 'async' }]} onLoad={onLoad} />);
        await userEvent.click(getExpandIcon(getNode('async')));
        await waitFor(() => expect(onLoad).toHaveBeenCalled());
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('keyMaps.key 加 loadData 时依次展开两个节点，各加载一次', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeProps['onLoad']>>();
        const data = [
            { name: 'A', id: 'a' },
            { name: 'B', id: 'b' },
        ] as unknown as TreeNodeData[];
        render(() => <Tree keyMaps={{ key: 'id', value: 'id', label: 'name' }} loadData={loadData} motion={false} treeData={data} onLoad={onLoad} />);
        await userEvent.click(getExpandIcon(getNode('a')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(2));
        expect(loadData.mock.calls.map(([node]) => node)).toEqual(data);
        expect([...(onLoad.mock.calls[1][0] as Set<string>)]).toEqual(['a', 'b']);
    });

    it('loadData 失败时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.reject(new Error('load failed')));
        const rejections: unknown[] = [];
        const onRejection = (reason: unknown) => rejections.push(reason);
        // A loadData rejection is rethrown to the caller by design; catch it so it does not fail the test
        process.on('unhandledRejection', onRejection);
        try {
            render(() => <Tree loadData={loadData} motion={false} treeData={[{ label: 'Async', value: 'async', key: 'async' }]} />);
            await userEvent.click(getExpandIcon(getNode('async')));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getNode('async').querySelector(`.${optionCls}-spin-icon`)).toBeNull());
            await userEvent.click(getExpandIcon(getNode('async')));
            await userEvent.click(getExpandIcon(getNode('async')));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        } finally {
            await wait(0);
            process.off('unhandledRejection', onRejection);
        }
    });

    it('leafOnly 只上报叶子节点的值', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(() => <Tree defaultExpandAll leafOnly multiple treeData={treeData} onChange={onChange} />);
        await userEvent.click(getNode('zhongguo').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai']);
        await userEvent.click(getNode('riben').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai', 'Dongjing', 'Daban']);
        expect(isChecked('yazhou')).toBe(true);
    });

    it('受控 value 在重新渲染时更新选中状态', () => {
        const { rerender } = renderTree({ value: 'Beijing', defaultExpandAll: true, treeData });
        expect(getNode('beijing')).toHaveClass(selectedCls);
        rerender({ value: 'Meiguo', defaultExpandAll: true, treeData });
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
        expect(getNode('meiguo')).toHaveClass(selectedCls);
    });

    it('受控多选值在重新渲染时更新勾选状态', () => {
        const { rerender } = renderTree({ multiple: true, value: ['Beijing'], defaultExpandAll: true, treeData });
        expect(isChecked('beijing')).toBe(true);
        expect(isHalfChecked('zhongguo')).toBe(true);
        rerender({ multiple: true, value: ['Beijing', 'Shanghai'], defaultExpandAll: true, treeData });
        expect(isChecked('zhongguo')).toBe(true);
        expect(isHalfChecked('yazhou')).toBe(true);
    });

    it('受控 expandedKeys 变化时，新增子节点在同一次更新中播放动画', async () => {
        const wrapperCls = `${BASE_CLASS_PREFIX}-collapsible-wrapper`;
        const { rerender } = renderTree({ expandedKeys: [], treeData });
        expect(document.querySelector(`.${wrapperCls}`)).toBeNull();
        rerender({ expandedKeys: ['yazhou'], treeData });
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(document.querySelector(`.${wrapperCls}`)).not.toBeNull();
        await waitFor(() => expect(getNode('zhongguo')).not.toBeNull());
        expect(getNode('zhongguo').closest(`.${wrapperCls}`)).not.toBeNull();
        expect(getNode('yazhou').closest(`.${wrapperCls}`)).toBeNull();
    });

    it('搜索时受控 expandedKeys 跟随 prop', () => {
        const { handle, rerender } = renderTree({ expandedKeys: ['beimeizhou'], filterTreeNode: true, treeData });
        handle().search('东京');
        expect(getNode('beimeizhou')).not.toHaveClass(collapsedCls);
        expect(getNode('meiguo')).not.toBeNull();
        expect(getNode('riben')).toBeNull();
        rerender({ autoExpandParent: true, expandedKeys: ['riben'], filterTreeNode: true, treeData });
        expect(getNode('dongjing')).not.toBeNull();
        expect(getNode('meiguo')).toBeNull();
    });

    it('搜索时 treeData 变化，保留搜索过滤', () => {
        const { handle, rerender } = renderTree({ filterTreeNode: true, showFilteredOnly: true, treeData });
        handle().search('东京');
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        const nextData = [...treeData, { label: '东京湾', value: 'Bay', key: 'bay' }];
        rerender({ filterTreeNode: true, showFilteredOnly: true, treeData: nextData });
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing', 'bay']);
    });

    it('labelEllipsis、showLine 和 expandIcon', async () => {
        const { rerender } = renderTree({ defaultExpandAll: true, labelEllipsis: true, showLine: true, treeData });
        expect(getNode('yazhou')).toHaveClass(`${optionCls}-ellipsis`);
        expect(document.querySelector(`.${optionCls}-indent-show-line`)).not.toBeNull();
        expect(getNode('beijing').querySelector(`.${optionCls}-switcher-leaf-line`)).not.toBeNull();

        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        rerender({
            expandIcon: (icon) => (
                <button type="button" class={icon.class} onClick={(e) => icon.onClick(e)}>
                    {icon.expanded ? 'close' : 'open'}
                </button>
            ),
            motion: false,
            treeData,
            onExpand,
        });
        expect(getExpandIcon(getNode('yazhou'))).toHaveTextContent('close');
        await userEvent.click(getExpandIcon(getNode('beimeizhou')));
        expect(onExpand).toHaveBeenLastCalledWith(expect.not.arrayContaining(['beimeizhou']), expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'beimeizhou' }) }));
        expect(getExpandIcon(getNode('beimeizhou'))).toHaveTextContent('open');

        rerender({
            // a getter, as a JSX attribute compiles to: every row reads its own element
            get expandIcon() {
                return <span class="custom">v</span>;
            },
            motion: false,
            treeData,
        });
        const icon = getExpandIcon(getNode('yazhou'));
        expect(icon).toHaveClass('custom');
        await userEvent.click(icon);
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('受控 loadedKeys 配合 onLoad', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeProps['onLoad']>>();
        const data = [
            { label: 'A', value: 'a', key: 'a' },
            { label: 'B', value: 'b', key: 'b' },
        ];
        render(() => <Tree loadData={loadData} loadedKeys={['a']} motion={false} treeData={data} onLoad={onLoad} />);
        expect(getExpandIcon(getNode('a'))).toBeNull();
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad).toHaveBeenCalledWith(new Set(['a', 'b']), expect.objectContaining({ key: 'b' }));
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(getExpandIcon(getNode('b'))).not.toBeNull();
    });

    it('列表标记为 tree，并带有多选状态；为空时不带多选状态', () => {
        const { rerender } = renderTree({ multiple: true, treeData });
        const list = document.querySelector(`.${prefix}-option-list`);
        expect(list).toHaveAttribute('role', 'tree');
        expect(list).toHaveAttribute('aria-multiselectable', 'true');
        rerender({ treeData: [] });
        expect(document.querySelector(`.${prefix}-option-list`)).toHaveAttribute('role', 'none');
    });

    it('即使更新仍被节流，drop 也上报最后一次 dragover 的位置', async () => {
        const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            bottom: 30,
            height: 30,
            left: 0,
            right: 100,
            width: 100,
            x: 0,
            y: 0,
        } as DOMRect);
        try {
            // jsdom has no DragEvent, so the coordinate is set on the generic event
            const drag = (type: 'dragEnter' | 'dragOver' | 'drop', key: string, clientY: number) => {
                const event = createEvent[type](getNode(key));
                Object.defineProperty(event, 'clientY', { value: clientY });
                fireEvent(getNode(key), event);
            };
            const onDrop = vi.fn<NonNullable<TreeProps['onDrop']>>();
            render(() => <Tree draggable treeData={treeData} onDrop={onDrop} />);
            fireEvent.dragStart(getNode('yazhou'));
            drag('dragEnter', 'beimeizhou', 15);
            // dragenter applies its state after a macrotask
            await wait(0);
            drag('dragOver', 'beimeizhou', 1);
            drag('dragOver', 'beimeizhou', 29);
            drag('drop', 'beimeizhou', 29);
            expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ dropPosition: 2, dropToGap: true }));
        } finally {
            rect.mockRestore();
        }
    });

    it('收起非受控节点时，以剩余的 key 触发 onExpand', async () => {
        function Demo() {
            const [keys, setKeys] = createSignal<string[]>([]);
            return (
                <>
                    <span data-testid="keys">{keys().join(',')}</span>
                    <Tree motion={false} treeData={treeData} onExpand={(expanded) => setKeys(expanded)} />
                </>
            );
        }
        render(() => <Demo />);
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        await userEvent.click(getExpandIcon(getNode('riben')));
        expect(screen.getByTestId('keys')).toHaveTextContent('yazhou,riben');
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(screen.getByTestId('keys')).toHaveTextContent('riben');
        expect(getNode('riben')).toBeNull();
    });
});

describe('Tree 审计修复', () => {
    it('keyMaps.label 下搜索期间 treeData 变化后仍按映射的字段过滤', () => {
        const data = [
            { label1: 'Apple', value: 'a', key: 'a' },
            { label1: 'Banana', value: 'b', key: 'b' },
        ];
        const props: TreeProps = { filterTreeNode: true, showFilteredOnly: true, keyMaps: { label: 'label1' }, motion: false };
        const { handle, rerender } = renderTree({ ...props, treeData: data });
        handle().search('Ban');
        expect(getVisibleKeys()).toEqual(['b']);
        rerender({ ...props, treeData: [...data, { label1: 'Banner', value: 'c', key: 'c' }] });
        expect(getVisibleKeys()).toEqual(['b', 'c']);
    });

    it('逐个勾选兄弟节点后，全选的父节点 aria-checked 为 true', async () => {
        render(() => <Tree defaultExpandAll motion={false} multiple treeData={treeData} />);
        await userEvent.click(getNode('beijing'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'mixed');
        await userEvent.click(getNode('shanghai'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'true');
        expect(isHalfChecked('zhongguo')).toBe(false);
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('点击半选的父节点后，父节点变为全选而不再半选', async () => {
        render(() => <Tree defaultExpandAll motion={false} multiple treeData={treeData} />);
        await userEvent.click(getNode('beijing'));
        await userEvent.click(getNode('zhongguo'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'true');
        expect(getNode('beijing')).toHaveAttribute('aria-checked', 'true');
        expect(getNode('shanghai')).toHaveAttribute('aria-checked', 'true');
    });

    it('受控 expandedKeys 的树在搜索后清空，保持控制方给出的展开状态', () => {
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        const { handle } = renderTree({ value: 'Beijing', expandedKeys: [], filterTreeNode: true, motion: false, treeData, onExpand });
        handle().search('北');
        handle().search('');
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('非受控树选中分支节点后搜索再清空，该分支保持收起', () => {
        const { handle } = renderTree({ defaultValue: 'Zhongguo', filterTreeNode: true, motion: false, treeData });
        handle().search('北');
        handle().search('');
        expect(getVisibleKeys()).not.toContain('beijing');
    });

    it('拖过收起的节点后立即 drop，自动展开不会在拖拽结束后触发', async () => {
        const onDragEnter = vi.fn<NonNullable<TreeProps['onDragEnter']>>();
        render(() => <Tree draggable motion={false} treeData={treeData} onDragEnter={onDragEnter} />);
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.dragEnter(getNode('beimeizhou'));
        fireEvent.drop(getNode('beimeizhou'));
        await wait(600);
        expect(getNode('meiguo')).toBeNull();
        expect(onDragEnter).not.toHaveBeenCalled();
    });

    it('treeDataSimpleJson 的键含点号时 onChange 收到嵌套对象', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(() => <Tree defaultExpandAll motion={false} treeDataSimpleJson={{ 'v1.2': { a: 'x' } }} onChange={onChange} />);
        await userEvent.click(getNode('v1.2_SEMI_TREE_SPLIT_a'));
        expect(onChange).toHaveBeenCalledWith({ 'v1.2': { a: 'x' } });
    });
});

describe('Tree 节点数据与行状态', () => {
    it('节点数据带 expanded 字段时仍能展开，onExpand 收到 expanded: true', async () => {
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        render(() => <Tree motion={false} treeData={[{ key: 'a', label: 'A', value: 'a', expanded: true, children: [{ key: 'b', label: 'B', value: 'b' }] }]} onExpand={onExpand} />);
        await userEvent.click(getExpandIcon(getNode('a')));
        expect(screen.getByRole('treeitem', { name: 'B' })).toBeInTheDocument();
        expect(onExpand).toHaveBeenCalledWith(['a'], expect.objectContaining({ expanded: true }));
    });

    it('节点数据带 checked 或 selected 字段时仍能勾选、选中', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        const { rerender } = renderTree({ multiple: true, treeData: [{ key: 'a', label: 'A', value: 'a', checked: true }], onChange });
        await userEvent.click(getNode('a'));
        expect(onChange).toHaveBeenLastCalledWith(['a']);
        rerender({ treeData: [{ key: 'a', label: 'A', value: 'a', selected: true }], onChange });
        await userEvent.click(getNode('a'));
        expect(onChange).toHaveBeenLastCalledWith('a');
        expect(getNode('a')).toHaveAttribute('aria-selected', 'true');
    });

    it('节点数据的 level、loading、empty 字段不改变行的层级、加载状态与渲染', () => {
        render(() => <Tree treeData={[{ key: 'a', label: 'A', value: 'a', level: 3, loading: true, empty: true }]} />);
        const row = screen.getByRole('treeitem', { name: 'A' });
        expect(row).toHaveAttribute('aria-level', '1');
        expect(row).not.toHaveAttribute('aria-busy');
    });

    it('keyMaps.children 映射到其他字段时，节点自带的 children 业务字段不让叶子变成分支', () => {
        render(() => <Tree keyMaps={{ children: 'items' }} treeData={[{ key: 'a', label: 'A', value: 'a', children: [{ key: 'x', label: 'X', value: 'x' }] }]} />);
        expect(getNode('a')).not.toHaveAttribute('aria-expanded');
        expect(getExpandIcon(getNode('a'))).toBeNull();
    });

    it('单选树 defaultValue={0} 选中值为 0 的节点，受控 value={0} 挂载时展开其祖先', () => {
        const flat = [
            { key: 'a', label: 'A', value: 0 },
            { key: 'b', label: 'B', value: 1 },
        ];
        const { unmount } = render(() => <Tree defaultValue={0} treeData={flat} />);
        expect(getNode('a')).toHaveAttribute('aria-selected', 'true');
        unmount();
        render(() => <Tree motion={false} treeData={[{ key: 'p', label: 'P', value: 'p', children: [{ key: 'c', label: 'C', value: 0 }] }]} value={0} />);
        expect(getNode('c')).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Tree 搜索', () => {
    it('搜索中收起祖先后，父组件以新引用传入同结构的 treeData，祖先保持收起', async () => {
        let handle!: TreeHandle;
        function Demo() {
            const [count, setCount] = createSignal(0);
            // a new reference on every expansion, as with treeData built inline
            const data = () => {
                count();
                return treeData.map((node) => ({ ...node }));
            };
            return <Tree ref={(h) => (handle = h)} filterTreeNode motion={false} treeData={data()} onExpand={() => setCount((value) => value + 1)} />;
        }
        render(() => <Demo />);
        handle.search('北京');
        expect(getNode('beijing')).not.toBeNull();
        await userEvent.click(getExpandIcon(getNode('zhongguo')));
        expect(getNode('beijing')).toBeNull();
        expect(getNode('zhongguo')).toHaveAttribute('aria-expanded', 'false');
    });

    it('受控 expandedKeys 加 showFilteredOnly 时，搜索中 treeData 新增的匹配项会显示', () => {
        const data = [
            { label: 'Apple', value: 'a', key: 'a' },
            { label: 'Banana', value: 'b', key: 'b' },
        ];
        const props: TreeProps = { filterTreeNode: true, showFilteredOnly: true, expandedKeys: [], motion: false };
        const { handle, rerender } = renderTree({ ...props, treeData: data });
        handle().search('Ban');
        expect(getVisibleKeys()).toEqual(['b']);
        rerender({ ...props, treeData: [...data, { label: 'Banner', value: 'c', key: 'c' }] });
        expect(getVisibleKeys()).toEqual(['b', 'c']);
    });

    it('数字标签按文本搜索，命中时高亮', () => {
        const data = [
            { key: 'b', label: 'object', value: 'b' },
            { key: 'c', label: 1001, value: 'c' },
        ];
        const { handle } = renderTree({ filterTreeNode: true, motion: false, showFilteredOnly: true, treeData: data });
        handle().search('10');
        expect(getVisibleKeys()).toEqual(['c']);
        expect(getNode('c').querySelector(`.${optionCls}-highlight`)).toHaveTextContent('10');
    });
});

describe('Tree 拖拽', () => {
    it('拖过收起的节点后拖出树，该节点不会被自动展开', async () => {
        render(() => <Tree draggable motion={false} treeData={treeData} />);
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.dragEnter(getNode('beimeizhou'));
        await wait(0);
        fireEvent.dragLeave(getNode('beimeizhou'));
        // the auto-expand delay is 400ms
        await wait(450);
        expect(getNode('meiguo')).toBeNull();
    });

    it('树外拖入（没有 dragStart）的 drop 不触发 onDrop', () => {
        const onDrop = vi.fn<NonNullable<TreeProps['onDrop']>>();
        render(() => <Tree draggable treeData={treeData} onDrop={onDrop} />);
        fireEvent.dragOver(getNode('beimeizhou'));
        fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).not.toHaveBeenCalled();
    });

    it('draggable 时 renderFullLabel 的内容在被拖拽的行内', () => {
        let content: HTMLElement | undefined;
        const onDragStart = vi.fn<NonNullable<TreeProps['onDragStart']>>();
        render(() => (
            <Tree
                draggable
                renderFullLabel={(row) => (
                    <span
                        ref={(element) => {
                            if (row.data.key === 'yazhou') {
                                content = element;
                            }
                        }}
                        class={row.class}
                    >
                        {row.data.label}
                    </span>
                )}
                treeData={treeData}
                onDragStart={onDragStart}
            />
        ));
        const row = screen.getByRole('treeitem', { name: '亚洲' });
        expect(row).toHaveAttribute('draggable', 'true');
        expect(content?.parentElement).toBe(row);
        fireEvent.dragStart(row);
        expect(onDragStart).toHaveBeenCalledWith(expect.objectContaining({ node: expect.objectContaining({ key: 'yazhou' }) }));
    });
});

describe('Tree 展开与加载', () => {
    it('expandAction="click" 加 loadData 时，点击 isLeaf 叶子不加载、不触发 onExpand', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        render(() => <Tree expandAction="click" loadData={loadData} treeData={[{ key: 'a', label: 'A', value: 'a', isLeaf: true }]} onExpand={onExpand} />);
        await userEvent.click(getNode('a'));
        expect(loadData).not.toHaveBeenCalled();
        expect(onExpand).not.toHaveBeenCalled();
        expect(getNode('a')).not.toHaveAttribute('aria-busy');
    });

    it('加载中的节点名称不含加载图标的名称，并标为 aria-busy', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => new Promise(() => {}));
        render(() => <Tree loadData={loadData} treeData={[{ key: 'a', label: 'A', value: 'a' }]} />);
        await userEvent.click(getExpandIcon(getNode('a')));
        expect(screen.getByRole('treeitem', { name: 'A' })).toHaveAttribute('aria-busy', 'true');
    });
});

describe('Tree 焦点', () => {
    it('指针点击多选树的复选框或虚拟树的行后，树本身持焦，方向键仍然有效', async () => {
        const { unmount } = render(() => <Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 30, height: 300 }} />);
        await userEvent.click(getNode('zhongguo'));
        expect(screen.getByRole('tree')).toHaveFocus();
        unmount();
        render(() => <Tree multiple treeData={treeData} />);
        await userEvent.click(document.querySelector('input[type="checkbox"]') as HTMLElement);
        const tree = screen.getByRole('tree');
        expect(tree).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(document.getElementById(tree.getAttribute('aria-activedescendant') as string)).toHaveAttribute('data-key', 'beimeizhou');
    });
});

describe('Tree 虚拟化', () => {
    it('虚拟行按节点 key 复用：收起上方分支后，留下的行保持原元素', async () => {
        render(() => <Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 30, height: 300 }} />);
        const row = getNode('beimeizhou');
        expect(row.style.top).toBe('210px');
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou', 'meiguo', 'jianada']);
        expect(getNode('beimeizhou')).toBe(row);
        expect(row.style.top).toBe('30px');
    });
});

describe('Tree 空状态与属性落点', () => {
    it('emptyContent 为 null 时不渲染空状态', () => {
        const { container } = render(() => <Tree emptyContent={null} treeData={[]} />);
        expect(container.querySelector(`.${prefix}-option-list`)).toBeNull();
    });

    it('tabIndex 落在 role="tree" 元素上，Tooltip 包裹时不多出 Tab 停留点', () => {
        const { container, unmount } = render(() => <Tree tabIndex={-1} treeData={treeData} />);
        expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '-1');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
        unmount();
        render(() => (
            <Tooltip content="tip">
                <Tree treeData={treeData} />
            </Tooltip>
        ));
        expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '0');
        expect(document.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
        expect(document.querySelector(`.${prefix}-wrapper`)?.parentElement).toHaveAttribute('tabindex', '-1');
    });
});
