import { createSignal } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Cascader, { type CascaderData, type CascaderProps, type Value } from '..';
import Button from '../../button';

const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;
const treeData: CascaderData[] = [
    {
        label: '浙江省',
        value: 'zhejiang',
        children: [{ label: '杭州市', value: 'hangzhou', children: [{ label: '西湖区', value: 'xihu' }] }],
    },
];
const center = (rect: DOMRect) => rect.top + rect.height / 2;

describe('Cascader（浏览器）', () => {
    it.each(['small', 'default', 'large'] as const)('修复 #1468：单选 Cascader 的搜索输入框在尺寸 %s 下垂直居中', async (size) => {
        const { container } = render(() => <Cascader style={{ width: '300px' }} filterTreeNode leafOnly motion={false} size={size} treeData={treeData} />);
        const trigger = container.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
        await userEvent.click(trigger);
        const getInput = () => container.querySelector<HTMLElement>(`.${prefixCls}-selection input`);
        await waitFor(() => expect(getInput()).not.toBeNull());
        const input = getInput() as HTMLElement;
        const wrapper = (container.querySelector(`.${prefixCls}-search-wrapper`) as HTMLElement).getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();
        expect(input).toHaveFocus();
        expect(wrapper.top).toBeGreaterThanOrEqual(triggerRect.top);
        expect(wrapper.bottom).toBeLessThanOrEqual(triggerRect.bottom);
        expect(Math.abs(center(input.getBoundingClientRect()) - center(triggerRect))).toBeLessThanOrEqual(1);
    });

    // the search input is the focus target and draws nothing, so the trigger shows the focus border a plain one gets
    it('搜索输入框获得键盘焦点时显示触发器焦点边框', async () => {
        render(() => (
            <>
                <Cascader style={{ width: '300px' }} aria-label="plain" treeData={treeData} />
                <Cascader style={{ width: '300px' }} aria-label="searchable" multiple filterTreeNode treeData={treeData} />
            </>
        ));
        const plain = screen.getByRole('combobox', { name: 'plain' });
        await tabTo(plain);
        const focusBorder = getComputedStyle(plain).borderColor;
        const input = screen.getByRole('combobox', { name: 'searchable' });
        expect(input.tagName).toBe('INPUT');
        await tabTo(input);
        expect(getComputedStyle(input.closest(`.${prefixCls}`) as HTMLElement).borderColor).toBe(focusBorder);
    });

    it('修复 #2967：可搜索多选 Cascader 中的长标签在触发器内被截断', () => {
        const { container } = render(() => <Cascader style={{ width: '200px' }} defaultValue={['1']} multiple filterTreeNode treeData={[{ label: '这是一个超长的用于测试的选项这是一个超长的用于测试的选项', value: '1' }]} />);
        const trigger = (container.querySelector(`.${prefixCls}`) as HTMLElement).getBoundingClientRect();
        const tag = screen.getByText(/^这是一个超长/).closest(`.${BASE_CLASS_PREFIX}-tag`) as HTMLElement;
        const content = tag.querySelector(`.${BASE_CLASS_PREFIX}-tag-content`) as HTMLElement;
        expect(tag.getBoundingClientRect().right).toBeLessThanOrEqual(trigger.right);
        expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);
    });
});

const nodeTreeData: CascaderData[] = [
    {
        label: 'Node1',
        value: '0-0',
        children: [
            { label: 'Child Node1', value: '0-0-1', disabled: true },
            { label: 'Child Node2', value: '0-0-2' },
        ],
    },
    { label: 'Node2', value: '0-1' },
];
const regionTreeData: CascaderData[] = [
    {
        label: '亚洲',
        value: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'zhongguo',
                children: [
                    { label: '北京', value: 'beijing' },
                    { label: '上海', value: 'shanghai' },
                ],
            },
            { label: '日本', value: 'riben', disabled: true, children: [{ label: '大阪', value: 'daban' }] },
        ],
    },
    {
        label: '北美洲',
        value: 'beimeizhou',
        children: [
            { label: '美国', value: 'meiguo' },
            { label: '加拿大', value: 'jianada' },
        ],
    },
];
const zhejiangTreeData: CascaderData[] = [
    {
        label: '浙江省',
        value: 'zhejiang',
        children: [
            {
                label: '杭州市',
                value: 'hangzhou',
                children: [
                    { label: '西湖区', value: 'xihu' },
                    { label: '萧山区', value: 'xiaoshan' },
                    { label: '临安区', value: 'linan' },
                ],
            },
            {
                label: '宁波市',
                value: 'ningbo',
                children: [
                    { label: '海曙区', value: 'haishu' },
                    { label: '江北区', value: 'jiangbei' },
                ],
            },
        ],
    },
];

