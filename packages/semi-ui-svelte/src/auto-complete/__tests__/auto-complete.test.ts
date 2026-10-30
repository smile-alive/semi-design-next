import { createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { AutoCompleteDataItem, AutoCompleteItems, AutoCompleteProps, AutoCompleteTriggerSnippetProps } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import AutoCompleteCase from './auto-complete-case.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
type Selected = string | number | AutoCompleteDataItem;

const prefixCls = 'semi-autocomplete';
const optionCls = `${prefixCls}-option`;

const stringData = ['semi', 'ies', 'design', 'platform'];
const objectData = [
    { email: 'semi@abc.com', value: 'abc' },
    { email: 'semi@bytedance.com', value: 'bytedance' },
    { email: 'semi@vigo.com', value: 'vigo' },
];

// lets the popup mount and the foundation's effects run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(props: Omit<AutoCompleteProps, 'value' | 'data'> = {}, { value, mode = value === undefined ? 'uncontrolled' : 'one-way', data = stringData, accept = true }: { mode?: Mode; value?: string | number; data?: AutoCompleteItems[]; accept?: boolean } = {}) {
    const store = createStore<{ value?: string | number; accept: boolean; log: string[]; data: AutoCompleteItems[] }>({ value, accept, log: [], data });
    const result = render(AutoCompleteCase, { props: { mode, store, props } });
    flushSync();
    return { store, api: () => result.component.api(), ...result };
}

const getInput = () => screen.getByRole<HTMLInputElement>('combobox');
const getRoot = () => document.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
const getList = () => document.querySelector<HTMLElement>(`.${optionCls}-list`);
const getOptions = () => [...document.querySelectorAll<HTMLElement>(`.${optionCls}`)];
const getOptionTexts = () => getOptions().map((option) => option.textContent?.trim());
const getFocusedOption = () => document.querySelector<HTMLElement>(`.${optionCls}-focused`);
const getPopupWrapper = () => document.querySelector<HTMLElement>('.semi-popover-wrapper') as HTMLElement;
const getClearButton = () => document.querySelector<HTMLElement>('.semi-input-clearbtn') as HTMLElement;

async function type(value: string, input: HTMLInputElement = getInput()) {
    input.value = value;
    await fireEvent.input(input);
    await settle();
}

async function keyDown(key: string, target: Element = getInput()) {
    await fireEvent.keyDown(target, { key });
    await settle();
}

async function click(element: Element | null) {
    await fireEvent.click(element as Element);
    await settle();
}

async function mouseDown(element: Element) {
    await fireEvent.mouseDown(element);
    await settle();
}

