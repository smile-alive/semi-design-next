import { createRef, StrictMode, useState } from 'react';
import { render, screen, fireEvent, createEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { ConfigProvider, Tooltip, Tree } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { TreeHandle, TreeProps } from '../interface';

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

const getNode = (key) => document.querySelector<HTMLElement>(`[role="treeitem"][data-key="${key}"]`);
const getExpandIcon = (node) => node.querySelector(`.${optionCls}-expand-icon`);
const getVisibleKeys = () => [...document.querySelectorAll('[role="treeitem"]')].map((node) => node.getAttribute('data-key'));
const isChecked = (key) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
const isHalfChecked = (key) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-indeterminate`) !== null;

describe('Tree 行为', () => {
    it('renderLabel 接收标签、节点数据和搜索词', () => {
        const renderLabel = vi.fn<NonNullable<TreeProps['renderLabel']>>((label, data, keyword) => `${label}|${data.value}|${keyword ?? ''}`);
        const ref = createRef<TreeHandle>();
        render(<Tree ref={ref} filterTreeNode treeData={treeData} renderLabel={renderLabel} />);
        expect(getNode('yazhou')).toHaveTextContent('亚洲|Yazhou|');
        act(() => ref.current.search('北'));
        expect(getNode('beijing')).toHaveTextContent('北京|Beijing|北');
        expect(renderLabel).toHaveBeenCalledWith('北京', expect.objectContaining({ key: 'beijing' }), '北');
    });

    it('renderFullLabel 渲染自定义行，其回调驱动选择和展开', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        const renderFullLabel = ({ className, onClick, onExpand, data, level, expandStatus, style }) => (
            <li className={className} style={style} data-expanded={String(expandStatus.expanded)} data-key={data.key} data-level={level} role="treeitem" onClick={onClick} onKeyDown={onClick}>
                <button type="button" onClick={onExpand}>
                    toggle {data.key}
                </button>
                {data.label}
            </li>
        );
        render(<Tree motion={false} treeData={treeData} renderFullLabel={renderFullLabel} onChange={onChange} />);
        expect(getNode('yazhou')).toHaveClass(`${optionCls}-fullLabel-level-1`);
        expect(getNode('yazhou')).toHaveAttribute('data-expanded', 'false');
        await userEvent.click(screen.getByRole('button', { name: 'toggle yazhou' }));
        expect(getNode('yazhou')).toHaveAttribute('data-expanded', 'true');
        expect(getNode('zhongguo')).toHaveAttribute('data-level', '1');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getNode('zhongguo'));
        expect(onChange).toHaveBeenCalledWith('Zhongguo');
    });

    it('renderFullLabel 保留自身样式，并获取虚拟行位置', () => {
        const renderFullLabel = ({ className, data, onClick }) => (
            <li className={className} style={{ color: 'red' }} data-key={data.key} role="treeitem" onClick={onClick} onKeyDown={onClick}>
                {data.label}
            </li>
        );
        render(<Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 30, height: 300 }} renderFullLabel={renderFullLabel} />);
        const node = getNode('zhongguo');
        expect(node.style.color).toBe('red');
        expect(node.style.position).toBe('absolute');
        expect(node.style.top).toBe('30px');
    });

    describe('键盘操作（APG tree view）', () => {
        const activeKey = () => {
            const tree = screen.getByRole('tree');
            return document.getElementById(tree.getAttribute('aria-activedescendant'))?.getAttribute('data-key');
        };
        const focusTree = () => act(() => screen.getByRole('tree').focus());

        it('树是唯一的 Tab 停靠点，并从已选行开始', () => {
            render(<Tree defaultValue="Shanghai" defaultExpandAll treeData={treeData} />);
            expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '0');
            expect(screen.getAllByRole('treeitem').filter((row) => row.hasAttribute('tabindex'))).toHaveLength(0);
            expect(activeKey()).toBe('shanghai');
        });

        it('Up、Down、Home 和 End 在可见行之间移动', async () => {
            render(<Tree treeData={treeData} />);
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
            render(<Tree motion={false} treeData={treeData} onExpand={onExpand} />);
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
            render(
                <ConfigProvider direction="rtl">
                    <Tree motion={false} treeData={treeData} />
                </ConfigProvider>
            );
            focusTree();
            await userEvent.keyboard('{ArrowLeft}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
        });

        it('数字标签参与键入跳转', async () => {
            render(
                <Tree
                    treeData={[
                        { label: 'alpha', value: 'a', key: 'a' },
                        { label: 2024, value: 'y', key: 'y' },
                    ]}
                />
            );
            focusTree();
            await userEvent.keyboard('2');
            expect(activeKey()).toBe('y');
        });

        it('Enter 选中当前行；多选树中 Space 勾选当前行', async () => {
            const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
            const { rerender } = render(<Tree treeData={treeData} onChange={onChange} />);
            focusTree();
            await userEvent.keyboard('{ArrowDown}{Enter}');
            expect(onChange).toHaveBeenLastCalledWith('Beimeizhou');
            expect(getNode('beimeizhou')).toHaveClass(selectedCls);

            rerender(<Tree multiple treeData={treeData} onChange={onChange} />);
            focusTree();
            await userEvent.keyboard('{End} ');
            expect(onChange).toHaveBeenLastCalledWith(['Beimeizhou']);
            expect(getNode('beimeizhou')).toHaveAttribute('aria-checked', 'true');
        });

        it('输入字符时移动到标签以输入内容开头的下一行', async () => {
            render(<Tree treeData={treeData} />);
            focusTree();
            await userEvent.keyboard('北');
            expect(activeKey()).toBe('beimeizhou');
        });

        it('行内可聚焦控件保留自身的 Enter 和 Space', async () => {
            const onSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
            // a click would bubble to the row and select it, as with the mouse; stopping it isolates the key handling
            const onClick = vi.fn<(e: { stopPropagation: () => void }) => void>((e) => e.stopPropagation());
            render(<Tree treeData={treeData} renderLabel={(label) => <button onClick={onClick}>{`open ${label}`}</button>} onSelect={onSelect} />);
            act(() => screen.getByRole('button', { name: 'open 亚洲' }).focus());
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(onClick).toHaveBeenCalledTimes(2);
            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    it('aria-setsize 和 aria-posinset 统计同级节点', () => {
        render(<Tree defaultExpandAll treeData={treeData} />);
        expect(getNode('shanghai')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('shanghai')).toHaveAttribute('aria-posinset', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-posinset', '2');
    });

    it('showFilteredOnly 搜索时 aria-setsize 和 aria-posinset 只统计可见的同级节点', () => {
        const ref = createRef<TreeHandle>();
        render(<Tree ref={ref} filterTreeNode showFilteredOnly treeData={treeData} />);
        act(() => ref.current.search('东京'));
        for (const key of ['yazhou', 'riben', 'dongjing']) {
            expect(getNode(key)).toHaveAttribute('aria-setsize', '1');
            expect(getNode(key)).toHaveAttribute('aria-posinset', '1');
        }
    });

    it('多选树把勾选状态报告在行上；箭头和复选框是隐藏的图片', () => {
        render(<Tree defaultValue={['Beijing']} multiple treeData={treeData} />);
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'mixed');
        expect(getNode('yazhou')).not.toHaveAttribute('aria-selected');
        expect(getExpandIcon(getNode('yazhou'))).toHaveAttribute('aria-hidden', 'true');
        const checkbox = getNode('yazhou').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`);
        expect(checkbox).toHaveAttribute('aria-hidden', 'true');
        expect(checkbox.querySelector('input')).toHaveAttribute('tabindex', '-1');
    });

    it('ref.search 过滤树并调用 onSearch', () => {
        const onSearch = vi.fn<NonNullable<TreeProps['onSearch']>>();
        const ref = createRef<TreeHandle>();
        render(<Tree ref={ref} filterTreeNode showFilteredOnly treeData={treeData} searchRender={false} onSearch={onSearch} />);
        expect(document.querySelector(`.${prefix}-search-wrapper`)).toBeNull();
        act(() => ref.current.search('东京'));
        expect(onSearch).toHaveBeenCalledWith('东京', ['riben', 'yazhou']);
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        act(() => ref.current.search(''));
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
    });

    it('data-* 透传到根元素，aria-label 透传到被命名的树', () => {
        const { container } = render(<Tree data-testid="tree" aria-label="Regions" treeData={treeData} />);
        expect(container.firstElementChild).toHaveAttribute('data-testid', 'tree');
        expect(container.firstElementChild).toHaveClass(`${prefix}-wrapper`);
        expect(container.firstElementChild).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('tree', { name: 'Regions' })).toBeInTheDocument();
    });

    it('aria-labelledby、aria-describedby 落在 role="tree" 元素上', () => {
        const { container } = render(
            <>
                <span id="tree-title">目录</span>
                <span id="tree-hint">提示</span>
                <Tree aria-describedby="tree-hint" aria-labelledby="tree-title" treeData={treeData} />
            </>
        );
        expect(screen.getByRole('tree', { name: '目录', description: '提示' })).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('aria-labelledby');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('aria-describedby');
    });

    describe('指针操作后的键盘当前行', () => {
        const activeKey = () => document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant'))?.getAttribute('data-key');

        it('单选树：点击行后，方向键从被点击的行继续', async () => {
            render(<Tree defaultExpandAll motion={false} treeData={treeData} />);
            act(() => screen.getByRole('tree').focus());
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('zhongguo');
            await userEvent.click(document.querySelector('[data-key="riben"]'));
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('dongjing');
        });

        it('多选树：点击勾选行后，方向键从被勾选的行继续', async () => {
            render(<Tree multiple defaultExpandAll motion={false} treeData={treeData} />);
            await userEvent.click(document.querySelector('[data-key="beijing"]'));
            act(() => screen.getByRole('tree').focus());
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('shanghai');
        });

        it('点击展开箭头、右键、双击的行同样成为当前行', async () => {
            render(<Tree defaultExpandAll motion={false} treeData={treeData} />);
            act(() => screen.getByRole('tree').focus());
            fireEvent.contextMenu(document.querySelector('[data-key="shanghai"]'));
            await userEvent.keyboard('{ArrowUp}');
            expect(activeKey()).toBe('beijing');
            fireEvent.doubleClick(document.querySelector('[data-key="riben"]'));
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('dongjing');
            await userEvent.click(document.querySelector('[data-key="zhongguo"] .semi-tree-option-expand-icon'));
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).not.toBe('beijing');
        });
    });

    it.each([
        ['字符串', ({ data }) => data.label],
        [
            'Fragment',
            ({ data }) => (
                <>
                    <b>{data.label}</b>
                </>
            ),
        ],
    ])('renderFullLabel 返回%s时，行仍由 treeitem 包住', (_name, renderFullLabel) => {
        render(<Tree motion={false} treeData={treeData} renderFullLabel={renderFullLabel} />);
        expect(screen.getAllByRole('treeitem')).toHaveLength(2);
        act(() => screen.getByRole('tree').focus());
        const active = document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant'));
        expect(active).toBe(screen.getAllByRole('treeitem')[0]);
        expect(active).toHaveAttribute('aria-level', '1');
    });

    it('组件属性不会泄露到 DOM', async () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            render(
                <Tree
                    multiple
                    autoMergeValue={false}
                    defaultExpandAll
                    draggable
                    expandIcon={<span>+</span>}
                    filterTreeNode
                    hideDraggingNode
                    keyMaps={{}}
                    treeData={treeData}
                    renderLabel={(label) => label}
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
            );
            await userEvent.click(getNode('beijing'));
            const leaks = errors.mock.calls.filter(([message]) => /does not recognize|Unknown event handler|Invalid value for prop/.test(String(message)));
            expect(leaks).toEqual([]);
        } finally {
            errors.mockRestore();
        }
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Tree: { defaultExpandAll: true, blockNode: false } };
        try {
            render(<Tree treeData={treeData} />);
            expect(getNode('beijing')).not.toBeNull();
            expect(document.querySelector(`.${prefix}-option-list`)).not.toHaveClass(`${prefix}-option-list-block`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下每次操作只展开和选中一次', async () => {
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        const onSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(
            <StrictMode>
                <Tree motion={false} treeData={treeData} onChange={onChange} onExpand={onExpand} onSelect={onSelect} />
            </StrictMode>
        );
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(getNode('zhongguo')).not.toBeNull();
        await userEvent.click(getNode('zhongguo'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getNode('zhongguo')).toHaveClass(selectedCls);
    });

    it('StrictMode 下节点只加载一次', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeProps['onLoad']>>();
        render(
            <StrictMode>
                <Tree loadData={loadData} motion={false} treeData={[{ label: 'Async', value: 'async', key: 'async' }]} onLoad={onLoad} />
            </StrictMode>
        );
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
        ];
        render(<Tree keyMaps={{ key: 'id', value: 'id', label: 'name' }} loadData={loadData} motion={false} treeData={data} onLoad={onLoad} />);
        await userEvent.click(getExpandIcon(getNode('a')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(2));
        expect(loadData.mock.calls.map(([node]) => node)).toEqual(data);
        expect([...onLoad.mock.calls[1][0]]).toEqual(['a', 'b']);
    });

    it('loadData 失败时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.reject(new Error('load failed')));
        const rejections = [];
        const onRejection = (reason) => rejections.push(reason);
        // A loadData rejection is rethrown to the caller by design; catch it so it does not fail the test
        process.on('unhandledRejection', onRejection);
        try {
            render(<Tree loadData={loadData} motion={false} treeData={[{ label: 'Async', value: 'async', key: 'async' }]} />);
            await userEvent.click(getExpandIcon(getNode('async')));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getNode('async').querySelector(`.${optionCls}-spin-icon`)).toBeNull());
            await userEvent.click(getExpandIcon(getNode('async')));
            await userEvent.click(getExpandIcon(getNode('async')));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        } finally {
            await new Promise((resolve) => setTimeout(resolve, 0));
            process.off('unhandledRejection', onRejection);
        }
    });

    it('leafOnly 只上报叶子节点的值', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(<Tree multiple defaultExpandAll leafOnly treeData={treeData} onChange={onChange} />);
        await userEvent.click(getNode('zhongguo').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai']);
        await userEvent.click(getNode('riben').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai', 'Dongjing', 'Daban']);
        expect(isChecked('yazhou')).toBe(true);
    });

    it('受控 value 在重新渲染时更新选中状态', () => {
        const { rerender } = render(<Tree value="Beijing" defaultExpandAll treeData={treeData} />);
        expect(getNode('beijing')).toHaveClass(selectedCls);
        rerender(<Tree value="Meiguo" defaultExpandAll treeData={treeData} />);
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
        expect(getNode('meiguo')).toHaveClass(selectedCls);
    });

    it('受控多选值在重新渲染时更新勾选状态', () => {
        const { rerender } = render(<Tree multiple value={['Beijing']} defaultExpandAll treeData={treeData} />);
        expect(isChecked('beijing')).toBe(true);
        expect(isHalfChecked('zhongguo')).toBe(true);
        rerender(<Tree multiple value={['Beijing', 'Shanghai']} defaultExpandAll treeData={treeData} />);
        expect(isChecked('zhongguo')).toBe(true);
        expect(isHalfChecked('yazhou')).toBe(true);
    });

    it('受控 expandedKeys 变化时，新增子节点在同一次提交中播放动画', async () => {
        const wrapperCls = `${BASE_CLASS_PREFIX}-collapsible-wrapper`;
        const { rerender } = render(<Tree expandedKeys={[]} treeData={treeData} />);
        expect(document.querySelector(`.${wrapperCls}`)).toBeNull();
        rerender(<Tree expandedKeys={['yazhou']} treeData={treeData} />);
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(document.querySelector(`.${wrapperCls}`)).not.toBeNull();
        await waitFor(() => expect(getNode('zhongguo')).not.toBeNull());
        expect(getNode('zhongguo').closest(`.${wrapperCls}`)).not.toBeNull();
        expect(getNode('yazhou').closest(`.${wrapperCls}`)).toBeNull();
    });

    it('搜索时受控 expandedKeys 跟随 prop', () => {
        const ref = createRef<TreeHandle>();
        const { rerender } = render(<Tree ref={ref} expandedKeys={['beimeizhou']} filterTreeNode treeData={treeData} />);
        act(() => ref.current.search('东京'));
        expect(getNode('beimeizhou')).not.toHaveClass(collapsedCls);
        expect(getNode('meiguo')).not.toBeNull();
        expect(getNode('riben')).toBeNull();
        rerender(<Tree ref={ref} autoExpandParent expandedKeys={['riben']} filterTreeNode treeData={treeData} />);
        expect(getNode('dongjing')).not.toBeNull();
        expect(getNode('meiguo')).toBeNull();
    });

    it('搜索时 treeData 变化，保留搜索过滤', () => {
        const ref = createRef<TreeHandle>();
        const { rerender } = render(<Tree ref={ref} filterTreeNode showFilteredOnly treeData={treeData} />);
        act(() => ref.current.search('东京'));
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        const nextData = [...treeData, { label: '东京湾', value: 'Bay', key: 'bay' }];
        rerender(<Tree ref={ref} filterTreeNode showFilteredOnly treeData={nextData} />);
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing', 'bay']);
    });

    it('labelEllipsis、showLine 和 expandIcon', async () => {
        const { rerender } = render(<Tree defaultExpandAll labelEllipsis showLine treeData={treeData} />);
        expect(getNode('yazhou')).toHaveClass(`${optionCls}-ellipsis`);
        expect(document.querySelector(`.${optionCls}-indent-show-line`)).not.toBeNull();
        expect(getNode('beijing').querySelector(`.${optionCls}-switcher-leaf-line`)).not.toBeNull();

        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        rerender(
            <Tree
                expandIcon={({ onClick, className, expanded }) => (
                    <button type="button" className={className} onClick={onClick}>
                        {expanded ? 'close' : 'open'}
                    </button>
                )}
                motion={false}
                treeData={treeData}
                onExpand={onExpand}
            />
        );
        expect(getExpandIcon(getNode('yazhou'))).toHaveTextContent('close');
        await userEvent.click(getExpandIcon(getNode('beimeizhou')));
        expect(onExpand).toHaveBeenLastCalledWith(expect.not.arrayContaining(['beimeizhou']), expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'beimeizhou' }) }));
        expect(getExpandIcon(getNode('beimeizhou'))).toHaveTextContent('open');

        rerender(<Tree expandIcon={<span className="custom">v</span>} motion={false} treeData={treeData} />);
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
        render(<Tree loadData={loadData} loadedKeys={['a']} motion={false} treeData={data} onLoad={onLoad} />);
        expect(getExpandIcon(getNode('a'))).toBeNull();
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad).toHaveBeenCalledWith(new Set(['a', 'b']), expect.objectContaining({ key: 'b' }));
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(getExpandIcon(getNode('b'))).not.toBeNull();
    });

    it('列表标记为 tree，并带有多选状态；为空时不带多选状态', () => {
        const { rerender } = render(<Tree multiple treeData={treeData} />);
        const list = document.querySelector(`.${prefix}-option-list`);
        expect(list).toHaveAttribute('role', 'tree');
        expect(list).toHaveAttribute('aria-multiselectable', 'true');
        rerender(<Tree treeData={[]} />);
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
            const drag = (type, key, clientY) => {
                const event = createEvent[type](getNode(key));
                Object.defineProperty(event, 'clientY', { value: clientY });
                fireEvent(getNode(key), event);
            };
            const onDrop = vi.fn<NonNullable<TreeProps['onDrop']>>();
            render(<Tree draggable treeData={treeData} onDrop={onDrop} />);
            fireEvent.dragStart(getNode('yazhou'));
            drag('dragEnter', 'beimeizhou', 15);
            // dragenter applies its state after a macrotask
            await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
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
            const [keys, setKeys] = useState([]);
            return (
                <>
                    <span data-testid="keys">{keys.join(',')}</span>
                    <Tree motion={false} treeData={treeData} onExpand={(expanded) => setKeys(expanded)} />
                </>
            );
        }
        render(<Demo />);
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
        const ref = createRef<TreeHandle>();
        const data = [
            { label1: 'Apple', value: 'a', key: 'a' },
            { label1: 'Banana', value: 'b', key: 'b' },
        ];
        const props = { filterTreeNode: true, showFilteredOnly: true, keyMaps: { label: 'label1' }, motion: false };
        const { rerender } = render(<Tree ref={ref} {...props} treeData={data} />);
        act(() => ref.current.search('Ban'));
        expect(getVisibleKeys()).toEqual(['b']);
        rerender(<Tree ref={ref} {...props} treeData={[...data, { label1: 'Banner', value: 'c', key: 'c' }]} />);
        expect(getVisibleKeys()).toEqual(['b', 'c']);
    });

    it('逐个勾选兄弟节点后，全选的父节点 aria-checked 为 true', async () => {
        render(<Tree multiple defaultExpandAll motion={false} treeData={treeData} />);
        await userEvent.click(getNode('beijing'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'mixed');
        await userEvent.click(getNode('shanghai'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'true');
        expect(isHalfChecked('zhongguo')).toBe(false);
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('点击半选的父节点后，父节点变为全选而不再半选', async () => {
        render(<Tree multiple defaultExpandAll motion={false} treeData={treeData} />);
        await userEvent.click(getNode('beijing'));
        await userEvent.click(getNode('zhongguo'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'true');
        expect(getNode('beijing')).toHaveAttribute('aria-checked', 'true');
        expect(getNode('shanghai')).toHaveAttribute('aria-checked', 'true');
    });

    it('受控 expandedKeys 的树在搜索后清空，保持控制方给出的展开状态', () => {
        const ref = createRef<TreeHandle>();
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        render(<Tree ref={ref} value="Beijing" expandedKeys={[]} filterTreeNode motion={false} treeData={treeData} onExpand={onExpand} />);
        act(() => ref.current.search('北'));
        act(() => ref.current.search(''));
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('非受控树选中分支节点后搜索再清空，该分支保持收起', () => {
        const ref = createRef<TreeHandle>();
        render(<Tree ref={ref} defaultValue="Zhongguo" filterTreeNode motion={false} treeData={treeData} />);
        act(() => ref.current.search('北'));
        act(() => ref.current.search(''));
        expect(getVisibleKeys()).not.toContain('beijing');
    });

    it('拖过收起的节点后立即 drop，自动展开不会在拖拽结束后触发', async () => {
        const onDragEnter = vi.fn<NonNullable<TreeProps['onDragEnter']>>();
        render(<Tree draggable motion={false} treeData={treeData} onDragEnter={onDragEnter} />);
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.dragEnter(getNode('beimeizhou'));
        fireEvent.drop(getNode('beimeizhou'));
        await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
        expect(getNode('meiguo')).toBeNull();
        expect(onDragEnter).not.toHaveBeenCalled();
    });

    it('treeDataSimpleJson 的键含点号时 onChange 收到嵌套对象', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(<Tree defaultExpandAll motion={false} treeDataSimpleJson={{ 'v1.2': { a: 'x' } }} onChange={onChange} />);
        await userEvent.click(getNode('v1.2_SEMI_TREE_SPLIT_a'));
        expect(onChange).toHaveBeenCalledWith({ 'v1.2': { a: 'x' } });
    });
});

describe('Tree 节点数据与行状态', () => {
    it('节点数据带 expanded 字段时仍能展开，onExpand 收到 expanded: true', async () => {
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        render(<Tree motion={false} treeData={[{ key: 'a', label: 'A', value: 'a', expanded: true, children: [{ key: 'b', label: 'B', value: 'b' }] }]} onExpand={onExpand} />);
        await userEvent.click(getExpandIcon(getNode('a')));
        expect(screen.getByRole('treeitem', { name: 'B' })).toBeInTheDocument();
        expect(onExpand).toHaveBeenCalledWith(['a'], expect.objectContaining({ expanded: true }));
    });

    it('节点数据带 checked 或 selected 字段时仍能勾选、选中', async () => {
        const onChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        const { rerender } = render(<Tree multiple treeData={[{ key: 'a', label: 'A', value: 'a', checked: true }]} onChange={onChange} />);
        await userEvent.click(getNode('a'));
        expect(onChange).toHaveBeenLastCalledWith(['a']);
        rerender(<Tree treeData={[{ key: 'a', label: 'A', value: 'a', selected: true }]} onChange={onChange} />);
        await userEvent.click(getNode('a'));
        expect(onChange).toHaveBeenLastCalledWith('a');
        expect(getNode('a')).toHaveAttribute('aria-selected', 'true');
    });

    it('节点数据的 level、loading、empty 字段不改变行的层级、加载状态与渲染', () => {
        render(<Tree treeData={[{ key: 'a', label: 'A', value: 'a', level: 3, loading: true, empty: true }]} />);
        const row = screen.getByRole('treeitem', { name: 'A' });
        expect(row).toHaveAttribute('aria-level', '1');
        expect(row).not.toHaveAttribute('aria-busy');
    });

    it('keyMaps.children 映射到其他字段时，节点自带的 children 业务字段不让叶子变成分支', () => {
        render(<Tree keyMaps={{ children: 'items' }} treeData={[{ key: 'a', label: 'A', value: 'a', children: [{ key: 'x', label: 'X', value: 'x' }] }]} />);
        expect(getNode('a')).not.toHaveAttribute('aria-expanded');
        expect(getExpandIcon(getNode('a'))).toBeNull();
    });

    it('单选树 defaultValue={0} 选中值为 0 的节点，受控 value={0} 挂载时展开其祖先', () => {
        const flat = [
            { key: 'a', label: 'A', value: 0 },
            { key: 'b', label: 'B', value: 1 },
        ];
        const { unmount } = render(<Tree defaultValue={0} treeData={flat} />);
        expect(getNode('a')).toHaveAttribute('aria-selected', 'true');
        unmount();
        render(<Tree value={0} motion={false} treeData={[{ key: 'p', label: 'P', value: 'p', children: [{ key: 'c', label: 'C', value: 0 }] }]} />);
        expect(getNode('c')).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Tree 搜索', () => {
    it('搜索中收起祖先后，父组件以新引用传入同结构的 treeData，祖先保持收起', async () => {
        const ref = createRef<TreeHandle>();
        function Demo() {
            const [, setCount] = useState(0);
            // a new reference on every render, as with treeData built inline
            return <Tree ref={ref} filterTreeNode motion={false} treeData={treeData.map((node) => ({ ...node }))} onExpand={() => setCount((count) => count + 1)} />;
        }
        render(<Demo />);
        act(() => ref.current.search('北京'));
        expect(getNode('beijing')).not.toBeNull();
        await userEvent.click(getExpandIcon(getNode('zhongguo')));
        expect(getNode('beijing')).toBeNull();
        expect(getNode('zhongguo')).toHaveAttribute('aria-expanded', 'false');
    });

    it('受控 expandedKeys 加 showFilteredOnly 时，搜索中 treeData 新增的匹配项会显示', () => {
        const ref = createRef<TreeHandle>();
        const data = [
            { label: 'Apple', value: 'a', key: 'a' },
            { label: 'Banana', value: 'b', key: 'b' },
        ];
        const props = { filterTreeNode: true, showFilteredOnly: true, expandedKeys: [], motion: false };
        const { rerender } = render(<Tree ref={ref} {...props} treeData={data} />);
        act(() => ref.current.search('Ban'));
        expect(getVisibleKeys()).toEqual(['b']);
        rerender(<Tree ref={ref} {...props} treeData={[...data, { label: 'Banner', value: 'c', key: 'c' }]} />);
        expect(getVisibleKeys()).toEqual(['b', 'c']);
    });

    it('默认搜索不匹配元素标签转成的文本，数字标签命中时高亮', () => {
        const ref = createRef<TreeHandle>();
        const data = [
            { key: 'a', label: <span>Alpha</span>, value: 'a' },
            { key: 'b', label: 'object', value: 'b' },
            { key: 'c', label: 1001, value: 'c' },
        ];
        render(<Tree ref={ref} filterTreeNode motion={false} showFilteredOnly treeData={data} />);
        act(() => ref.current.search('obj'));
        expect(getVisibleKeys()).toEqual(['b']);
        act(() => ref.current.search('10'));
        expect(getVisibleKeys()).toEqual(['c']);
        expect(getNode('c').querySelector(`.${optionCls}-highlight`)).toHaveTextContent('10');
    });
});

describe('Tree 拖拽', () => {
    it('拖过收起的节点后拖出树，该节点不会被自动展开', async () => {
        render(<Tree draggable motion={false} treeData={treeData} />);
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.dragEnter(getNode('beimeizhou'));
        await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
        fireEvent.dragLeave(getNode('beimeizhou'));
        // the auto-expand delay is 400ms
        await act(() => new Promise((resolve) => setTimeout(resolve, 450)));
        expect(getNode('meiguo')).toBeNull();
    });

    it('树外拖入（没有 dragStart）的 drop 不触发 onDrop', () => {
        const onDrop = vi.fn<NonNullable<TreeProps['onDrop']>>();
        render(<Tree draggable treeData={treeData} onDrop={onDrop} />);
        fireEvent.dragOver(getNode('beimeizhou'));
        fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).not.toHaveBeenCalled();
    });

    it('draggable 时 renderFullLabel 元素上的 ref 仍指向该元素', () => {
        const rowRef = createRef<HTMLLIElement>();
        const onDragStart = vi.fn<NonNullable<TreeProps['onDragStart']>>();
        render(
            <Tree
                draggable
                treeData={treeData}
                renderFullLabel={({ className, data, style }) => (
                    <li ref={data.key === 'yazhou' ? rowRef : undefined} className={className} style={style}>
                        {data.label}
                    </li>
                )}
                onDragStart={onDragStart}
            />
        );
        const row = screen.getByRole('treeitem', { name: '亚洲' });
        expect(rowRef.current).toBe(row);
        fireEvent.dragStart(row);
        expect(onDragStart).toHaveBeenCalledWith(expect.objectContaining({ node: expect.objectContaining({ key: 'yazhou' }) }));
    });
});

describe('Tree 展开与加载', () => {
    it('expandAction="click" 加 loadData 时，点击 isLeaf 叶子不加载、不触发 onExpand', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const onExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        render(<Tree expandAction="click" loadData={loadData} treeData={[{ key: 'a', label: 'A', value: 'a', isLeaf: true }]} onExpand={onExpand} />);
        await userEvent.click(getNode('a'));
        expect(loadData).not.toHaveBeenCalled();
        expect(onExpand).not.toHaveBeenCalled();
        expect(getNode('a')).not.toHaveAttribute('aria-busy');
    });

    it('加载中的节点名称不含加载图标的名称，并标为 aria-busy', async () => {
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => new Promise(() => {}));
        render(<Tree loadData={loadData} treeData={[{ key: 'a', label: 'A', value: 'a' }]} />);
        await userEvent.click(getExpandIcon(getNode('a')));
        expect(screen.getByRole('treeitem', { name: 'A' })).toHaveAttribute('aria-busy', 'true');
    });
});

describe('Tree 焦点', () => {
    it('指针点击多选树的复选框或虚拟树的行后，树本身持焦，方向键仍然有效', async () => {
        const { unmount } = render(<Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 30, height: 300 }} />);
        await userEvent.click(getNode('zhongguo'));
        expect(screen.getByRole('tree')).toHaveFocus();
        unmount();
        render(<Tree multiple treeData={treeData} />);
        await userEvent.click(document.querySelector('input[type="checkbox"]'));
        const tree = screen.getByRole('tree');
        expect(tree).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(document.getElementById(tree.getAttribute('aria-activedescendant'))).toHaveAttribute('data-key', 'beimeizhou');
    });
});

describe('Tree 空状态与属性落点', () => {
    it('emptyContent 为 null 时不渲染空状态', () => {
        const { container } = render(<Tree emptyContent={null} treeData={[]} />);
        expect(container.querySelector(`.${prefix}-option-list`)).toBeNull();
    });

    it('tabIndex 落在 role="tree" 元素上，Tooltip 包裹时不多出 Tab 停留点', () => {
        const { container, rerender } = render(<Tree tabIndex={-1} treeData={treeData} />);
        expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '-1');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
        rerender(
            <Tooltip content="tip">
                <Tree treeData={treeData} />
            </Tooltip>
        );
        expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '0');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
    });
});