const getTrigger = () => document.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
const getPopover = () => document.querySelector<HTMLElement>(`.${prefixCls}-popover`);
async function getOption(label: string) {
    await waitFor(() => expect(getPopover()).not.toBeNull());
    return within(getPopover() as HTMLElement)
        .getByText(label)
        .closest(`.${prefixCls}-option`) as HTMLElement;
}
const clickOption = async (label: string) => userEvent.click(await getOption(label));
const clickCheckbox = async (label: string) => userEvent.click((await getOption(label)).querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
const getTagTexts = () => [...document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)].map((tag) => tag.textContent);
const getSearchText = () => document.querySelector(`.${prefixCls}-search-wrapper span`)?.textContent;
const activeOption = (host: HTMLElement, root: Document | ShadowRoot = document) => root.getElementById(host.getAttribute('aria-activedescendant') as string) as HTMLElement;
const findClearButton = () =>
    waitFor(() => {
        const button = document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
        expect(button).not.toBeNull();
        return button as HTMLElement;
    });

function renderInShadow(ui: () => ReturnType<typeof Cascader>, withStyles: boolean) {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    if (withStyles) {
        // the list scrolls only under the component styles, which the document holds
        shadow.append(...Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'), (node) => node.cloneNode(true)));
    }
    const mount = document.createElement('div');
    shadow.append(mount);
    const view = render(ui, { container: mount });
    return {
        shadow,
        cleanup: () => {
            view.unmount();
            host.remove();
        },
    };
}

describe('cascader', () => {
    it('单选时清空', async () => {
        render(() => <Cascader style={{ width: '300px' }} filterTreeNode showClear treeData={nodeTreeData} />);
        await userEvent.click(getTrigger());
        await clickOption('Node1');
        await clickOption('Child Node2');
        await waitFor(() => expect(getSearchText()).toBe('Node1 / Child Node2'));
        await userEvent.hover(getTrigger());
        await userEvent.click(await findClearButton());
        expect(getSearchText()).not.toContain('Child Node2');
    });

    it('清除按钮在悬停和键盘聚焦时替换箭头，Tab 聚焦后 Enter 可清空', async () => {
        render(() => <Cascader style={{ width: '300px' }} defaultValue={['zhejiang', 'hangzhou', 'xihu']} showClear treeData={treeData} />);
        const clear = () => document.querySelector(`.${prefixCls}-clearbtn`);
        const arrow = () => document.querySelector(`.${prefixCls}-arrow`);
        expect(clear()).not.toBeVisible();
        expect(arrow()).toBeVisible();
        await userEvent.hover(getTrigger());
        expect(clear()).toBeVisible();
        expect(arrow()).not.toBeVisible();
        await userEvent.unhover(getTrigger());
        expect(clear()).not.toBeVisible();

        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        const button = screen.getByRole('button', { name: '清空已选值' });
        expect(button).toBeVisible();
        await userEvent.keyboard('{Tab}');
        expect(button).toHaveFocus();
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(clear()).toBeNull());
        expect(trigger).toHaveFocus();
        expect(screen.queryByRole('tree')).toBeNull();
    });

    it('可搜索或多选时点击清空', async () => {
        const { unmount } = render(() => <Cascader style={{ width: '300px' }} filterTreeNode showClear treeData={nodeTreeData} />);
        await userEvent.click(getTrigger());
        await clickOption('Node1');
        await clickOption('Child Node2');
        await waitFor(() => expect(getSearchText()).toBe('Node1 / Child Node2'));
        await userEvent.hover(getTrigger());
        await userEvent.click(await findClearButton());
        await waitFor(() => expect(getSearchText()).not.toContain('Child Node2'));
        unmount();

        render(() => <Cascader style={{ width: '300px' }} multiple showClear treeData={nodeTreeData} />);
        await userEvent.click(getTrigger());
        await clickCheckbox('Node1');
        await clickCheckbox('Node2');
        await waitFor(() => expect(getTagTexts()).toEqual(['Node1', 'Node2']));
        await userEvent.hover(getTrigger());
        await userEvent.click(await findClearButton());
        await waitFor(() => expect(getTagTexts()).toEqual([]));
    });

    it('多选关闭', async () => {
        render(() => <Cascader style={{ width: '300px' }} multiple motion={false} treeData={nodeTreeData} />);
        await userEvent.click(getTrigger());
        await clickCheckbox('Node1');
        expect(getTagTexts()).not.toEqual([]);
        await userEvent.click(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(getTagTexts()).toEqual([]);
    });

    it('placeholder 变化', async () => {
        function Demo() {
            const [searchable, setSearchable] = createSignal(false);
            return (
                <>
                    <Button onClick={() => setSearchable(!searchable())}>Toggle</Button>
                    <Cascader style={{ width: '300px' }} placeholder="Please select" filterTreeNode={searchable()} searchPlaceholder="Search something" showClear treeData={regionTreeData} />
                </>
            );
        }
        render(() => <Demo />);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent('Please select');
        await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
        expect(getSearchText()).toBe('Search something');
    });

    it('加载数据', async () => {
        function Demo() {
            const [data, setData] = createSignal<CascaderData[]>([
                { label: 'Node1', value: '0-0' },
                { label: 'Node2', value: '0-1' },
                { label: 'Node3', value: '0-2', isLeaf: true },
            ]);
            const loadData = (selectedOpt: CascaderData[]) => {
                const { label, value, children } = selectedOpt[selectedOpt.length - 1];
                return new Promise<void>((resolve) => {
                    if (children) {
                        resolve();
                        return;
                    }
                    setTimeout(() => {
                        setData((origin) =>
                            origin.map((node) =>
                                node.value === value
                                    ? {
                                          ...node,
                                          children: [1, 2].map((i) => ({
                                              label: `${label as string} - ${i}`,
                                              value: `${label as string}-${i}`,
                                              isLeaf: selectedOpt.length > 1,
                                          })),
                                      }
                                    : node
                            )
                        );
                        resolve();
                    }, 50);
                });
            };
            return <Cascader style={{ width: '300px' }} loadData={loadData} treeData={data()} />;
        }
        render(() => <Demo />);
        await userEvent.click(getTrigger());
        await clickOption('Node1');
        await waitFor(() => expect(within(getPopover() as HTMLElement).getByText('Node1 - 1')).toBeInTheDocument());
    });

    it('超出限制时', async () => {
        const onExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        const renderCascader = (props: CascaderProps<true>) =>
            render(() => (
                <Cascader
                    style={{ width: '300px' }}
                    defaultValue={[
                        ['zhejiang', 'ningbo', 'haishu'],
                        ['zhejiang', 'hangzhou', 'xihu'],
                    ]}
                    multiple
                    treeData={zhejiangTreeData}
                    onExceed={onExceed}
                    {...props}
                />
            ));
        // Open from the arrow: a click on the trigger centre lands on a tag, which stops propagation
        const open = () => userEvent.click(document.querySelector(`.${prefixCls}-arrow`) as HTMLElement);

        // autoMergeValue: the default value already exceeds max, so it may only shrink
        const { unmount } = renderCascader({ max: 1 });
        expect(getTagTexts()).toEqual(['海曙区', '西湖区']);
        await open();
        await clickOption('浙江省');
        await clickOption('杭州市');
        await clickCheckbox('萧山区');
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['海曙区', '西湖区']);
        unmount();

        renderCascader({ max: 2, autoMergeValue: false });
        await open();
        await clickOption('浙江省');
        await clickCheckbox('宁波市');
        expect(onExceed).toHaveBeenCalledTimes(2);
        expect(getTagTexts()).toEqual(['海曙区', '西湖区']);
    });

    it('默认值不存在时', () => {
        render(() => <Cascader style={{ width: '300px' }} defaultValue="yazhou not exist" placeholder="Please select" changeOnSelect filterTreeNode treeData={regionTreeData} />);
        expect(getSearchText()).toBe('yazhou not exist');
    });

    it('多选 onChangeWithObject 且 value=undefined', async () => {
        function Demo() {
            const [value, setValue] = createSignal<Value>();
            return <Cascader style={{ width: '300px' }} multiple placeholder="请选择所在地区" value={value()} treeData={regionTreeData} onChange={setValue} onChangeWithObject />;
        }
        render(() => <Demo />);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent('请选择所在地区');
        await userEvent.click(getTrigger());
        await clickCheckbox('亚洲');
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('value 为数字类型', async () => {
        render(() => (
            <Cascader
                style={{ width: '300px' }}
                multiple
                value={[[39]]}
                treeData={[
                    {
                        label: '奖励',
                        value: 2,
                        children: [
                            { label: '短期项目激励', value: 3 },
                            { label: '专项激励', value: 8 },
                        ],
                    },
                    { label: '补结', value: 39, children: [] },
                    { label: '补扣', value: 40, children: [{ label: 'A', value: 100 }] },
                ]}
            />
        ));
        await userEvent.click(getTrigger());
        const checkbox = (await getOption('补结')).querySelector(`.${BASE_CLASS_PREFIX}-checkbox`);
        expect(checkbox).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('Esc 关闭面板', async () => {
        render(() => <Cascader style={{ width: '300px' }} filterTreeNode motion={false} treeData={regionTreeData} />);
        await userEvent.click(getTrigger());
        await userEvent.keyboard('中');
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-popover`)).toHaveLength(1));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('无关事件', async () => {
        function Demo() {
            const [value, setValue] = createSignal<Value>([['yazhou'], ['beimeizhou', 'meiguo']]);
            return <Cascader style={{ width: '400px' }} multiple value={value()} checkRelation="unRelated" filterTreeNode treeData={regionTreeData} onChange={setValue} />;
        }
        render(() => <Demo />);
        expect(getTagTexts()).toEqual(['亚洲', '美国']);
        await userEvent.click(getTrigger());
        await clickCheckbox('北美洲');
        expect(getTagTexts()).toEqual(['亚洲', '美国', '北美洲']);
    });

    it('+N 指示器显示主题焦点环', async () => {
        const { container } = render(() => (
            <Cascader
                style={{ width: '300px' }}
                defaultValue={[
                    ['yazhou', 'zhongguo', 'beijing'],
                    ['beimeizhou', 'meiguo'],
                ]}
                multiple
                maxTagCount={1}
                showRestTagsPopover
                treeData={regionTreeData}
            />
        ));
        const plusN = container.querySelector(`.${prefixCls}-selection-n`) as HTMLElement;
        await tabTo(plusN);
        expectThemeFocusRing(plusN);
    });

    it('方向键移动到的选项显示主题焦点环，选中后焦点仍留在触发器上', async () => {
        render(() => <Cascader style={{ width: '300px' }} motion={false} treeData={treeData} />);
        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await screen.findByRole('tree');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeOption(trigger)).toMatchTextContent('浙江省'));
        expectThemeFocusRing(activeOption(trigger));
        await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        expect(trigger).toMatchTextContent('西湖区');
        expect(trigger).toHaveFocus();
    });

    it('鼠标点选叶子关闭弹层后，焦点仍在触发器上', async () => {
        render(() => <Cascader style={{ width: '300px' }} motion={false} treeData={treeData} />);
        const trigger = screen.getByRole('combobox');
        await userEvent.click(trigger);
        await clickOption('浙江省');
        await clickOption('杭州市');
        await clickOption('西湖区');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('鼠标点开分支后按 Esc 关闭，焦点仍在触发器上', async () => {
        render(() => <Cascader style={{ width: '300px' }} motion={false} treeData={treeData} />);
        const trigger = screen.getByRole('combobox');
        await userEvent.click(trigger);
        await clickOption('浙江省');
        expect(trigger).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('关闭时按 End 打开，当前项滚动到列表可视区', async () => {
        const leaves = Array.from({ length: 30 }, (_, i) => ({ label: `区 ${i}`, value: `${i}` }));
        render(() => <Cascader style={{ width: '300px' }} motion={false} treeData={leaves} />);
        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        await userEvent.keyboard('{End}');
        const option = await waitFor(() => {
            const el = activeOption(trigger);
            expect(el).toMatchTextContent('区 29');
            return el;
        });
        const list = option.closest<HTMLElement>(`.${prefixCls}-option-list`) as HTMLElement;
        await waitFor(() => expect(option.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1));
    });

    it('ShadowRoot 内关闭时按 End 打开，当前项滚动到列表可视区', async () => {
        const leaves = Array.from({ length: 30 }, (_, i) => ({ label: `区 ${i}`, value: `${i}` }));
        const { shadow, cleanup } = renderInShadow(() => <Cascader style={{ width: '300px' }} motion={false} treeData={leaves} />, true);
        try {
            const trigger = shadow.querySelector<HTMLElement>('[role="combobox"]') as HTMLElement;
            trigger.focus();
            await userEvent.keyboard('{End}');
            const option = await waitFor(() => {
                const el = activeOption(trigger, shadow);
                expect(el).toMatchTextContent('区 29');
                return el;
            });
            const list = option.closest<HTMLElement>(`.${prefixCls}-option-list`) as HTMLElement;
            await waitFor(() => expect(option.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1));
        } finally {
            cleanup();
        }
    });

    it('ShadowRoot 内可搜索的 Cascader 按 Escape 关闭后，焦点回到触发器', async () => {
        const { shadow, cleanup } = renderInShadow(() => <Cascader style={{ width: '300px' }} filterTreeNode motion={false} treeData={treeData} />, false);
        try {
            const trigger = shadow.querySelector<HTMLElement>('[role="combobox"]') as HTMLElement;
            await userEvent.click(trigger);
            await waitFor(() => expect(shadow.activeElement?.tagName).toBe('INPUT'));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(shadow.activeElement).toBe(trigger));
        } finally {
            cleanup();
        }
    });

    it('大列表输入后立即按 Enter，aria-activedescendant 不指向 Enter 不会选中的旧选项', async () => {
        const leaves = Array.from({ length: 5000 }, (_, i) => ({ label: `Option ${i}`, value: `${i}` }));
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        render(() => <Cascader style={{ width: '300px' }} filterTreeNode motion={false} treeData={leaves} onChange={onChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        const input = screen.getByRole('combobox');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'));
        let activeAtEnter: string | null | undefined;
        const record = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const id = (e.target as HTMLElement).getAttribute('aria-activedescendant');
                activeAtEnter = id ? document.getElementById(id)?.textContent : undefined;
            }
        };
        document.addEventListener('keydown', record, true);
        try {
            await userEvent.keyboard('1{Enter}');
        } finally {
            document.removeEventListener('keydown', record, true);
        }
        // the keyword resets the keyboard row, so Enter has nothing to choose and nothing may look chosen
        expect(activeAtEnter).toBeUndefined();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('虚拟搜索列表滚动到按键移动到的选项，且不新增 Tab 停靠点', async () => {
        const manyLeaves = Array.from({ length: 100 }, (_, i) => ({ label: `区 ${i}`, value: `${i}` }));
        render(() => (
            <>
                <Cascader style={{ width: '300px' }} filterTreeNode motion={false} treeData={[{ label: '城市', value: 'city', children: manyLeaves }]} virtualizeInSearch={{ height: 144, itemSize: 36 }} />
                <Button>after</Button>
            </>
        ));
        await userEvent.click(screen.getByRole('combobox'));
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        await userEvent.type(input, '区');
        const listbox = await screen.findByRole('listbox');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(activeOption(input)).toMatchTextContent('区 99'));
        expect(activeOption(input).getBoundingClientRect().bottom).toBeLessThanOrEqual(listbox.getBoundingClientRect().bottom);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        await waitFor(() => expect(listbox).not.toBeInTheDocument());
    });

    it('虚拟搜索列表按默认高度显示时，最后一项与普通列表一样带选项内边距且在下拉框内可见', async () => {
        const manyLeaves = Array.from({ length: 100 }, (_, i) => ({ label: `区 ${i}`, value: `${i}` }));
        render(() => <Cascader style={{ width: '300px' }} filterTreeNode motion={false} treeData={[{ label: '城市', value: 'city', children: manyLeaves }]} virtualizeInSearch={{ itemSize: 36 }} />);
        await userEvent.click(screen.getByRole('combobox'));
        const input = screen.getByRole('combobox');
        await userEvent.type(input, '区');
        const listbox = await screen.findByRole('listbox');
        // the virtual rows sit in the list as its items, so `ul > li` gives them the option padding
        const [first] = within(listbox).getAllByRole('option');
        expect(getComputedStyle(first).paddingTop).not.toBe('0px');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(activeOption(input)).toMatchTextContent('区 99'));
        const rect = activeOption(input).getBoundingClientRect();
        const lists = listbox.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(lists.top);
        expect(rect.bottom).toBeLessThanOrEqual(lists.bottom);
    });

    it('滚动虚拟搜索列表后渲染靠后的选项', async () => {
        const manyLeaves = Array.from({ length: 100 }, (_, i) => ({ label: `区 ${i}`, value: `${i}` }));
        render(() => <Cascader style={{ width: '300px' }} filterTreeNode motion={false} treeData={[{ label: '城市', value: 'city', children: manyLeaves }]} virtualizeInSearch={{ height: 144, itemSize: 36 }} />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.type(screen.getByRole('combobox'), '区');
        const options = await screen.findAllByRole('option');
        const outer = options[0].parentElement?.parentElement as HTMLElement;
        const hasOption = (text: string) => screen.queryAllByRole('option').some((item) => item.textContent?.includes(text));
        expect(hasOption('区 0')).toBe(true);
        expect(hasOption('区 50')).toBe(false);

        outer.scrollTop = 36 * 50;

        await waitFor(() => expect(hasOption('区 50')).toBe(true));
        expect(hasOption('区 0')).toBe(false);
    });

    it('在触发器上按 Enter 打开下拉框，且不提交外层表单', async () => {
        const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
        render(() => (
            <form onSubmit={onSubmit}>
                <Cascader placeholder="region" filterTreeNode treeData={treeData} />
                <button type="submit">submit</button>
            </form>
        ));
        screen.getByRole('combobox').focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-option-list`)).not.toBeNull());
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe.each([
    ['single', { defaultValue: ['zhejiang', 'hangzhou', 'xihu'] }],
    ['single searchable', { defaultValue: ['zhejiang', 'hangzhou', 'xihu'], filterTreeNode: true }],
    ['multiple searchable', { defaultValue: [['zhejiang', 'hangzhou', 'xihu']], multiple: true, filterTreeNode: true }],
] as [string, CascaderProps<boolean>][])('%s Cascader 与其清除按钮之间的焦点移动保持在内部', (_, props) => {
    const renderWithSpies = () => {
        const spies = {
            onFocus: vi.fn<NonNullable<CascaderProps['onFocus']>>(),
            onBlur: vi.fn<NonNullable<CascaderProps['onBlur']>>(),
        };
        render(() => (
            <>
                <Cascader style={{ width: '300px' }} showClear treeData={treeData} {...spies} {...props} />
                <Button>after</Button>
            </>
        ));
        return spies;
    };
    const getClear = () => document.querySelector(`.${prefixCls}-clearbtn`);
    const tabToClearAndBack = async () => {
        await userEvent.keyboard('{Tab}');
        expect(getClear()).toHaveFocus();
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(screen.getByRole('combobox')).toHaveFocus();
    };

    it('Tab 进入触发器触发一次 onFocus，到清除按钮再返回不重复触发也不触发 onBlur，弹层保持关闭', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        expect(onFocus).toHaveBeenCalledTimes(1);
        await tabToClearAndBack();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('通过点击打开弹层时，Tab 到清除按钮再返回会保持打开，且不触发 onBlur', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true'));
        await tabToClearAndBack();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('Tab 能离开 Cascader 到达下一个控件', async () => {
        renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await tabTo(screen.getByRole('button', { name: 'after' }));
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('Tab 移出 Cascader 时只触发一次 onBlur', async () => {
        const { onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await tabTo(screen.getByRole('button', { name: 'after' }));
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('打开时按 Tab 关闭下拉并离开，onBlur 恰好一次', async () => {
        const { onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        expect(onBlur).not.toHaveBeenCalled();
        await tabTo(screen.getByRole('button', { name: 'after' }));
        await waitFor(() => expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false'));
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

describe('Cascader onFocus 与 onBlur', () => {
    const renderWithSpies = (props: CascaderProps<boolean> = {}) => {
        const spies = {
            onFocus: vi.fn<NonNullable<CascaderProps['onFocus']>>(),
            onBlur: vi.fn<NonNullable<CascaderProps['onBlur']>>(),
        };
        render(() => (
            <>
                <Cascader style={{ width: '300px' }} motion={false} treeData={treeData} {...spies} {...props} />
                <Button>after</Button>
            </>
        ));
        return spies;
    };
    const expanded = (value: 'true' | 'false') => waitFor(() => expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', value));

    it('脚本 focus 触发一次 onFocus，焦点移出时触发一次 onBlur', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        screen.getByRole('combobox').focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await tabTo(screen.getByRole('button', { name: 'after' }));
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('Esc 关闭下拉时焦点仍在组件内，不触发 onBlur', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('true');
        await userEvent.keyboard('{Escape}');
        await expanded('false');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('点击触发器收起下拉不触发 onBlur', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('true');
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('false');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('单选选中叶子后关闭下拉立即触发 onBlur，再次点击打开重新触发 onFocus', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('true');
        await userEvent.click(screen.getByText('浙江省'));
        await userEvent.click(screen.getByText('杭州市'));
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('西湖区'));
        await expanded('false');
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('true');
        expect(onFocus).toHaveBeenCalledTimes(2);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('多选选中不触发 onBlur', async () => {
        const { onFocus, onBlur } = renderWithSpies({ multiple: true });
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('true');
        await userEvent.click(screen.getByText('浙江省'));
        await userEvent.click(screen.getByText('杭州市'));
        await userEvent.click(screen.getByText('西湖区'));
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('在组件外按下鼠标时触发一次 onBlur 并关闭下拉', async () => {
        const { onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await expanded('true');
        await userEvent.click(document.body);
        await expanded('false');
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

describe('Cascader 前缀', () => {
    it('触发器窄于整行时前缀文字保持单行原宽，不按字换行', () => {
        const longTree = [{ label: '一个名字很长很长的省份用来撑满整行', value: 'long' }];
        const { container } = render(() => (
            <>
                <Cascader style={{ width: '500px' }} defaultValue="long" treeData={longTree} prefix="所在城市" />
                <Cascader style={{ width: '160px' }} defaultValue="long" treeData={longTree} prefix="所在城市" />
            </>
        ));
        const sizes = [...container.querySelectorAll(`.${prefixCls}-prefix-text`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(sizes).toHaveLength(2);
        expect(sizes[1]).toEqual(sizes[0]);
    });
});