const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte AutoComplete 渲染', () => {
    it('class、style 与 data-* 落在根 div，id、name、aria 落在 input，根 div 没有 id 且 tabindex 为 -1', () => {
        setup({ class: 'own', style: 'color: red', 'data-k': 'v', title: 'tip', id: 'ac-id', name: 'ac-name', 'aria-describedby': 'desc', tabindex: 5 } as AutoCompleteProps);
        const root = getRoot();
        expect(root).toHaveClass('own');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-k', 'v');
        expect(root).toHaveAttribute('title', 'tip');
        expect(root).toHaveAttribute('tabindex', '-1');
        expect(root).not.toHaveAttribute('id');
        expect(root).not.toHaveAttribute('name');
        expect(root).not.toHaveAttribute('aria-describedby');
        const input = getInput();
        expect(input).toHaveAttribute('id', 'ac-id');
        expect(input).toHaveAttribute('name', 'ac-name');
        expect(input).toHaveAttribute('aria-describedby', 'desc');
    });

    it('placeholder、size、validateStatus 与 disabled', () => {
        setup({ placeholder: 'semi', size: 'small', validateStatus: 'error', disabled: true });
        expect(getInput()).toHaveAttribute('placeholder', 'semi');
        expect(getInput()).toBeDisabled();
        expect(document.querySelector('.semi-input-wrapper-small')).not.toBeNull();
        expect(document.querySelector('.semi-input-wrapper-error')).not.toBeNull();
        expect(getRoot()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('prefix、suffix 与 clearIcon snippet', async () => {
        setup({ prefix: html('<i class="p">前</i>'), suffix: html('<i class="s">后</i>'), clearIcon: html('<i class="c">x</i>'), showClear: true });
        await settle();
        expect(document.querySelector('.p')).toHaveTextContent('前');
        expect(document.querySelector('.s')).toHaveTextContent('后');
        await type('a');
        expect(getClearButton().querySelector('.c')).not.toBeNull();
    });

    it('insetLabel 命名 combobox 与 listbox，insetLabelId 优先于生成的 id', async () => {
        const first = setup({ 'aria-label': undefined, insetLabel: html('<span>City</span>'), defaultOpen: true } as AutoCompleteProps);
        await settle();
        expect(getInput()).toHaveAccessibleName('City');
        expect(screen.getByRole('listbox')).toHaveAccessibleName('City');
        first.unmount();

        setup({ 'aria-label': undefined, insetLabel: html('<span>City</span>'), insetLabelId: 'city-label', defaultOpen: true } as AutoCompleteProps);
        await settle();
        expect(getInput()).toHaveAttribute('aria-labelledby', 'city-label');
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'city-label');
    });

    it('读取全局默认值，传入值优先', async () => {
        semiGlobal.config.overrideDefaultProps = { AutoComplete: { size: 'small', placeholder: 'global', maxHeight: 120, renderSelectedItem: (option) => `#${String(option.value)}` } };
        const first = setup({ defaultOpen: true });
        await settle();
        expect(document.querySelector('.semi-input-wrapper-small')).not.toBeNull();
        expect(getInput()).toHaveAttribute('placeholder', 'global');
        expect(getList()).toHaveStyle({ maxHeight: '120px' });
        await click(getOptions()[1]);
        expect(getInput()).toHaveValue('#ies');
        first.unmount();

        setup({ placeholder: 'own', size: 'large' });
        expect(getInput()).toHaveAttribute('placeholder', 'own');
        expect(document.querySelector('.semi-input-wrapper-large')).not.toBeNull();
    });
});

describe('Svelte AutoComplete 受控值（$bindable）', () => {
    it('非受控：输入更新 input，选择写入选项值，onChange 先后收到输入与选中', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        const { store } = setup({ onSearch });
        await type('de');
        expect(getInput()).toHaveValue('de');
        expect(onSearch).toHaveBeenLastCalledWith('de');
        expect(getOptionTexts()).toEqual(stringData);
        await click(getOptions()[2]);
        expect(getInput()).toHaveValue('design');
        expect(store.log).toEqual(['change "de"', 'change "design"']);
        await vi.waitFor(() => expect(getList()).toBeNull());
    });

    it('bind:value：输入与选中写回父级，父级改值同步到输入框，改回 undefined 后清空并继续可输入', async () => {
        const { store } = setup({}, { mode: 'bind', value: '' });
        await type('se');
        expect(store.value).toBe('se');
        await click(getOptions()[2]);
        expect(store.value).toBe('design');
        expect(getInput()).toHaveValue('design');
        store.value = 'platform';
        await settle();
        expect(getInput()).toHaveValue('platform');
        store.value = undefined;
        await settle();
        expect(getInput()).toHaveValue('');
        await type('free');
        expect(getInput()).toHaveValue('free');
        expect(store.value).toBe('free');
    });

    it('函数绑定：setter 拒绝时输入框保持原值，选中也不改变输入框；接受时跟随', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const rejected = setup({ onSelect }, { mode: 'function', value: 'semi', accept: false });
        await type('semiX');
        expect(rejected.store.log).toEqual(['set "semiX"', 'change "semiX"']);
        expect(getInput()).toHaveValue('semi');
        await click(getOptions()[1]);
        expect(onSelect).toHaveBeenLastCalledWith('ies');
        expect(getInput()).toHaveValue('semi');
        expect(rejected.store.value).toBe('semi');
        rejected.unmount();

        const accepted = setup({}, { mode: 'function', value: 'semi', accept: true });
        await type('semiX');
        expect(accepted.store.value).toBe('semiX');
        expect(getInput()).toHaveValue('semiX');
    });

    it('单向传值：组件在本地覆盖，父级值不变；父级再推新值时以父级为准', async () => {
        const { store } = setup({}, { mode: 'one-way', value: 'semi' });
        expect(getInput()).toHaveValue('semi');
        await type('semiX');
        expect(getInput()).toHaveValue('semiX');
        expect(store.value).toBe('semi');
        store.value = 'ies';
        await settle();
        expect(getInput()).toHaveValue('ies');
    });

    it('没有 defaultValue：初值只来自 value，不在 data 中的值照常显示', () => {
        setup({}, { value: 'unknown', data: [] });
        expect(getInput()).toHaveValue('unknown');
    });

    it('自定义 renderSelectedItem 时输入文字不经过它，点选后显示其结果并经 onChange 上报', async () => {
        const data = [
            { name: '夏可漫', label: '夏可漫', value: 'xiakeman@example.com', abbr: 'XK' },
            { name: '申悦', label: '申悦', value: 'shenyue@example.com', abbr: 'SY' },
        ];
        const renderSelectedItem = (option: AutoCompleteDataItem) => String(option.abbr);
        const { store } = setup({ renderSelectedItem, defaultOpen: true }, { data });
        await settle();
        await type('ab');
        expect(getInput()).toHaveValue('ab');
        await click(getOptions()[0]);
        expect(getInput()).toHaveValue('XK');
        expect(store.log.at(-1)).toBe('change "XK"');
    });

    it('受控模式下 renderSelectedItem 的结果经 onChange 上报，输入框仍显示 value', async () => {
        const data = [{ label: '夏可漫', value: 'xiakeman@example.com', abbr: 'XK' }];
        const { store } = setup({ defaultOpen: true, renderSelectedItem: (option: AutoCompleteDataItem) => String(option.abbr) }, { mode: 'function', value: '', data, accept: false });
        await settle();
        await click(getOptions()[0]);
        expect(store.log).toEqual(['set "XK"', 'change "XK"']);
        expect(getInput()).toHaveValue('');
    });

    it('不在 data 中的 value 以 { label, value } 交给 renderSelectedItem，输入框显示 value 本身；value 变回 undefined 时不用空对象调用它', async () => {
        const renderSelectedItem = vi.fn<(option: AutoCompleteDataItem) => string>((option) => `Selected: ${option.value}`);
        const { store } = setup({ renderSelectedItem }, { mode: 'bind', value: 'semi' });
        expect(getInput()).toHaveValue('semi');
        expect(renderSelectedItem).toHaveBeenLastCalledWith({ label: 'semi', value: 'semi' });
        renderSelectedItem.mockClear();
        store.value = undefined;
        await settle();
        expect(getInput()).toHaveValue('');
        expect(renderSelectedItem).not.toHaveBeenCalled();
    });
});

