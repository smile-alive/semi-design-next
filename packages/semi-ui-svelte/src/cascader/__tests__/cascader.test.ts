import { createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { CascaderChangeValue, CascaderData, CascaderEntity, CascaderProps, CascaderValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import CascaderCase from './cascader-case.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

const prefixCls = 'semi-cascader';

const treeData: CascaderData[] = [
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

const treeDataWithDisabled: CascaderData[] = [
    {
        label: '亚洲',
        value: 'Asia',
        children: [
            {
                label: '中国',
                value: 'China',
                disabled: true,
                children: [{ label: '北京', value: 'Beijing' }],
            },
            { label: '韩国', value: 'Hanguo' },
        ],
    },
];

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(props: Omit<CascaderProps, 'value' | 'treeData'> = {}, { value, mode = value === undefined ? 'uncontrolled' : 'one-way', data = treeData, accept = true }: { mode?: Mode; value?: CascaderValue; data?: CascaderData[]; accept?: boolean } = {}) {
    const store = createStore<{ value?: CascaderValue; accept: boolean; log: string[]; treeData: CascaderData[] }>({ value, accept, log: [], treeData: data });
    const result = render(CascaderCase, { props: { mode, store, props } });
    flushSync();
    const api = () => {
        const handle = result.component.api();
        if (!handle) throw new Error('Cascader is not mounted');
        return handle;
    };
    return { store, api, ...result };
}

const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getSelection = () => document.querySelector(`.${prefixCls}-selection`) as HTMLElement;
const getSelectionText = () => getSelection().textContent?.trim();
const getInput = () => getRoot().querySelector('input') as HTMLInputElement;
const getOption = (label: string) => screen.getByText(label, { selector: `.${prefixCls}-option-label > span` }).closest('li') as HTMLElement;
const getColumnTexts = (index: number) => [...document.querySelectorAll(`.${prefixCls}-option-list`)[index].querySelectorAll('li')].map((li) => li.textContent?.trim());
const getColumnCount = () => document.querySelectorAll(`.${prefixCls}-option-list`).length;
const getTagTexts = () => [...document.querySelectorAll(`.${prefixCls}-selection .semi-tag-content`)].map((tag) => tag.textContent?.trim());
const getCheckbox = (label: string) => getOption(label).querySelector('.semi-checkbox') as HTMLElement;
const isOpen = () => document.querySelector(`.${prefixCls}-option-lists`) !== null || document.querySelector(`.${prefixCls}-popover`) !== null;
const activeLabel = (host: Element) =>
    document
        .getElementById(host.getAttribute('aria-activedescendant') ?? '')
        ?.querySelector(`.${prefixCls}-option-label`)
        ?.textContent?.trim();

async function click(element: Element) {
    await fireEvent.click(element);
    await settle();
}

async function openDropdown() {
    await click(getRoot());
}

async function keyDown(key: string, target: Element = getRoot()) {
    await fireEvent.keyDown(target, { key });
    await settle();
}

async function search(text: string) {
    const input = getInput();
    input.value = text;
    await fireEvent.input(input);
    await settle();
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Cascader 渲染', () => {
    it('class、style 与 data-* 落在根元素，aria-label 落在 combobox', () => {
        setup({ class: 'custom', style: 'color: red', 'data-x': '1' } as CascaderProps);
        const root = getRoot();
        expect(root).toHaveClass(prefixCls, 'custom', `${prefixCls}-single`);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-x', '1');
        expect(screen.getByRole('combobox')).toBe(root);
        expect(root).toHaveAttribute('aria-label', 'Region');
    });

    it('placeholder、size、validateStatus 与 borderless', () => {
        setup({ placeholder: '请选择', size: 'small', validateStatus: 'error', borderless: true });
        expect(getSelectionText()).toBe('请选择');
        expect(getRoot()).toHaveClass(`${prefixCls}-small`, `${prefixCls}-error`, `${prefixCls}-borderless`);
    });

    it('prefix、suffix 与 insetLabel snippet 渲染在触发器两侧', async () => {
        setup({ prefix: createRawSnippet(() => ({ render: () => '<span>前</span>' })), suffix: createRawSnippet(() => ({ render: () => '<span>后</span>' })) });
        await settle();
        const root = getRoot();
        expect(root).toHaveClass(`${prefixCls}-with-prefix`, `${prefixCls}-with-suffix`);
        expect(root.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent('前');
        expect(root.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('后');
    });

    it('只有 insetLabel 时 combobox 与 tree 以它命名，没有 insetLabelId 也能引用', async () => {
        setup({ 'aria-label': undefined, insetLabel: createRawSnippet(() => ({ render: () => '<span>地区</span>' })) });
        await settle();
        const root = getRoot();
        const label = root.querySelector(`.${prefixCls}-inset-label`) as HTMLElement;
        expect(label.id).not.toBe('');
        expect(root).toHaveAttribute('aria-labelledby', label.id);
        await openDropdown();
        expect(screen.getByRole('tree')).toHaveAttribute('aria-labelledby', label.id);
    });

    it('读取全局默认值，组件传值优先', () => {
        semiGlobal.config.overrideDefaultProps = { Cascader: { placeholder: '全局占位', size: 'large' } };
        setup({ size: 'small' });
        expect(getSelectionText()).toBe('全局占位');
        expect(getRoot()).toHaveClass(`${prefixCls}-small`);
    });

    it('defaultOpen 挂载即打开', async () => {
        setup({ defaultOpen: true });
        await settle();
        expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    it('dropdownClassName 与 dropdownStyle 落在弹层上', async () => {
        setup({ dropdownClassName: 'my-dropdown', dropdownStyle: 'width: 321px' });
        await openDropdown();
        const popup = document.querySelector('.my-dropdown') as HTMLElement;
        expect(popup).toHaveClass(`${prefixCls}-popover`);
        expect(popup).toHaveStyle({ width: '321px' });
    });

    it('空数据显示默认空状态，emptyContent 替换它，null 隐藏它', async () => {
        const first = setup({}, { data: [] });
        await openDropdown();
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toHaveTextContent('暂无数据');
        first.unmount();

        const second = setup({ emptyContent: createRawSnippet(() => ({ render: () => '<b>没有</b>' })) }, { data: [] });
        await openDropdown();
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toHaveTextContent('没有');
        second.unmount();

        setup({ emptyContent: null }, { data: [] });
        await openDropdown();
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-popover`)).not.toBeNull();
    });

    it('arrowIcon 为 null 时不渲染箭头', () => {
        setup({ arrowIcon: null });
        expect(getRoot().querySelector(`.${prefixCls}-arrow`)).toBeNull();
    });
});

describe('Svelte Cascader 单选', () => {
    it('点击触发器打开，逐级展开，点击叶子选中：先 onSelect 再 onChange，关闭并显示路径', async () => {
        const calls: string[] = [];
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { store } = setup({ onSelect: (value) => calls.push(`select ${String(value)}`), onChange: (value) => calls.push(`change ${JSON.stringify(value)}`), onDropdownVisibleChange });
        expect(screen.queryByRole('tree')).toBeNull();
        await openDropdown();
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        expect(getColumnTexts(0)).toEqual(['亚洲', '北美洲']);
        await click(getOption('亚洲'));
        expect(getColumnTexts(1)).toEqual(['中国']);
        await click(getOption('中国'));
        expect(getColumnTexts(2)).toEqual(['北京', '上海']);
        expect(calls).toEqual([]);
        await click(getOption('北京'));
        expect(calls).toEqual(['select Beijing', 'change ["Asia","China","Beijing"]']);
        expect(store.log).toEqual(['change ["Asia","China","Beijing"]']);
        expect(isOpen()).toBe(false);
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('defaultOpen 时受控 value 的路径在列中展开并标记选中', async () => {
        setup({ defaultOpen: true }, { value: ['Asia', 'China', 'Shanghai'] });
        await settle();
        expect(getColumnTexts(2)).toEqual(['北京', '上海']);
        expect(getOption('上海')).toHaveAttribute('aria-selected', 'true');
        expect(getOption('北京')).toHaveAttribute('aria-selected', 'false');
        expect(getOption('上海')).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toBe('亚洲 / 中国 / 上海');
    });

    it('displayProp 与 separator', () => {
        setup({ displayProp: 'value', separator: ' > ' }, { value: ['Asia', 'China'], data: treeData });
        // 'China' is a branch, so without changeOnSelect nothing is selected
        expect(getSelectionText()).toBe('');
    });

    it('displayProp 与 separator 作用于选中的叶子', () => {
        setup({ displayProp: 'value', separator: ' > ' }, { value: ['North America', 'Canada'] });
        expect(getSelectionText()).toBe('North America > Canada');
    });

    it('display snippet 收到 labels 与 path', () => {
        const display = createRawSnippet<[{ labels: Array<string | number>; path: unknown[] }]>((props) => ({ render: () => `<i>${props().labels.join('+')}|${props().path.length}</i>` }));
        setup({ display }, { value: ['North America', 'Canada'] });
        expect(getSelection().querySelector('i')).toHaveTextContent('北美洲+加拿大|2');
    });

    it('点击分支只展开不选中，changeOnSelect 时分支也被选中', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        const first = setup({ onChange });
        await openDropdown();
        await click(getOption('北美洲'));
        expect(onChange).not.toHaveBeenCalled();
        first.unmount();

        setup({ changeOnSelect: true, onChange });
        await openDropdown();
        await click(getOption('北美洲'));
        expect(onChange).toHaveBeenCalledWith(['North America']);
        expect(getSelectionText()).toBe('北美洲');
    });

    it('showNext 为 hover 时悬停展开，禁用项悬停不展开', async () => {
        setup({ showNext: 'hover' }, { data: treeDataWithDisabled });
        await openDropdown();
        expect(getColumnCount()).toBe(1);
        await fireEvent.mouseEnter(getOption('亚洲'));
        await settle();
        expect(getColumnCount()).toBe(2);
        await fireEvent.mouseEnter(getOption('中国'));
        await settle();
        expect(getColumnCount()).toBe(2);
    });

    it('disabled 时点击不打开，combobox 带 aria-disabled 且不是 Tab 停靠点', async () => {
        setup({ disabled: true });
        await openDropdown();
        expect(screen.queryByRole('tree')).toBeNull();
        expect(getRoot()).toHaveAttribute('aria-disabled', 'true');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
        expect(getRoot()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('label snippet 渲染列中选项，选中文字仍是文本', async () => {
        const label = createRawSnippet<[{ item: CascaderData }]>((props) => ({ render: () => `<em>${props().item.label}!</em>` }));
        setup({ label }, { value: ['North America', 'Canada'] });
        await openDropdown();
        expect(getColumnTexts(0)).toEqual(['亚洲!', '北美洲!']);
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
    });

    it('expandIcon snippet 替换展开图标', async () => {
        setup({ expandIcon: createRawSnippet(() => ({ render: () => '<b class="my-expand">&gt;</b>' })) });
        await openDropdown();
        expect(document.querySelectorAll('.my-expand')).toHaveLength(2);
        expect(document.querySelector(`.${prefixCls}-option-icon-expand`)).toBeNull();
    });
});

describe('Svelte Cascader 清除', () => {
    it('showClear 的清除按钮是具名原生 button，点击清除、发出 onClear 与 onChange，且不打开下拉', async () => {
        const onClear = vi.fn<() => void>();
        const { store } = setup({ showClear: true, onClear }, { value: ['North America', 'Canada'], mode: 'bind' });
        const button = screen.getByRole('button', { name: '清空已选值' });
        expect(button.tagName).toBe('BUTTON');
        await click(button);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(store.value).toEqual([]);
        expect(isOpen()).toBe(false);
        expect(screen.queryByRole('button', { name: '清空已选值' })).toBeNull();
    });
});

describe('Svelte Cascader 受控写法', () => {
    const pick = async () => {
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getOption('加拿大'));
    };

    it('bind：选中后写回父级，父级改值后显示跟随', async () => {
        const { store } = setup({}, { mode: 'bind' });
        await pick();
        expect(store.value).toEqual(['North America', 'Canada']);
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
        store.value = ['Asia', 'China', 'Beijing'];
        await settle();
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
    });

    it('函数绑定：setter 拒绝时显示保持原值，接受时更新', async () => {
        const { store } = setup({}, { mode: 'function', value: ['Asia', 'China', 'Beijing'], accept: false });
        await pick();
        expect(store.log).toContain('set ["North America","Canada"]');
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        store.accept = true;
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getOption('加拿大'));
        expect(store.value).toEqual(['North America', 'Canada']);
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
    });

    it('单向传值只作初值：交互后本地覆盖显示，父级写入新值时以父级为准', async () => {
        const { store } = setup({}, { mode: 'one-way', value: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        await pick();
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
        expect(store.value).toEqual(['Asia', 'China', 'Beijing']);
        store.value = ['Asia', 'China', 'Shanghai'];
        await settle();
        expect(getSelectionText()).toBe('亚洲 / 中国 / 上海');
    });

    it('不传 value 为非受控，选中后显示选中路径', async () => {
        const { store } = setup();
        await pick();
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
        expect(store.value).toBeUndefined();
    });

    it('bind 的值被父级改回 undefined 后清空选择', async () => {
        const { store } = setup({ placeholder: '请选择' }, { mode: 'bind', value: ['North America', 'Canada'] });
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
        store.value = undefined;
        await settle();
        expect(getSelectionText()).toBe('请选择');
        await pick();
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
    });

    it('onChangeWithObject 时 onChange 收到节点路径', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ onChangeWithObject: true, onChange });
        await pick();
        const [[value]] = onChange.mock.calls;
        expect((value as CascaderData[]).map((node) => node.value)).toEqual(['North America', 'Canada']);
    });
});

describe('Svelte Cascader 多选', () => {
    it('勾选叶子发出路径数组，显示标签，子节点全部选中后合并为父节点', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        const onSelect = vi.fn<(value: string | number | Array<string | number>) => void>();
        setup({ multiple: true, onChange, onSelect });
        expect(getSelectionText()).toBe('');
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(onChange).toHaveBeenLastCalledWith([['North America', 'United States']]);
        expect(getTagTexts()).toEqual(['美国']);
        await click(getCheckbox('加拿大'));
        expect(onChange).toHaveBeenLastCalledWith([['North America']]);
        expect(getTagTexts()).toEqual(['北美洲']);
        expect(onSelect).toHaveBeenCalled();
    });

    it('选项带 aria-checked，半选为 mixed，复选框对辅助技术隐藏', async () => {
        setup({ multiple: true, defaultOpen: true }, { value: [['North America', 'United States']] });
        await settle();
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'mixed');
        await click(getOption('北美洲'));
        expect(getOption('美国')).toHaveAttribute('aria-checked', 'true');
        expect(getOption('加拿大')).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
        expect(getOption('美国').querySelector('input')).toHaveAttribute('aria-hidden', 'true');
    });

    it('autoMergeValue 为 false 时标签不合并，leafOnly 只报叶子', async () => {
        const first = setup(
            { multiple: true, autoMergeValue: false },
            {
                value: [
                    ['North America', 'United States'],
                    ['North America', 'Canada'],
                ],
            }
        );
        expect(getTagTexts()).toEqual(['美国', '加拿大', '北美洲']);
        first.unmount();

        setup(
            { multiple: true, leafOnly: true },
            {
                value: [
                    ['North America', 'United States'],
                    ['North America', 'Canada'],
                ],
            }
        );
        expect(getTagTexts()).toEqual(['美国', '加拿大']);
    });

    it('enableLeafClick 时点击叶子选项即勾选', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, enableLeafClick: true, onChange });
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getOption('美国'));
        expect(onChange).toHaveBeenLastCalledWith([['North America', 'United States']]);
        expect(isOpen()).toBe(true);
    });

    it('点击标签的关闭按钮移除该项，禁用项的标签没有关闭按钮', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup(
            { multiple: true, onChange },
            {
                value: [
                    ['North America', 'United States'],
                    ['North America', 'Canada'],
                ],
                mode: 'bind',
            }
        );
        expect(getTagTexts()).toEqual(['北美洲']);
        const close = getSelection().querySelector('.semi-tag-close') as HTMLElement;
        await click(close);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('disabled 的多选标签没有关闭按钮', () => {
        setup({ multiple: true, disabled: true }, { value: [['North America', 'Canada']] });
        expect(getSelection().querySelector('.semi-tag-close')).toBeNull();
        expect(getSelection().querySelector(`.${prefixCls}-selection-tag-disabled`)).not.toBeNull();
    });

    it('max 限制勾选数量并发出 onExceed', async () => {
        const onExceed = vi.fn<(items: CascaderEntity[]) => void>();
        setup({ multiple: true, max: 1, onExceed });
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(onExceed).not.toHaveBeenCalled();
        // the two children merge into one parent, which is still one item
        await click(getCheckbox('加拿大'));
        expect(onExceed).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['北美洲']);
        await click(getOption('亚洲'));
        await click(getCheckbox('中国'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['北美洲']);
    });

    it('maxTagCount 之外的标签折叠为 +N', () => {
        setup(
            { multiple: true, maxTagCount: 1, autoMergeValue: false },
            {
                value: [
                    ['North America', 'United States'],
                    ['North America', 'Canada'],
                ],
            }
        );
        expect(getTagTexts()).toEqual(['美国']);
        expect(document.querySelector(`.${prefixCls}-selection-n`)).toHaveTextContent('+2');
    });

    it('多选清除按钮清空全部勾选，没有勾选时清除只清空搜索文字', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, showClear: true, onChange }, { value: [['North America', 'Canada']], mode: 'bind' });
        await click(screen.getByRole('button', { name: '清空已选值' }));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
        expect(screen.queryByRole('button', { name: '清空已选值' })).toBeNull();
    });

    it('tag snippet 整体替换标签并收到 onClose', async () => {
        const tag = createRawSnippet<[{ entity: { data: CascaderData }; index: number; disabled: boolean; onClose: () => void }]>((props) => ({
            render: () => `<button class="my-tag">${props().entity.data.label}</button>`,
            setup: (element) => {
                element.addEventListener('click', () => props().onClose());
            },
        }));
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, tag, onChange }, { value: [['North America', 'Canada']] });
        const button = document.querySelector('.my-tag') as HTMLElement;
        expect(button).toHaveTextContent('加拿大');
        await click(button);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('disableStrictly 时父节点的禁用连带子节点', async () => {
        setup({ multiple: true, disableStrictly: true }, { data: treeDataWithDisabled });
        await openDropdown();
        await click(getOption('亚洲'));
        expect(getCheckbox('中国').querySelector('input')).toBeDisabled();
        expect(getCheckbox('韩国').querySelector('input')).not.toBeDisabled();
    });

    it('checkRelation 为 unRelated 时子节点不影响父节点', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, checkRelation: 'unRelated', onChange });
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        await click(getCheckbox('加拿大'));
        expect(onChange).toHaveBeenLastCalledWith([
            ['North America', 'United States'],
            ['North America', 'Canada'],
        ]);
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'false');
    });

    it('bind 的多选值：勾选写回父级，父级改值后标签跟随', async () => {
        const { store } = setup({ multiple: true }, { mode: 'bind', value: [['North America', 'Canada']] });
        expect(getTagTexts()).toEqual(['加拿大']);
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        // both children are checked, so they merge into their parent
        expect(store.value).toEqual([['North America']]);
        store.value = [['Asia', 'China', 'Beijing']];
        await settle();
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('函数绑定的 setter 拒绝时多选显示不变', async () => {
        const { store } = setup({ multiple: true }, { mode: 'function', value: [['North America', 'Canada']], accept: false });
        await openDropdown();
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(store.log.some((entry) => entry.startsWith('set '))).toBe(true);
        expect(getTagTexts()).toEqual(['加拿大']);
        expect(getCheckbox('美国').querySelector('input')).not.toBeChecked();
    });
});

describe('Svelte Cascader 搜索', () => {
    it('filterTreeNode 在触发器里显示输入框，输入过滤并高亮，点击结果选中并关闭', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ filterTreeNode: true, onSearch, onChange });
        expect(getInput()).toBeNull();
        await openDropdown();
        expect(getInput()).not.toBeNull();
        expect(getRoot()).toHaveClass(`${prefixCls}-filterable`);
        await search('北');
        expect(onSearch).toHaveBeenLastCalledWith('北');
        const options = screen.getAllByRole('option');
        expect(options.map((option) => option.textContent?.trim())).toEqual(['亚洲 / 中国 / 北京', '北美洲 / 美国', '北美洲 / 加拿大']);
        expect([...document.querySelectorAll(`.${prefixCls}-option-label-highlight`)].map((node) => node.textContent)).toEqual(['北', '北', '北']);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        await click(options[0]);
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        expect(isOpen()).toBe(false);
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
    });

    it('搜索无结果显示空状态', async () => {
        setup({ filterTreeNode: true });
        await openDropdown();
        await search('不存在');
        expect(screen.queryAllByRole('option')).toHaveLength(0);
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toHaveTextContent('暂无数据');
    });

    it('filterTreeNode 为函数、treeNodeFilterProp 与 filterSorter', async () => {
        const filterTreeNode = vi.fn<(input: string, text: string) => boolean>((input, text) => text.includes(input));
        const filterSorter = vi.fn<(first: CascaderData[], second: CascaderData[], input: string) => number>((first, second) => second[0].value.toString().localeCompare(first[0].value.toString()));
        setup({ filterTreeNode, treeNodeFilterProp: 'value', filterSorter });
        await openDropdown();
        await search('a');
        expect(filterTreeNode).toHaveBeenCalled();
        const [first, second, input] = filterSorter.mock.calls[0];
        expect(first[0]).toHaveProperty('value');
        expect(second[0]).toHaveProperty('value');
        expect(input).toBe('a');
        // treeNodeFilterProp also decides the text a result shows
        expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(['North America / United States', 'North America / Canada', 'Asia / China / Beijing', 'Asia / China / Shanghai']);
    });

    it('filterItem snippet 替换结果行，props 带 option 角色与 id', async () => {
        const filterItem = createRawSnippet<[{ props: { id: string; role: string; class: unknown; onclick: (event: MouseEvent) => void }; data: CascaderData[] }]>((props) => ({
            render: () =>
                `<li class="my-row" id="${props().props.id}" role="${props().props.role}">${props()
                    .data.map((node) => node.label)
                    .join('>')}</li>`,
            setup: (element) => {
                element.addEventListener('click', (event) => props().props.onclick(event as MouseEvent));
            },
        }));
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ filterTreeNode: true, filterItem, onChange });
        await openDropdown();
        await search('加拿');
        const row = document.querySelector('.my-row') as HTMLElement;
        expect(row).toHaveTextContent('北美洲>加拿大');
        expect(screen.getByRole('option')).toBe(row);
        await click(row);
        expect(onChange).toHaveBeenCalledWith(['North America', 'Canada']);
    });

    it('多选在触发器上搜索时由 TagInput 承载，结果中勾选后出现标签', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, filterTreeNode: true, onChange });
        const input = getInput();
        expect(input).toHaveAttribute('role', 'combobox');
        await fireEvent.click(input);
        await settle();
        await search('上海');
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        await click(options[0].querySelector('.semi-checkbox') as HTMLElement);
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Shanghai']]);
        expect(getTagTexts()).toEqual(['上海']);
    });

    it('多选搜索时 TagInput 指向选项，Enter 勾选该选项', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, filterTreeNode: true, onChange, defaultOpen: true });
        await settle();
        const input = getInput();
        await search('美');
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await settle();
        expect(document.getElementById(input.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('美国');
        await fireEvent.keyDown(input, { key: 'Enter' });
        await settle();
        expect(onChange).toHaveBeenCalledWith([['North America', 'United States']]);
    });

    it('searchPosition 为 custom 时没有触发器输入框，search 方法搜索', async () => {
        const { api } = setup({ filterTreeNode: true, searchPosition: 'custom' });
        await openDropdown();
        expect(getInput()).toBeNull();
        api().search('上海');
        await settle();
        expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(['亚洲 / 中国 / 上海']);
    });

    it('virtualizeInSearch 只渲染视口内的结果行', async () => {
        const data: CascaderData[] = Array.from({ length: 200 }, (_, index) => ({ label: `Item ${index}`, value: index }));
        setup({ filterTreeNode: true, virtualizeInSearch: { itemSize: 30, height: 90 } }, { data });
        await openDropdown();
        await search('Item');
        const rows = screen.getAllByRole('option');
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(20);
    });
});

describe('Svelte Cascader loadData', () => {
    const asyncData: CascaderData[] = [
        { label: 'Node1', value: '0-0' },
        { label: 'Node2', value: '0-1' },
        { label: 'Node3', value: '0-2', isLeaf: true },
    ];

    it('点击未加载的节点调用 loadData，加载中带 aria-busy，加载后展开子列', async () => {
        let finish!: () => void;
        let target: CascaderData | undefined;
        const loadData = vi.fn<(selected: CascaderData[]) => Promise<void>>((selected) => {
            target = selected.at(-1);
            return new Promise<void>((done) => {
                finish = done;
            });
        });
        const onLoad = vi.fn<(keys: Set<string>, data: CascaderData) => void>();
        const { store } = setup({ loadData, onLoad }, { data: asyncData });
        await openDropdown();
        await click(getOption('Node1'));
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(target?.value).toBe('0-0');
        expect(getOption('Node1')).toHaveAttribute('aria-busy', 'true');
        expect(getOption('Node1').querySelector(`.${prefixCls}-option-spin-icon`)).not.toBeNull();
        // like the docs' demo, the loaded children go into treeData before the promise resolves
        store.treeData[0].children = [{ label: 'Node1-1', value: '0-0-1', isLeaf: true }];
        finish();
        await settle();
        await settle();
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(getOption('Node1')).not.toHaveAttribute('aria-busy');
        expect(getColumnTexts(1)).toEqual(['Node1-1']);
    });

    it('loadData reject 后停止加载状态并允许重试', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => Promise.reject(new Error('load failed')));
        // the rejection is rethrown to the caller by design; swallow it here so it is not reported as a test failure
        const swallow = (event: PromiseRejectionEvent) => event.preventDefault();
        const nodeSwallow = () => {};
        process.on('unhandledRejection', nodeSwallow);
        window.addEventListener('unhandledrejection', swallow);
        try {
            setup({ loadData }, { data: asyncData });
            await openDropdown();
            await click(getOption('Node1'));
            await settle();
            expect(loadData).toHaveBeenCalledTimes(1);
            expect(getOption('Node1')).not.toHaveAttribute('aria-busy');
            await click(getOption('Node1'));
            await settle();
            expect(loadData).toHaveBeenCalledTimes(2);
        } finally {
            window.removeEventListener('unhandledrejection', swallow);
            process.off('unhandledRejection', nodeSwallow);
        }
    });
});

describe('Svelte Cascader 禁用与重置', () => {
    it.each([false, true])('changeOnSelect 为 %s 时，disabled 的选项点击无效，带禁用类名与 aria-disabled', async (changeOnSelect) => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ onChange, changeOnSelect }, { data: treeDataWithDisabled });
        await openDropdown();
        await click(getOption('亚洲'));
        const callsAfterExpand = changeOnSelect ? 1 : 0;
        expect(onChange).toHaveBeenCalledTimes(callsAfterExpand);
        const china = getOption('中国');
        expect(china).toHaveClass(`${prefixCls}-option-disabled`);
        expect(china).toHaveAttribute('aria-disabled', 'true');
        await click(china);
        expect(onChange).toHaveBeenCalledTimes(callsAfterExpand);
        expect(getColumnCount()).toBe(2);
        await click(getOption('韩国'));
        expect(onChange).toHaveBeenLastCalledWith(['Asia', 'Hanguo']);
    });
});

describe('Svelte Cascader 键盘与 ARIA', () => {
    it('combobox 暴露展开状态，aria-controls 指向树，层级由 aria 属性提供', async () => {
        setup({ defaultOpen: true });
        await settle();
        const root = getRoot();
        const tree = screen.getByRole('tree');
        expect(root).toHaveAttribute('aria-expanded', 'true');
        expect(root).toHaveAttribute('aria-haspopup', 'tree');
        expect(root).toHaveAttribute('aria-controls', tree.id);
        expect(tree).toHaveAttribute('aria-label', 'Region');
        const item = getOption('亚洲');
        expect(item).toHaveAttribute('role', 'treeitem');
        expect(item).toHaveAttribute('aria-level', '1');
        expect(item).toHaveAttribute('aria-setsize', '2');
        expect(item).toHaveAttribute('aria-posinset', '1');
        expect(item).toHaveAttribute('aria-expanded', 'false');
        await click(item);
        expect(getOption('亚洲')).toHaveAttribute('aria-expanded', 'true');
        expect(getOption('中国')).toHaveAttribute('aria-level', '2');
    });

    it('关闭时 ArrowDown 打开；打开时没有当前选项，Down、Up、Home、End 在列内移动', async () => {
        setup();
        await keyDown('ArrowDown');
        const root = getRoot();
        expect(screen.getByRole('tree')).toBeInTheDocument();
        expect(root).not.toHaveAttribute('aria-activedescendant');
        await keyDown('ArrowDown');
        expect(activeLabel(root)).toBe('亚洲');
        await keyDown('ArrowDown');
        expect(activeLabel(root)).toBe('北美洲');
        await keyDown('ArrowUp');
        expect(activeLabel(root)).toBe('亚洲');
        await keyDown('End');
        expect(activeLabel(root)).toBe('北美洲');
        await keyDown('Home');
        expect(activeLabel(root)).toBe('亚洲');
    });

    it('Right 展开分支并移入，Left 返回并收起，叶子上 Enter 选中并关闭', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ onChange });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        const root = getRoot();
        await keyDown('ArrowRight');
        expect(getColumnCount()).toBe(2);
        await keyDown('ArrowRight');
        expect(activeLabel(root)).toBe('中国');
        await keyDown('ArrowRight');
        await keyDown('ArrowRight');
        expect(activeLabel(root)).toBe('北京');
        await keyDown('ArrowLeft');
        expect(activeLabel(root)).toBe('中国');
        await keyDown('ArrowRight');
        await keyDown('ArrowRight');
        await keyDown('Enter');
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        expect(isOpen()).toBe(false);
    });

    it('多选时 Enter 与 Space 勾选当前选项', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        setup({ multiple: true, onChange });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('ArrowRight');
        await keyDown('ArrowRight');
        await keyDown('Enter');
        expect(onChange).toHaveBeenLastCalledWith([['North America', 'United States']]);
        await keyDown('ArrowDown');
        await keyDown(' ');
        expect(onChange).toHaveBeenLastCalledWith([['North America']]);
    });

    it('Escape 关闭已打开的下拉，焦点留在 combobox', async () => {
        setup();
        const root = getRoot();
        root.focus();
        await keyDown('ArrowDown');
        expect(isOpen()).toBe(true);
        await keyDown('Escape');
        expect(isOpen()).toBe(false);
    });

    it('keydown 在 Cascader 处理之前发出，且每个按键只发一次', async () => {
        const events: string[] = [];
        setup({
            onKeyDown: (event) => events.push(`${event.key} ${screen.queryByRole('tree') ? 'open' : 'closed'}`),
        });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        expect(events).toEqual(['ArrowDown closed', 'ArrowDown open']);
    });

    it('搜索框内 onKeyDown 里 stopPropagation 后 Escape 不再关闭下拉，方向键仍移动选项', async () => {
        setup({ filterTreeNode: true, defaultOpen: true, onKeyDown: (event) => event.stopPropagation() });
        await settle();
        const input = getInput();
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await settle();
        expect(activeLabel(input)).toBe('亚洲');
        await fireEvent.keyDown(input, { key: 'Escape' });
        await settle();
        expect(isOpen()).toBe(true);
    });

    it('onKeyDown 里 stopPropagation 后 Cascader 不再处理该按键', async () => {
        setup({ onKeyDown: (event) => event.stopPropagation() });
        await keyDown('ArrowDown');
        expect(isOpen()).toBe(false);
    });

    it('搜索输入框作为 combobox（ARIA 1.2）：触发器不再是 combobox，输入框带 aria-controls', async () => {
        setup({ filterTreeNode: true });
        await openDropdown();
        const input = getInput();
        expect(input).toHaveAttribute('role', 'combobox');
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(getRoot()).not.toHaveAttribute('role', 'combobox');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
        await search('加拿');
        expect(input).toHaveAttribute('aria-haspopup', 'listbox');
        await fireEvent.keyDown(input, { key: 'ArrowDown' });
        await settle();
        expect(document.getElementById(input.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('北美洲 / 加拿大');
    });

    it('句柄的 open、close、focus、blur 与 search', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { api } = setup({ onDropdownVisibleChange });
        api().open();
        await settle();
        expect(isOpen()).toBe(true);
        api().close();
        await settle();
        expect(isOpen()).toBe(false);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        api().focus();
        expect(getRoot()).toHaveFocus();
        api().blur();
        expect(getRoot()).not.toHaveFocus();
    });

    it('trigger snippet 替换触发器内容并收到位置与回调', async () => {
        const seen: Array<string | Set<string> | undefined> = [];
        const trigger = createRawSnippet<[{ value: string | Set<string> | undefined; inputValue: string; onClear: (event?: MouseEvent) => void }]>((props) => {
            seen.push(props().value);
            return { render: () => `<button class="my-trigger">${props().inputValue}</button>` };
        });
        setup({ trigger }, { value: ['North America', 'Canada'] });
        const root = screen.getByRole('combobox');
        expect(root).not.toHaveClass(prefixCls);
        expect(root.querySelector('.my-trigger')).not.toBeNull();
        expect(getSelection()).toBeNull();
        expect(seen.at(-1)).toBe('1-1');
    });

    it('in-place 修改 treeData 后出现新列，等值的新 treeData 不重置已展开的列', async () => {
        const { store } = setup();
        await openDropdown();
        await click(getOption('北美洲'));
        expect(getColumnTexts(1)).toEqual(['美国', '加拿大']);
        store.treeData[1].children?.push({ label: '墨西哥', value: 'Mexico' });
        await settle();
        expect(getColumnTexts(1)).toEqual(['美国', '加拿大', '墨西哥']);
        store.treeData = JSON.parse(JSON.stringify(store.treeData));
        await settle();
        expect(getColumnTexts(1)).toEqual(['美国', '加拿大', '墨西哥']);
    });

    it('单选值不在 treeData 中时显示原始值路径', async () => {
        const { store } = setup({}, { mode: 'bind', value: ['North America', 'Canada'] });
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
        store.treeData = [treeData[0]];
        await settle();
        expect(getSelectionText()).toBe('North America / Canada');
    });

    it('多选值不在 treeData 中时没有标签并显示 placeholder', () => {
        setup({ multiple: true, placeholder: '请选择', autoMergeValue: false }, { value: [['value', 'notIn', 'treeData']] });
        expect(getTagTexts()).toEqual([]);
        expect(getSelectionText()).toBe('请选择');
    });
});
