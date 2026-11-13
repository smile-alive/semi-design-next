import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '../utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

export interface CascaderSpecNode {
    label: string;
    value: string;
    disabled?: boolean;
    isLeaf?: boolean;
    children?: CascaderSpecNode[];
}

type Key = string | number;
/** A path in single mode, an array of paths in multiple mode */
export type CascaderSpecValue = Key[] | Key[][];

/**
 * Framework-free Cascader props. The fixture maps `value` to the framework's controlled prop and `onChangeWithObject` to
 * Vue's `changeWithObject`, and always sets `motion` to false. `treeData` is replaced as a whole, never mutated.
 */
export interface CascaderSpecProps {
    treeData: CascaderSpecNode[];
    /** `undefined` is uncontrolled */
    value?: CascaderSpecValue;
    defaultValue?: CascaderSpecValue;
    multiple?: boolean;
    changeOnSelect?: boolean;
    autoMergeValue?: boolean;
    leafOnly?: boolean;
    max?: number;
    disabled?: boolean;
    showClear?: boolean;
    defaultOpen?: boolean;
    placeholder?: string;
    'aria-label'?: string;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string) => boolean);
    treeNodeFilterProp?: string;
    onChangeWithObject?: boolean;
    direction?: 'ltr' | 'rtl';
    loadData?: (selected: CascaderSpecNode[]) => Promise<void>;
    onChange?: (value: CascaderSpecValue | CascaderSpecNode[] | CascaderSpecNode[][]) => void;
    onSelect?: (value: Key | Key[]) => void;
    onSearch?: (inputValue: string) => void;
    onClear?: () => void;
    onExceed?: (items: unknown[]) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-cascader`;

const regions: CascaderSpecNode[] = [
    {
        label: '亚洲',
        value: 'Asia',
        children: [
            {
                label: '中国',
                value: 'China',
                children: [
                    { label: '北京', value: 'Beijing' },
                    { label: '上海', value: 'Shanghai' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        children: [
            { label: '美国', value: 'United States' },
            { label: '加拿大', value: 'Canada' },
        ],
    },
];

const withDisabled: CascaderSpecNode[] = [
    {
        label: '亚洲',
        value: 'Asia',
        children: [
            { label: '中国', value: 'China', disabled: true, children: [{ label: '北京', value: 'Beijing' }] },
            { label: '韩国', value: 'Hanguo' },
        ],
    },
];

const asyncNodes: CascaderSpecNode[] = [
    { label: 'Node1', value: '0-0' },
    { label: 'Node2', value: '0-1' },
    { label: 'Node3', value: '0-2', isLeaf: true },
];

export function cascaderSpec(mount: SpecMount<CascaderSpecProps>, options: SpecOptions = {}) {
    defineSpec('Cascader（共享 spec）', options, (test) => {
        let handle: SpecHandle<CascaderSpecProps>;
        const screen = within(document.body);

        async function render(props: Partial<CascaderSpecProps> = {}) {
            handle = await mount({ treeData: regions, 'aria-label': 'Region', ...props });
            onTestFinished(() => handle.unmount());
            return handle;
        }

        // In searchable mode the search input is the combobox, otherwise the trigger is
        const combobox = () => screen.getByRole('combobox');
        const isOpen = () => combobox().getAttribute('aria-expanded') === 'true';
        const items = () => screen.queryAllByRole('treeitem');
        const option = (name: string) => screen.getByRole('treeitem', { name });
        const level = (item: Element) => Number(item.getAttribute('aria-level'));
        const columnCount = () => Math.max(0, ...items().map(level));
        const column = (index: number) =>
            items()
                .filter((item) => level(item) === index)
                .map((item) => item.textContent?.trim());
        const results = () => screen.queryAllByRole('option').map((item) => item.textContent?.trim());
        const selection = () => handle.container.querySelector(`.${prefix}-selection`);
        const selectionText = () => selection()?.textContent?.trim();
        const tagTexts = () => [...handle.container.querySelectorAll(`.${prefix}-selection .${BASE_CLASS_PREFIX}-tag-content`)].map((tag) => tag.textContent?.trim());
        const clearButton = () => handle.container.querySelector<HTMLElement>(`button.${prefix}-clearbtn`) ?? handle.container.querySelector<HTMLElement>('button');
        const activeLabel = () => {
            const active = document.getElementById(combobox().getAttribute('aria-activedescendant') ?? '');
            return active?.textContent?.trim();
        };

        const waitOpen = () => vi.waitFor(() => expect(isOpen()).toBe(true));
        const waitClosed = () => vi.waitFor(() => expect(isOpen()).toBe(false));
        const waitActive = (label: string) => vi.waitFor(() => expect(activeLabel()).toBe(label));
        async function open() {
            await userEvent.click(combobox());
            await waitOpen();
        }
        async function focusCombobox() {
            await userEvent.tab();
            expect(combobox()).toHaveFocus();
        }
        const press = (keys: string) => userEvent.keyboard(keys);
        const check = (checkable: Element) => userEvent.click(within(checkable as HTMLElement).getByRole('checkbox', { hidden: true }));

        test('渲染 combobox，关闭时没有 tree，placeholder 显示在触发器里', async () => {
            await render({ placeholder: '请选择' });
            expect(combobox()).toHaveAttribute('aria-expanded', 'false');
            expect(combobox()).toHaveAccessibleName('Region');
            expect(screen.queryByRole('tree')).toBeNull();
            expect(selectionText()).toBe('请选择');
        });

        test('defaultValue 显示选中路径，defaultOpen 时展开该路径的各列并标记选中项', async () => {
            await render({ defaultValue: ['Asia', 'China', 'Shanghai'], defaultOpen: true });
            expect(selectionText()).toBe('亚洲 / 中国 / 上海');
            await vi.waitFor(() => expect(columnCount()).toBe(3));
            expect(column(3)).toEqual(['北京', '上海']);
            expect(option('上海')).toHaveAttribute('aria-selected', 'true');
            expect(option('北京')).toHaveAttribute('aria-selected', 'false');
        });

        test('非受控单选：逐级展开不触发回调，点击叶子先 onSelect 再 onChange，然后关闭并显示路径', async () => {
            const calls: string[] = [];
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>(() => void calls.push('change'));
            const onSelect = vi.fn<NonNullable<CascaderSpecProps['onSelect']>>(() => void calls.push('select'));
            const onDropdownVisibleChange = vi.fn<NonNullable<CascaderSpecProps['onDropdownVisibleChange']>>();
            await render({ onChange, onSelect, onDropdownVisibleChange });
            await open();
            expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
            expect(column(1)).toEqual(['亚洲', '北美洲']);
            await userEvent.click(option('亚洲'));
            expect(column(2)).toEqual(['中国']);
            await userEvent.click(option('中国'));
            expect(column(3)).toEqual(['北京', '上海']);
            expect(onSelect).not.toHaveBeenCalled();
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(option('北京'));
            expect(onSelect).toHaveBeenCalledExactlyOnceWith('Beijing');
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['Asia', 'China', 'Beijing']);
            expect(calls).toEqual(['select', 'change']);
            await waitClosed();
            expect(screen.queryByRole('tree')).toBeNull();
            expect(selectionText()).toBe('亚洲 / 中国 / 北京');
            expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        });

        test('changeOnSelect 时点击分支即选中，onSelect 与 onChange 收到该分支，弹层保持打开', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<CascaderSpecProps['onSelect']>>();
            await render({ changeOnSelect: true, onChange, onSelect });
            await open();
            await userEvent.click(option('亚洲'));
            expect(onSelect).toHaveBeenCalledExactlyOnceWith('Asia');
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['Asia']);
            expect(selectionText()).toBe('亚洲');
            await userEvent.click(option('中国'));
            expect(onSelect).toHaveBeenLastCalledWith('China');
            expect(onChange).toHaveBeenLastCalledWith(['Asia', 'China']);
            expect(selectionText()).toBe('亚洲 / 中国');
            expect(isOpen()).toBe(true);
        });

        test('onChangeWithObject 时 onChange 收到从根到叶子的节点路径', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ onChangeWithObject: true, onChange });
            await open();
            await userEvent.click(option('北美洲'));
            await userEvent.click(option('加拿大'));
            expect(onChange).toHaveBeenCalledOnce();
            const [[path]] = onChange.mock.calls;
            expect((path as CascaderSpecNode[]).map((node) => node.value)).toEqual(['North America', 'Canada']);
        });

        test('受控：点击只报告新值，显示由 value 决定，value 更新后跟随', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ value: ['Asia', 'China', 'Beijing'], onChange });
            expect(selectionText()).toBe('亚洲 / 中国 / 北京');
            await open();
            await userEvent.click(option('北美洲'));
            await userEvent.click(option('加拿大'));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['North America', 'Canada']);
            expect(selectionText()).toBe('亚洲 / 中国 / 北京');
            await handle.update({ value: ['North America', 'United States'] });
            expect(selectionText()).toBe('北美洲 / 美国');
        });

        test('受控的单选 value 改回 undefined 后清空选择，之后点击按非受控选中', async () => {
            await render({ value: ['Asia', 'China', 'Beijing'], placeholder: '请选择' });
            expect(selectionText()).toBe('亚洲 / 中国 / 北京');
            await handle.update({ value: undefined });
            expect(selectionText()).toBe('请选择');
            await open();
            await userEvent.click(option('北美洲'));
            await userEvent.click(option('美国'));
            expect(selectionText()).toBe('北美洲 / 美国');
        });

        test('treeData 整体替换后，选中路径的显示跟随新数据', async () => {
            await render({ value: ['North America', 'Canada'] });
            expect(selectionText()).toBe('北美洲 / 加拿大');
            await handle.update({ treeData: [{ label: '北美洲（新）', value: 'North America', children: [{ label: '加拿大（新）', value: 'Canada' }] }] });
            expect(selectionText()).toBe('北美洲（新） / 加拿大（新）');
        });

        test('disabled 时点击不打开，combobox 带 aria-disabled 且不是 Tab 停靠点', async () => {
            await render({ disabled: true });
            await userEvent.click(combobox());
            await userEvent.tab();
            expect(screen.queryByRole('tree')).toBeNull();
            expect(combobox()).toHaveAttribute('aria-disabled', 'true');
            expect(combobox()).not.toHaveFocus();
        });

        for (const changeOnSelect of [false, true]) {
            test(`changeOnSelect 为 ${changeOnSelect} 时，禁用的选项带 aria-disabled，点击不展开也不触发回调`, async () => {
                const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
                const onSelect = vi.fn<NonNullable<CascaderSpecProps['onSelect']>>();
                await render({ treeData: withDisabled, changeOnSelect, onChange, onSelect });
                await open();
                await userEvent.click(option('亚洲'));
                const callsAfterExpand = changeOnSelect ? 1 : 0;
                expect(onChange).toHaveBeenCalledTimes(callsAfterExpand);
                expect(option('中国')).toHaveAttribute('aria-disabled', 'true');
                await userEvent.click(option('中国'));
                expect(onChange).toHaveBeenCalledTimes(callsAfterExpand);
                expect(onSelect).toHaveBeenCalledTimes(callsAfterExpand);
                expect(columnCount()).toBe(2);
                await userEvent.click(option('韩国'));
                expect(onChange).toHaveBeenLastCalledWith(['Asia', 'Hanguo']);
            });
        }

        test('多选：勾选叶子发出路径数组并显示标签，同级全部勾选后合并为父节点', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<CascaderSpecProps['onSelect']>>();
            await render({ multiple: true, onChange, onSelect });
            expect(tagTexts()).toEqual([]);
            await open();
            await userEvent.click(option('北美洲'));
            await check(option('美国'));
            expect(onChange).toHaveBeenLastCalledWith([['North America', 'United States']]);
            expect(onSelect).toHaveBeenCalled();
            expect(tagTexts()).toEqual(['美国']);
            await check(option('加拿大'));
            expect(onChange).toHaveBeenLastCalledWith([['North America']]);
            expect(tagTexts()).toEqual(['北美洲']);
            expect(isOpen()).toBe(true);
        });

        test('多选：tree 带 aria-multiselectable，选项用 aria-checked 表示勾选，半选为 mixed', async () => {
            await render({ multiple: true, defaultOpen: true, defaultValue: [['North America', 'United States']] });
            await vi.waitFor(() => expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true'));
            expect(option('北美洲')).toHaveAttribute('aria-checked', 'mixed');
            await userEvent.click(option('北美洲'));
            expect(option('美国')).toHaveAttribute('aria-checked', 'true');
            expect(option('加拿大')).toHaveAttribute('aria-checked', 'false');
            expect(option('美国')).not.toHaveAttribute('aria-selected');
        });

        test('多选：autoMergeValue 为 false 时标签不合并，leafOnly 只显示叶子', async () => {
            const value = [
                ['North America', 'United States'],
                ['North America', 'Canada'],
            ];
            await render({ multiple: true, defaultValue: value });
            expect(tagTexts()).toEqual(['北美洲']);
            handle.unmount();
            await render({ multiple: true, defaultValue: value, autoMergeValue: false });
            expect(tagTexts()).toEqual(['美国', '加拿大', '北美洲']);
            handle.unmount();
            await render({ multiple: true, defaultValue: value, leafOnly: true });
            expect(tagTexts()).toEqual(['美国', '加拿大']);
        });

        test('多选：点击标签的关闭按钮移除该项，禁用时标签没有关闭按钮', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ multiple: true, defaultValue: [['North America', 'Canada']], onChange });
            expect(tagTexts()).toEqual(['加拿大']);
            await userEvent.click(handle.container.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)!);
            expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
            expect(tagTexts()).toEqual([]);
            handle.unmount();
            await render({ multiple: true, disabled: true, defaultValue: [['North America', 'Canada']] });
            expect(tagTexts()).toEqual(['加拿大']);
            expect(handle.container.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
        });

        test('多选：max 限制勾选数量，超出时 onExceed 被调用且选择不变', async () => {
            const onExceed = vi.fn<NonNullable<CascaderSpecProps['onExceed']>>();
            await render({ multiple: true, max: 1, onExceed });
            await open();
            await userEvent.click(option('北美洲'));
            await check(option('美国'));
            await check(option('加拿大'));
            expect(onExceed).not.toHaveBeenCalled();
            expect(tagTexts()).toEqual(['北美洲']);
            await userEvent.click(option('亚洲'));
            await userEvent.click(option('中国'));
            await check(option('北京'));
            expect(onExceed).toHaveBeenCalledOnce();
            expect(tagTexts()).toEqual(['北美洲']);
        });

        test('多选受控：忽略 onChange 时标签不变，value 改回 undefined 后清空', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ multiple: true, value: [['North America', 'Canada']], onChange });
            await open();
            await userEvent.click(option('北美洲'));
            await check(option('美国'));
            expect(onChange).toHaveBeenCalledOnce();
            expect(tagTexts()).toEqual(['加拿大']);
            await handle.update({ value: undefined });
            expect(tagTexts()).toEqual([]);
        });

        test('showClear 的清除按钮是原生 button，点击清除并调用 onClear，不打开弹层', async () => {
            const onClear = vi.fn<NonNullable<CascaderSpecProps['onClear']>>();
            await render({ showClear: true, onClear, defaultValue: ['North America', 'Canada'], placeholder: '请选择' });
            expect(selectionText()).toBe('北美洲 / 加拿大');
            const button = clearButton()!;
            expect(button.tagName).toBe('BUTTON');
            expect(button).toHaveAccessibleName();
            await userEvent.click(button);
            expect(onClear).toHaveBeenCalledOnce();
            expect(selectionText()).toBe('请选择');
            expect(isOpen()).toBe(false);
            expect(clearButton()).toBeNull();
        });

        for (const key of ['{Enter}', ' ']) {
            test(`清除按钮聚焦后按 ${JSON.stringify(key)} 清除，不打开弹层，焦点回到 combobox`, async () => {
                const onClear = vi.fn<NonNullable<CascaderSpecProps['onClear']>>();
                await render({ showClear: true, onClear, defaultValue: ['North America', 'Canada'], placeholder: '请选择' });
                await focusCombobox();
                await userEvent.tab();
                expect(clearButton()).toHaveFocus();
                await press(key);
                expect(onClear).toHaveBeenCalledOnce();
                expect(selectionText()).toBe('请选择');
                expect(isOpen()).toBe(false);
                expect(combobox()).toHaveFocus();
            });
        }

        test('filterTreeNode：点击后出现搜索输入框，输入后结果是 option 组成的 listbox，点击结果选中并关闭', async () => {
            const onSearch = vi.fn<NonNullable<CascaderSpecProps['onSearch']>>();
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ filterTreeNode: true, onSearch, onChange });
            await open();
            const input = combobox();
            expect(input.tagName).toBe('INPUT');
            await userEvent.type(input, '北');
            expect(onSearch).toHaveBeenLastCalledWith('北');
            await vi.waitFor(() => expect(results()).toEqual(['亚洲 / 中国 / 北京', '北美洲 / 美国', '北美洲 / 加拿大']));
            expect(input).toHaveAttribute('aria-haspopup', 'listbox');
            expect(document.getElementById(input.getAttribute('aria-controls') ?? '')).toHaveAttribute('role', 'listbox');
            await userEvent.click(screen.getByRole('option', { name: '亚洲 / 中国 / 北京' }));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['Asia', 'China', 'Beijing']);
            await waitClosed();
            expect(selectionText()).toBe('亚洲 / 中国 / 北京');
        });

        test('搜索没有匹配时不渲染 option', async () => {
            await render({ filterTreeNode: true });
            await open();
            await userEvent.type(combobox(), '不存在');
            await vi.waitFor(() => expect(combobox()).toHaveValue('不存在'));
            expect(screen.queryAllByRole('option')).toHaveLength(0);
        });

        test('filterTreeNode 为函数时由它决定匹配，treeNodeFilterProp 决定匹配和显示的字段', async () => {
            const filterTreeNode = vi.fn<(inputValue: string, treeNodeString: string) => boolean>((input, text) => text.includes(input));
            await render({ filterTreeNode, treeNodeFilterProp: 'value' });
            await open();
            await userEvent.type(combobox(), 'Cana');
            await vi.waitFor(() => expect(results()).toEqual(['North America / Canada']));
            expect(filterTreeNode.mock.calls.at(-1)?.[0]).toBe('Cana');
        });

        test('搜索时 ArrowDown 让 aria-activedescendant 指向结果，Enter 选中', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ filterTreeNode: true, onChange });
            await open();
            await userEvent.type(combobox(), '美');
            await vi.waitFor(() => expect(results()).toHaveLength(2));
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            await press('{ArrowDown}');
            await waitActive('北美洲 / 美国');
            await press('{ArrowDown}');
            await waitActive('北美洲 / 加拿大');
            await press('{ArrowLeft}{Home}');
            expect(activeLabel()).toBe('北美洲 / 加拿大');
            await press('{Enter}');
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['North America', 'Canada']);
        });

        test('搜索无结果时方向键不指向任何选项', async () => {
            await render({ filterTreeNode: true });
            await open();
            await userEvent.type(combobox(), '不存在');
            await press('{ArrowDown}{End}');
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
        });

        test('多选可搜索：输入框是 combobox，Enter 勾选当前结果并出现标签', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ multiple: true, filterTreeNode: true, onChange });
            expect(combobox().tagName).toBe('INPUT');
            await open();
            await userEvent.type(combobox(), '上海');
            await vi.waitFor(() => expect(results()).toEqual(['亚洲 / 中国 / 上海']));
            await press('{ArrowDown}');
            await waitActive('亚洲 / 中国 / 上海');
            await press('{Enter}');
            expect(onChange).toHaveBeenCalledExactlyOnceWith([['Asia', 'China', 'Shanghai']]);
            await vi.waitFor(() => expect(tagTexts()).toEqual(['上海']));
        });

        test('loadData：点击未加载的节点时调用并带 aria-busy，完成后替换 treeData 展开子列', async () => {
            let finish!: () => void;
            const loadData = vi.fn<NonNullable<CascaderSpecProps['loadData']>>(
                () =>
                    new Promise<void>((resolve) => {
                        finish = resolve;
                    })
            );
            await render({ treeData: asyncNodes, loadData, defaultOpen: true });
            await vi.waitFor(() => expect(items()).toHaveLength(3));
            await userEvent.click(option('Node1'));
            expect(loadData).toHaveBeenCalledOnce();
            expect(loadData.mock.calls[0][0].map((node) => node.value)).toEqual(['0-0']);
            expect(option('Node1')).toHaveAttribute('aria-busy', 'true');
            expect(option('Node2')).not.toHaveAttribute('aria-busy');
            await handle.update({ treeData: asyncNodes.map((node) => (node.value === '0-0' ? { ...node, children: [{ label: 'Node1-1', value: '0-0-1', isLeaf: true }] } : node)) });
            finish();
            await vi.waitFor(() => expect(option('Node1')).not.toHaveAttribute('aria-busy'));
            await vi.waitFor(() => expect(column(2)).toEqual(['Node1-1']));
        });

        test('combobox 的 aria-haspopup 为 tree，aria-controls 指向 tree，选项用 aria-level、aria-setsize、aria-posinset 表示层级', async () => {
            await render({ defaultOpen: true });
            await vi.waitFor(() => expect(isOpen()).toBe(true));
            const tree = screen.getByRole('tree');
            expect(combobox()).toHaveAttribute('aria-haspopup', 'tree');
            expect(combobox()).toHaveAttribute('aria-controls', tree.id);
            expect(tree).toHaveAccessibleName('Region');
            expect(option('亚洲')).toHaveAttribute('aria-level', '1');
            expect(option('亚洲')).toHaveAttribute('aria-setsize', '2');
            expect(option('亚洲')).toHaveAttribute('aria-posinset', '1');
            expect(option('北美洲')).toHaveAttribute('aria-posinset', '2');
            expect(option('亚洲')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(option('亚洲'));
            expect(option('亚洲')).toHaveAttribute('aria-expanded', 'true');
            expect(option('中国')).toHaveAttribute('aria-level', '2');
            expect(option('中国')).toHaveAttribute('aria-setsize', '1');
        });

        test('叶子没有 aria-expanded，单选时选中的叶子 aria-selected 为 true', async () => {
            await render({ defaultOpen: true, defaultValue: ['North America', 'Canada'] });
            await vi.waitFor(() => expect(items().length).toBeGreaterThan(0));
            expect(option('加拿大')).not.toHaveAttribute('aria-expanded');
            expect(option('加拿大')).toHaveAttribute('aria-selected', 'true');
            expect(option('美国')).toHaveAttribute('aria-selected', 'false');
        });

        test('键盘：关闭时 ArrowDown 打开且没有当前选项，Down、Up、Home、End 在当前列移动', async () => {
            await render();
            await focusCombobox();
            await press('{ArrowDown}');
            await waitOpen();
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            await press('{ArrowDown}');
            await waitActive('亚洲');
            await press('{ArrowDown}');
            await waitActive('北美洲');
            await press('{ArrowDown}');
            expect(activeLabel()).toBe('北美洲');
            await press('{ArrowUp}');
            await waitActive('亚洲');
            await press('{End}');
            await waitActive('北美洲');
            await press('{Home}');
            await waitActive('亚洲');
            expect(combobox()).toHaveFocus();
        });

        test('键盘：关闭时 ArrowUp 也打开，Escape 关闭且焦点留在 combobox', async () => {
            await render();
            await focusCombobox();
            await press('{ArrowUp}');
            await waitOpen();
            await press('{Escape}');
            await waitClosed();
            expect(combobox()).toHaveFocus();
        });

        test('键盘：Right 展开分支并移入下一列，Left 返回上一列并收起', async () => {
            await render();
            await focusCombobox();
            await press('{ArrowDown}{ArrowDown}{ArrowDown}');
            await waitActive('北美洲');
            await press('{ArrowRight}');
            await vi.waitFor(() => expect(option('北美洲')).toHaveAttribute('aria-expanded', 'true'));
            expect(columnCount()).toBe(2);
            await press('{ArrowRight}');
            await waitActive('美国');
            await press('{ArrowDown}');
            await waitActive('加拿大');
            await press('{ArrowLeft}');
            await waitActive('北美洲');
            expect(columnCount()).toBe(2);
            await press('{ArrowLeft}');
            await vi.waitFor(() => expect(option('北美洲')).toHaveAttribute('aria-expanded', 'false'));
            expect(columnCount()).toBe(1);
        });

        test('键盘：叶子上按 Enter 选中并关闭，焦点留在 combobox', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ onChange });
            await focusCombobox();
            await press('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}{ArrowDown}');
            await waitActive('加拿大');
            await press('{Enter}');
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['North America', 'Canada']);
            await waitClosed();
            expect(combobox()).toHaveFocus();
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
        });

        test('键盘：禁用的分支可以到达，但 Right 与 Enter 不展开它', async () => {
            await render({ treeData: withDisabled, defaultOpen: true });
            await focusCombobox();
            await press('{ArrowDown}{ArrowRight}{ArrowRight}');
            await waitActive('中国');
            await press('{ArrowRight}{Enter}');
            expect(option('中国')).toHaveAttribute('aria-expanded', 'false');
            expect(columnCount()).toBe(2);
        });

        test('键盘：多选时 Enter 与 Space 切换当前选项的勾选', async () => {
            const onChange = vi.fn<NonNullable<CascaderSpecProps['onChange']>>();
            await render({ multiple: true, onChange });
            await focusCombobox();
            await press('{ArrowDown}{ArrowDown}{ArrowDown}');
            await waitActive('北美洲');
            await press('{Enter}');
            await vi.waitFor(() => expect(option('北美洲')).toHaveAttribute('aria-checked', 'true'));
            await press(' ');
            await vi.waitFor(() => expect(option('北美洲')).toHaveAttribute('aria-checked', 'false'));
            expect(onChange).toHaveBeenCalledTimes(2);
            expect(isOpen()).toBe(true);
        });

        test('键盘：RTL 页面中 Left 展开并移入，Right 返回', async () => {
            await render({ direction: 'rtl', defaultOpen: true });
            await focusCombobox();
            await press('{ArrowDown}');
            await waitActive('亚洲');
            await press('{ArrowLeft}{ArrowLeft}');
            await waitActive('中国');
            await press('{ArrowRight}');
            await waitActive('亚洲');
        });

        test('键盘：打开时输入字符移动到以它开头的选项，关闭时输入字符无效', async () => {
            await render();
            await focusCombobox();
            await press('北');
            expect(isOpen()).toBe(false);
            await press('{ArrowDown}');
            await waitOpen();
            await press('北');
            await waitActive('北美洲');
        });

        test('点击组件外部关闭弹层', async () => {
            const outside = document.createElement('button');
            document.body.append(outside);
            onTestFinished(() => outside.remove());
            await render({ defaultOpen: true });
            await waitOpen();
            await userEvent.click(outside);
            await waitClosed();
        });

        test('遵循 APG combobox 模式', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            await checkPattern('combobox', handle.container, { press: (key) => press(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`).then(() => undefined) });
        });
    });
}