describe('Svelte AutoComplete 打开与选择', () => {
    it('点击输入框与根 div 打开列表，再次点击输入框关闭，onDropdownVisibleChange 各上报一次', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        setup({ onDropdownVisibleChange });
        expect(getList()).toBeNull();
        await click(getInput());
        expect(getOptionTexts()).toEqual(stringData);
        await click(getInput());
        await vi.waitFor(() => expect(getList()).toBeNull());
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        await click(getRoot());
        expect(getList()).not.toBeNull();
    });

    it('defaultOpen 挂载后打开；disabled 时不打开也不上报', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const first = setup({ defaultOpen: true, onDropdownVisibleChange });
        await settle();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(getList()?.children).toHaveLength(4);
        first.unmount();

        const disabledChange = vi.fn<(visible: boolean) => void>();
        setup({ defaultOpen: true, disabled: true, onDropdownVisibleChange: disabledChange });
        await settle();
        expect(getList()).toBeNull();
        expect(disabledChange).not.toHaveBeenCalled();
    });

    it('点击候选项发出 onSelect 并写入输入框，焦点留在输入框', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        setup({ defaultOpen: true, onSelect, onBlur });
        await settle();
        getInput().focus();
        await click(getOptions()[0]);
        expect(onSelect.mock.calls).toEqual([['semi']]);
        expect(getInput()).toHaveValue('semi');
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('onSelectWithObject：载荷为不含内部字段的数据项，点击与 Enter 一致，字符串项为 { value, label }', async () => {
        const data = [{ value: 'a', label: 'A', class: 'x', extra: 1 }, 'plain'];
        const clickSelect = vi.fn<(value: Selected) => void>();
        const first = setup({ defaultOpen: true, onSelectWithObject: true, onSelect: clickSelect }, { data });
        await settle();
        await click(getOptions()[0]);
        first.unmount();

        const enterSelect = vi.fn<(value: Selected) => void>();
        const second = setup({ defaultOpen: true, defaultActiveFirstOption: true, onSelectWithObject: true, onSelect: enterSelect }, { data });
        await settle();
        await keyDown('Enter');
        expect(clickSelect.mock.calls[0][0]).toEqual({ value: 'a', label: 'A', class: 'x', extra: 1 });
        expect(enterSelect.mock.calls[0][0]).toEqual(clickSelect.mock.calls[0][0]);
        second.unmount();

        const third = setup({ defaultOpen: true, onSelectWithObject: true, onSelect: clickSelect }, { data });
        await settle();
        await click(getOptions()[1]);
        expect(clickSelect.mock.calls.at(-1)?.[0]).toEqual({ value: 'plain', label: 'plain' });
        third.unmount();
    });

    it('onSelectWithObject 搭配 renderSelectedItem：input 显示其结果，item snippet 收到原始数据项', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const item = createRawSnippet<[{ item: AutoCompleteItems; index: number }]>((args) => ({ render: () => `<i class="row">${args().index}:${(args().item as { email: string }).email}</i>` }));
        setup({ defaultOpen: true, onSelectWithObject: true, renderSelectedItem: (option: AutoCompleteDataItem) => String(option.email), onSelect, item }, { data: objectData });
        await settle();
        expect(getOptionTexts()).toEqual(['0:semi@abc.com', '1:semi@bytedance.com', '2:semi@vigo.com']);
        await click(getOptions()[1]);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'bytedance', email: 'semi@bytedance.com' }));
        expect(getInput()).toHaveValue('semi@bytedance.com');
    });

    it('禁用项：点击不发出 onSelect，列表保持打开，aria-disabled 为 true', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        setup(
            { defaultOpen: true, onSelect },
            {
                data: [
                    { value: 'disabled', label: 'Disabled', disabled: true },
                    { value: 'enabled', label: 'Enabled' },
                ],
            }
        );
        await settle();
        const [disabledOption] = getOptions();
        expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
        await click(disabledOption);
        expect(onSelect).not.toHaveBeenCalled();
        expect(getList()).not.toBeNull();
    });

    it('悬停候选项使其高亮；悬停禁用项后 Enter 不选中', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const { store } = setup(
            { defaultOpen: true, onSelect },
            {
                data: [
                    { value: 'a', label: 'A', disabled: true },
                    { value: 'b', label: 'B' },
                ],
            }
        );
        await settle();
        expect(getFocusedOption()).toBeNull();
        await fireEvent.mouseEnter(getOptions()[0]);
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await keyDown('Enter');
        expect(onSelect).not.toHaveBeenCalled();
        expect(store.log).toEqual([]);
        expect(getInput()).toHaveValue('');
    });

    it('数据项的 class、style、data-* 落到候选项；同名内部字段不改变行状态；缺 label 时显示 value；无效项不占位', async () => {
        setup({ defaultOpen: true }, { data: [{ label: 'x' } as AutoCompleteDataItem, { label: 'Styled', value: 'styled', class: 'custom-class', style: 'color: red', 'data-k': 'v' }, { value: 'b', focused: true }, 'c'] });
        await settle();
        expect(getOptionTexts()).toEqual(['Styled', 'b', 'c']);
        expect(getOptions()[0]).toHaveClass('custom-class');
        expect(getOptions()[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getOptions()[0]).toHaveAttribute('data-k', 'v');
        expect(getFocusedOption()).toBeNull();
        expect(getOptions()[0].querySelector(`.${optionCls}-icon`)).toBeNull();
    });

    it('item snippet 缺省时行显示 label；emptyContent 只在 data 为空时显示，没有它时列表为空', async () => {
        const emptyContent = html('<div class="custom-empty">emptycontent</div>');
        const first = setup({ defaultOpen: true, emptyContent }, { data: [] });
        await settle();
        expect(screen.getByText('emptycontent')).toHaveClass('custom-empty');
        first.unmount();

        const second = setup({ defaultOpen: true, emptyContent }, { data: [1, 2, 3] });
        await settle();
        expect(screen.queryByText('emptycontent')).toBeNull();
        expect(getOptionTexts()).toEqual(['1', '2', '3']);
        second.unmount();

        setup({ defaultOpen: true }, { data: [] });
        await settle();
        expect(getList()?.children).toHaveLength(0);
        expect(getList()).toHaveTextContent('');
    });

    it('loading 用 Spin 替换候选项；加载中方向键与 Enter 不作用于隐藏的旧列表', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const { store } = setup({ defaultOpen: true, loading: true, onSelect });
        await settle();
        expect(document.querySelector(`.${prefixCls}-loading-wrapper .semi-spin`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(onSelect).not.toHaveBeenCalled();
        expect(store.log).toEqual([]);
        expect(getInput()).not.toHaveAttribute('aria-activedescendant');
    });

    it('maxHeight 数字按 px、字符串原样；dropdownStyle 与 maxHeight 合并且 dropdownStyle 优先；dropdownClassName', async () => {
        const first = setup({ defaultOpen: true, maxHeight: 400, dropdownClassName: 'ddc', dropdownStyle: 'color: red' });
        await settle();
        expect(getList()).toHaveClass('ddc');
        expect(getList()).toHaveStyle({ maxHeight: '400px', color: 'rgb(255, 0, 0)' });
        first.unmount();

        const second = setup({ defaultOpen: true, maxHeight: '50vh' });
        await settle();
        expect(getList()?.style.maxHeight).toBe('50vh');
        second.unmount();

        setup({ defaultOpen: true, maxHeight: 100, dropdownStyle: 'max-height: 10px' });
        await settle();
        expect(getList()?.style.maxHeight).toBe('10px');
    });

    it('弹层最小宽度跟随触发器；dropdownMatchSelectWidth 为 false 时没有；position 与 RTL 默认位置', async () => {
        const first = setup({ defaultOpen: true, position: 'top' });
        await settle();
        expect(getPopupWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'top');
        first.unmount();

        setup({ defaultOpen: true, dropdownMatchSelectWidth: false });
        await settle();
        expect(getPopupWrapper().style.minWidth).toBe('');
    });

    it('stopPropagation 默认阻止选项上的点击冒泡到 document，为 false 时不阻止', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        // after the mount: Svelte's own document listener is registered by it, and the popup's stop only starves later ones
        const first = setup({ defaultOpen: true });
        document.addEventListener('click', onClick);
        await settle();
        await click(getOptions()[0]);
        expect(onClick).not.toHaveBeenCalled();
        first.unmount();
        document.removeEventListener('click', onClick);

        setup({ defaultOpen: true, stopPropagation: false });
        document.addEventListener('click', onClick);
        await settle();
        await click(getOptions()[0]);
        expect(onClick).toHaveBeenCalled();
        document.removeEventListener('click', onClick);
    });
});

describe('Svelte AutoComplete 键盘', () => {
    it('ArrowDown 打开列表后移动高亮，循环并跳过禁用项，Enter 选中', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        setup({ onSelect }, { data: [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }] });
        await keyDown('ArrowDown');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toBeNull();
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBe(getOptions()[2]);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toBe(getOptions()[2]);
        await keyDown('Enter');
        expect(onSelect).toHaveBeenCalledWith('c');
        expect(getInput()).toHaveValue('c');
    });

    it('defaultActiveFirstOption 高亮第一项；首项禁用时 Enter 不选中；没有选项时 combobox 不指向不存在的选项', async () => {
        const first = setup({ defaultOpen: true, defaultActiveFirstOption: true });
        await settle();
        expect(getOptions()[0]).toHaveClass(`${optionCls}-focused`);
        expect(document.querySelectorAll(`.${optionCls}-focused`)).toHaveLength(1);
        first.unmount();

        const onSelect = vi.fn<(value: Selected) => void>();
        const second = setup({ defaultOpen: true, defaultActiveFirstOption: true, onSelect }, { data: [{ value: 'a', disabled: true }, { value: 'b' }] });
        await settle();
        await keyDown('Enter');
        expect(onSelect).not.toHaveBeenCalled();
        second.unmount();

        setup({ defaultOpen: true, defaultActiveFirstOption: true }, { data: [] });
        await settle();
        expect(getInput()).not.toHaveAttribute('aria-activedescendant');
    });

    it('Enter 选中后关闭；Escape 与 Tab 关闭并上报；列表关闭时 Tab 与 Escape 不上报', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { store } = setup({ onDropdownVisibleChange, defaultActiveFirstOption: true });
        await keyDown('Tab');
        await keyDown('Escape');
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        await keyDown('ArrowDown');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        await keyDown('Escape');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await vi.waitFor(() => expect(getList()).toBeNull());
        await keyDown('ArrowDown');
        await keyDown('Tab');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(getInput()).toHaveValue('semi');
        expect(store.log).toEqual(['change "semi"']);
        await vi.waitFor(() => expect(getList()).toBeNull());
    });

    it('AutoComplete 之外的按键不打开列表；onkeydown 在组件处理之后收到事件', async () => {
        const handled: boolean[] = [];
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>((event) => handled.push(event.defaultPrevented));
        setup({ onkeydown });
        await keyDown('ArrowDown', document.body);
        expect(getList()).toBeNull();
        await keyDown('ArrowDown');
        expect(onkeydown).toHaveBeenCalledTimes(1);
        expect(handled).toEqual([true]);
        expect(getList()).not.toBeNull();
    });

    it('面板里有可聚焦元素时，方向键只移动高亮，焦点留在输入框', async () => {
        const item = createRawSnippet<[{ item: AutoCompleteItems; index: number }]>((args) => ({ render: () => `<button type="button">${String(args().item)}</button>` }));
        setup({ defaultOpen: true, item });
        await settle();
        getInput().focus();
        await keyDown('ArrowDown');
        expect(getInput()).toHaveFocus();
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('combobox 暴露 expanded、controls、autocomplete 与 activedescendant，根 div 不重复', async () => {
        setup();
        const input = getInput();
        const root = getRoot();
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-haspopup', 'listbox');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(root).not.toHaveAttribute('aria-expanded');
        expect(root).not.toHaveAttribute('aria-controls');
        await click(input);
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(root).not.toHaveAttribute('aria-describedby');
        expect(getList()).toHaveAttribute('id', input.getAttribute('aria-controls'));
        expect(getList()).toHaveAttribute('role', 'listbox');
        await keyDown('ArrowDown');
        const focused = getFocusedOption() as HTMLElement;
        expect(focused).toHaveAttribute('role', 'option');
        expect(input).toHaveAttribute('aria-activedescendant', focused.id);
        expect(new Set(getOptions().map((option) => option.id)).size).toBe(getOptions().length);
    });

    it('键盘高亮项 aria-selected 为 true 且没有 selected 类', async () => {
        setup({ defaultOpen: true, defaultActiveFirstOption: true });
        await settle();
        const [first, second] = getOptions();
        expect(first).toHaveAttribute('aria-selected', 'true');
        expect(first).not.toHaveClass(`${optionCls}-selected`);
        expect(second).toHaveAttribute('aria-selected', 'false');
        await keyDown('ArrowDown');
        expect(first).toHaveAttribute('aria-selected', 'false');
        expect(second).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Svelte AutoComplete 名称与事件', () => {
    it('combobox 与 listbox 使用同一个名称来源', async () => {
        const first = setup({ defaultOpen: true, 'aria-label': 'Cities', insetLabel: html('<span>City</span>') });
        await settle();
        expect(getInput()).toHaveAccessibleName('Cities');
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Cities');
        expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        first.unmount();

        const label = document.body.appendChild(document.createElement('span'));
        label.id = 'outer';
        label.textContent = 'Outer';
        const second = setup({ defaultOpen: true, 'aria-label': undefined, 'aria-labelledby': 'outer', insetLabel: html('<span>City</span>') } as AutoCompleteProps);
        await settle();
        expect(getInput()).toHaveAccessibleName('Outer');
        expect(screen.getByRole('listbox')).toHaveAccessibleName('Outer');
        second.unmount();
        label.remove();

        setup({ defaultOpen: true, 'aria-label': undefined } as AutoCompleteProps);
        await settle();
        expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
    });

    it('<label for> 命名 combobox；不传 id 时 input 仍有 id', async () => {
        const first = setup({ 'aria-label': undefined, id: 'city' } as AutoCompleteProps);
        const label = document.body.appendChild(document.createElement('label'));
        label.htmlFor = 'city';
        label.textContent = 'City';
        expect(screen.getByRole('combobox', { name: 'City' })).toBeInTheDocument();
        label.remove();
        first.unmount();

        setup();
        expect(getInput().id).not.toBe('');
    });

    it('输入发出 onSearch 与 onChange 各一次并打开列表；输入后高亮仍为匹配的候选项', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        const { store } = setup({ onSearch });
        await type('semi');
        expect(onSearch.mock.calls).toEqual([['semi']]);
        expect(store.log).toEqual(['change "semi"']);
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('focus、blur 在焦点进出输入框时各发一次', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        setup({ onFocus, onBlur });
        await fireEvent.focusIn(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
        expect(onBlur).not.toHaveBeenCalled();
        await fireEvent.focusOut(getInput());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
    });

    it('autofocus 挂载后聚焦输入框并发出一次 focus', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        setup({ autofocus: true, onFocus });
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveFocus();
    });

    it('使用方的 onclick 被调用，组件自己的点击处理照常打开列表', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({ onclick });
        await click(getInput());
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(getList()).not.toBeNull();
    });

    it('showClear：清除按钮清空 input，上报一次无载荷的 onClear 与空搜索', async () => {
        const onClear = vi.fn<() => void>();
        const onSearch = vi.fn<(value: string) => void>();
        const { store } = setup({ onClear, onSearch, showClear: true }, { value: 'semi', mode: 'bind' });
        await mouseDown(getClearButton());
        expect(getInput()).toHaveValue('');
        expect(onClear.mock.calls).toEqual([[]]);
        expect(onSearch).toHaveBeenLastCalledWith('');
        expect(store.log.at(-1)).toBe('change ""');
        expect(store.value).toBe('');
    });

    it('Tab 可到达有名称的清除按钮，Enter 清空', async () => {
        const onClear = vi.fn<() => void>();
        setup({ onClear, showClear: true }, { value: 'semi', mode: 'bind' });
        const clear = screen.getByRole('button', { name: '清空输入' });
        clear.focus();
        await fireEvent.click(clear, { detail: 0 });
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
    });

    it('点击外部关闭列表，选项与触发器内的 mousedown 不关闭，卸载后 document 上的 mousedown 不再触达', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { unmount } = setup({ defaultOpen: true, onDropdownVisibleChange });
        await settle();
        await mouseDown(getOptions()[0]);
        await mouseDown(getInput());
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        await mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        await vi.waitFor(() => expect(getList()).toBeNull());
        await keyDown('ArrowDown');
        unmount();
        await fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true]]);
    });

    it('listbox 与选项上的 mousedown 都阻止默认行为，焦点不离开输入框', async () => {
        setup({ defaultOpen: true });
        await settle();
        const prevented = (target: Element) => {
            const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
            target.dispatchEvent(event);
            return event.defaultPrevented;
        };
        expect(prevented(getOptions()[0])).toBe(true);
        expect(prevented(screen.getByRole('listbox'))).toBe(true);
    });
});

describe('Svelte AutoComplete data 变化', () => {
    it('data 换新数组与原地修改后候选项更新；内容相同的新数组不重算高亮', async () => {
        const { store } = setup({ defaultOpen: true }, { data: ['semi', { value: 'b', label: 'B' }] });
        await settle();
        expect(getOptionTexts()).toEqual(['semi', 'B']);
        store.data.push('design');
        await settle();
        expect(getOptionTexts()).toEqual(['semi', 'B', 'design']);
        (store.data[1] as { label: string }).label = 'Bee';
        await settle();
        expect(getOptionTexts()).toEqual(['semi', 'Bee', 'design']);

        // hovering highlights a row; an equal new array must not re-run the data change that resets the highlight
        await fireEvent.mouseEnter(getOptions()[2]);
        store.data = ['semi', { value: 'b', label: 'Bee' }, 'design'];
        await settle();
        expect(getFocusedOption()).toBe(getOptions()[2]);

        store.data = [{ label: 'new', value: 'new' }];
        await settle();
        expect(getOptionTexts()).toEqual(['new']);
    });

    it('defaultActiveFirstOption 高亮输入后加载的数据的第一项（Fix2951）', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const { store } = setup({ defaultActiveFirstOption: true, onSelect }, { data: [] });
        const search = async (value: string, results: string[]) => {
            await type(value);
            store.data = results;
            await settle();
        };
        await search('1.6', ['1.60', '1.62', '1.63', '1.64']);
        expect(getOptionTexts()).toEqual(['1.60', '1.62', '1.63', '1.64']);
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await search('1.62', ['1.62']);
        expect(getOptionTexts()).toEqual(['1.62']);
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await keyDown('Enter');
        expect(onSelect).toHaveBeenCalledWith('1.62');
    });
});

describe('Svelte AutoComplete trigger snippet', () => {
    // `capture` receives the snippet's argument getter, which stays current as the state changes
    const triggerSnippet = (capture: (get: () => AutoCompleteTriggerSnippetProps) => void = () => undefined) =>
        createRawSnippet<[AutoCompleteTriggerSnippetProps]>((args) => ({
            render: () => '<div class="custom-trigger"><input class="custom-input" /><button type="button" class="custom-clear"></button></div>',
            setup: (node) => {
                capture(args);
                const input = node.querySelector('input') as HTMLInputElement;
                const handleInput = () => args().onChange(input.value);
                const handleFocus = (event: FocusEvent) => args().onFocus(event);
                const handleBlur = (event: FocusEvent) => args().onBlur(event);
                const handleClear = (event: Event) => {
                    event.stopPropagation();
                    args().onClear();
                };
                input.addEventListener('input', handleInput);
                input.addEventListener('focus', handleFocus);
                input.addEventListener('blur', handleBlur);
                node.querySelector('button')?.addEventListener('click', handleClear);
            },
        }));

    it('trigger 替换输入框，id 落在根 div，aria 经 controlAttrs 交给触发器，name 丢弃，根 div 包住触发器', async () => {
        let received: (() => AutoCompleteTriggerSnippetProps) | undefined;
        setup({ trigger: triggerSnippet((get) => (received = get)), id: 'tid', name: 'tname', 'aria-label': 'Pick', 'aria-describedby': 'desc', placeholder: 'pick' } as AutoCompleteProps);
        await settle();
        expect(document.querySelector('input.semi-input')).toBeNull();
        const root = document.querySelector('.custom-trigger')?.parentElement;
        expect(root).toHaveAttribute('id', 'tid');
        expect(root).toHaveAttribute('tabindex', '-1');
        expect(root).not.toHaveClass(prefixCls);
        expect(received?.().controlAttrs).toEqual({ 'aria-describedby': 'desc', 'aria-label': 'Pick' });
        expect(received?.().placeholder).toBe('pick');
        expect(document.querySelector('[name]')).toBeNull();
    });

    it('trigger 的 onChange 更新输入文本并打开列表，点选后 value 随选中变化，onClear 上报', async () => {
        let received: (() => AutoCompleteTriggerSnippetProps) | undefined;
        const onSearch = vi.fn<(value: string) => void>();
        const onClear = vi.fn<() => void>();
        const { store } = setup({ trigger: triggerSnippet((get) => (received = get)), onSearch, onClear });
        await settle();
        expect(received?.().value).toEqual([]);
        const input = document.querySelector<HTMLInputElement>('.custom-input') as HTMLInputElement;
        await type('se', input);
        expect(onSearch).toHaveBeenLastCalledWith('se');
        expect(store.log.at(-1)).toBe('change "se"');
        expect(received?.().inputValue).toBe('se');
        expect(getList()).not.toBeNull();
        await click(getOptions()[2]);
        expect(received?.().value.map((entry) => entry.label)).toEqual(['design']);
        await click(document.querySelector('.custom-clear'));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('点击自定义触发器打开列表；内部按钮按 Enter、Space、ArrowDown 不打开列表但照常发出 keydown', async () => {
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>();
        setup({ trigger: triggerSnippet(), onkeydown });
        await settle();
        const button = document.querySelector('.custom-clear') as HTMLElement;
        await keyDown('Enter', button);
        await keyDown(' ', button);
        await keyDown('ArrowDown', button);
        expect(onkeydown).toHaveBeenCalledTimes(3);
        expect(getList()).toBeNull();
        await click(document.querySelector('.custom-trigger'));
        expect(getOptionTexts()).toEqual(stringData);
    });
});

describe('Svelte AutoComplete 实例', () => {
    it('getNativeElement 是根 div，focus 聚焦输入框', async () => {
        const { api } = setup();
        expect(api()?.getNativeElement()).toBe(getRoot());
        api()?.focus();
        expect(getInput()).toHaveFocus();
    });
});
