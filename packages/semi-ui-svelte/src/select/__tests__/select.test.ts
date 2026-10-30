import { createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { SelectOptionItemSnippetProps, SelectOptionProps, SelectProps, SelectValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import SelectCase from './select-case.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

const prefixCls = 'semi-select';

const defaultList: SelectOptionProps[] = [
    { value: 'abc', label: 'Abc' },
    { value: 'hotsoon', label: 'Hotsoon' },
    { value: 'pipixia', label: 'Pipixia' },
    { value: 'toutiao', label: 'TopBuzz' },
];

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(props: Omit<SelectProps, 'value' | 'optionList'> = {}, { value, mode = value === undefined ? 'uncontrolled' : 'one-way', optionList = defaultList, accept = true }: { mode?: Mode; value?: SelectValue; optionList?: SelectOptionProps[]; accept?: boolean } = {}) {
    const store = createStore<{ value?: SelectValue; accept: boolean; log: string[]; optionList: SelectOptionProps[] }>({ value, accept, log: [], optionList });
    const result = render(SelectCase, { props: { mode, store, props } });
    flushSync();
    const api = () => {
        const handle = result.component.api();
        if (!handle) throw new Error('Select is not mounted');
        return handle;
    };
    return { store, api, ...result };
}

const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getTrigger = () => screen.getByRole('combobox');
const getOptions = () => screen.queryAllByRole('option');
const getOptionTexts = () => getOptions().map((option) => option.textContent?.trim());
const getSelectionText = () => document.querySelector(`.${prefixCls}-selection-text`)?.textContent?.trim();
const getTagTexts = () => [...document.querySelectorAll(`.${prefixCls}-selection .semi-tag-content`)].map((tag) => tag.textContent?.trim());
const getTriggerInput = () => document.querySelector(`.${prefixCls} input`) as HTMLInputElement;

async function clickTrigger() {
    await fireEvent.click(getRoot());
    await settle();
}

async function keyDown(key: string, target: Element = getTrigger()) {
    await fireEvent.keyDown(target, { key });
    await settle();
}

async function search(text: string) {
    const input = getTriggerInput();
    input.value = text;
    await fireEvent.input(input);
    await settle();
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Select 渲染', () => {
    it('class、style 与 data-* 落在根元素，aria-label 落在 combobox', () => {
        setup({ class: 'custom', style: 'color: red', 'data-x': '1' } as SelectProps);
        const root = getRoot();
        expect(root).toHaveClass(prefixCls, 'custom', `${prefixCls}-single`);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-x', '1');
        expect(getTrigger()).toBe(root);
        expect(root).toHaveAttribute('aria-label', 'Fruit');
    });

    it('placeholder、size、validateStatus、borderless 与 showArrow', () => {
        setup({ placeholder: '请选择', size: 'small', validateStatus: 'error', borderless: true, showArrow: false });
        const root = getRoot();
        expect(getSelectionText()).toBe('请选择');
        expect(root).toHaveClass(`${prefixCls}-small`, `${prefixCls}-error`, `${prefixCls}-borderless`, `${prefixCls}-no-arrow`);
        expect(root.querySelector(`.${prefixCls}-arrow`)).toBeNull();
        expect(root.querySelector(`.${prefixCls}-arrow-empty`)).not.toBeNull();
    });

    it('prefix 与 suffix snippet 渲染在触发器两侧', async () => {
        setup({ prefix: createRawSnippet(() => ({ render: () => '<span>前</span>' })), suffix: createRawSnippet(() => ({ render: () => '<span>后</span>' })) });
        await settle();
        const root = getRoot();
        expect(root).toHaveClass(`${prefixCls}-with-prefix`, `${prefixCls}-with-suffix`);
        expect(root.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent('前');
        expect(root.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('后');
    });

    it('读取全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Select: { placeholder: '全局占位', size: 'large' } };
        setup();
        expect(getSelectionText()).toBe('全局占位');
        expect(getRoot()).toHaveClass(`${prefixCls}-large`);
    });
});

describe('Svelte Select 打开与选择', () => {
    it('点击触发器打开选项列表并发出 onDropdownVisibleChange', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        setup({ onDropdownVisibleChange });
        expect(screen.queryByRole('listbox')).toBeNull();
        await clickTrigger();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('defaultOpen 挂载即打开', async () => {
        setup({ defaultOpen: true });
        await settle();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('disabled 时点击不打开，标记 aria-disabled', async () => {
        setup({ disabled: true });
        await clickTrigger();
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-disabled', 'true');
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
    });

    it('方向键高亮、Enter 选中：先发 onSelect 再发 onChange，关闭并显示 label', async () => {
        const calls: string[] = [];
        setup({ onSelect: (value) => calls.push(`select ${value}`), onChange: (value) => calls.push(`change ${value}`) });
        await keyDown('ArrowDown');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        await keyDown('ArrowDown');
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getOptions()[1].id);
        await keyDown('Enter');
        expect(calls).toEqual(['select hotsoon', 'change hotsoon']);
        expect(getSelectionText()).toBe('Hotsoon');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('点击选项选中', async () => {
        const { store } = setup();
        await clickTrigger();
        await fireEvent.click(getOptions()[2]);
        await settle();
        expect(store.log).toEqual(['change "pipixia"']);
        expect(getSelectionText()).toBe('Pipixia');
    });

    it('禁用的选项不能被选中', async () => {
        const { store } = setup(
            {},
            {
                optionList: [
                    { value: 'a', label: 'A', disabled: true },
                    { value: 'b', label: 'B' },
                ],
            }
        );
        await clickTrigger();
        expect(getOptions()[0]).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.click(getOptions()[0]);
        await settle();
        expect(store.log).toEqual([]);
    });

    it('Escape 关闭列表', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        setup({ onDropdownVisibleChange });
        await clickTrigger();
        await keyDown('Escape');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('onChangeWithObject 时 onChange 收到选项记录', async () => {
        const { store } = setup({ onChangeWithObject: true });
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.log).toEqual(['change {"value":"abc","label":"Abc"}']);
        expect(getSelectionText()).toBe('Abc');
    });
});

describe('Svelte Select 受控值的四种写法', () => {
    it('bind:value 双向同步，父级推值更新显示', async () => {
        const { store } = setup({}, { mode: 'bind', value: 'abc' });
        expect(getSelectionText()).toBe('Abc');
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.value).toBe('hotsoon');
        expect(getSelectionText()).toBe('Hotsoon');
        store.value = 'toutiao';
        await settle();
        expect(getSelectionText()).toBe('TopBuzz');
    });

    it('函数绑定接受时写回，拒绝时保持原值', async () => {
        const { store } = setup({}, { mode: 'function', value: 'abc', accept: false });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.log).toEqual(['set "hotsoon"', 'change "hotsoon"']);
        expect(store.value).toBe('abc');
        expect(getSelectionText()).toBe('Abc');
        store.accept = true;
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.value).toBe('hotsoon');
        expect(getSelectionText()).toBe('Hotsoon');
    });

    it('单向传值只作初值，交互在本地覆盖，父级再推值时以父级为准', async () => {
        const { store } = setup({}, { mode: 'one-way', value: 'abc' });
        expect(getSelectionText()).toBe('Abc');
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.value).toBe('abc');
        expect(getSelectionText()).toBe('Hotsoon');
        store.value = 'pipixia';
        await settle();
        expect(getSelectionText()).toBe('Pipixia');
    });

    it('不传 value 时非受控', async () => {
        const { store } = setup({ placeholder: '空' });
        expect(getSelectionText()).toBe('空');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.log).toEqual(['change "abc"']);
        expect(getSelectionText()).toBe('Abc');
    });

    it('绑定的值改为 undefined 时显示 placeholder', async () => {
        const { store } = setup({ placeholder: '空' }, { mode: 'bind', value: 'abc' });
        store.value = undefined;
        await settle();
        expect(getSelectionText()).toBe('空');
    });

    it('optionList 变化后已选文案随之更新', async () => {
        const { store } = setup({}, { mode: 'bind', value: 'abc' });
        store.optionList = [{ value: 'abc', label: 'Renamed' }];
        await settle();
        expect(getSelectionText()).toBe('Renamed');
    });
});

describe('Svelte Select 多选', () => {
    it('多选连续选择，列表保持打开，标签可关闭', async () => {
        const onDeselect = vi.fn<(value: string | number, option: SelectOptionProps) => void>();
        const { store } = setup({ multiple: true, onDeselect }, { mode: 'bind', value: [] });
        await keyDown('ArrowDown');
        await keyDown('Enter');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(store.value).toEqual(['abc', 'hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
        const close = document.querySelector(`.${prefixCls}-selection .semi-tag-close`) as HTMLElement;
        await fireEvent.click(close);
        await settle();
        expect(store.value).toEqual(['hotsoon']);
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ value: 'abc', label: 'Abc' }));
    });

    it('maxTagCount 之外的标签收为 +N', () => {
        setup({ multiple: true, maxTagCount: 2 }, { value: ['abc', 'hotsoon', 'pipixia', 'toutiao'] });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('max 限制选择数量并发出 onExceed', async () => {
        const onExceed = vi.fn<(option: SelectOptionProps) => void>();
        const { store } = setup({ multiple: true, max: 1, onExceed }, { mode: 'bind', value: ['abc'] });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(onExceed).toHaveBeenCalledWith(expect.objectContaining({ value: 'hotsoon' }));
        expect(store.value).toEqual(['abc']);
    });

    it('Backspace 删除最后一个标签', async () => {
        const { store } = setup({ multiple: true, filter: true }, { mode: 'bind', value: ['abc', 'hotsoon'] });
        await keyDown('Backspace', getTriggerInput());
        expect(store.value).toEqual(['abc']);
    });
});

describe('Svelte Select 搜索与新建', () => {
    it('filter 为 true 时按输入过滤并高亮关键字，发出 onSearch', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        setup({ filter: true, onSearch });
        await clickTrigger();
        expect(getTriggerInput()).toHaveAttribute('role', 'combobox');
        await search('o');
        expect(getOptionTexts()).toEqual(['Hotsoon', 'TopBuzz']);
        expect(onSearch).toHaveBeenCalledWith('o', expect.any(Event));
        expect(document.querySelectorAll(`.${prefixCls}-option-keyword`).length).toBeGreaterThan(0);
        await search('');
        expect(getOptions()).toHaveLength(4);
    });

    it('filter 为函数时按函数过滤', async () => {
        setup({ filter: (input, option) => option.value === input });
        await clickTrigger();
        await search('pipixia');
        expect(getOptionTexts()).toEqual(['Pipixia']);
    });

    it('remote 时不在本地过滤', async () => {
        setup({ filter: true, remote: true });
        await clickTrigger();
        await search('zzz');
        expect(getOptions()).toHaveLength(4);
    });

    it('没有匹配项时显示语言包的空状态，emptyContent 为 null 时不显示', async () => {
        setup({ filter: true });
        await clickTrigger();
        await search('zzz');
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toHaveTextContent('暂无数据');
        document.body.innerHTML = '';
        setup({ filter: true, emptyContent: null });
        await clickTrigger();
        await search('zzz');
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toBeNull();
    });

    it('allowCreate 时把关键字作为新建项，Enter 选中并发出 onCreate', async () => {
        const onCreate = vi.fn<(option: SelectOptionProps) => void>();
        const { store } = setup({ filter: true, allowCreate: true, onCreate });
        await clickTrigger();
        await search('new');
        expect(getOptions()[0]).toHaveTextContent('创建new');
        await keyDown('Enter', getTriggerInput());
        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ value: 'new', label: 'new' }));
        expect(store.log).toEqual(['change "new"']);
    });

    it('searchPosition 为 dropdown 时搜索框在下拉中，触发器仍是 combobox', async () => {
        setup({ filter: true, searchPosition: 'dropdown' });
        await clickTrigger();
        const input = document.querySelector(`.${prefixCls}-dropdown-search-wrapper input`) as HTMLInputElement;
        expect(getRoot()).toHaveAttribute('role', 'combobox');
        expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
        input.value = 'top';
        await fireEvent.input(input);
        await settle();
        expect(getOptionTexts()).toEqual(['TopBuzz']);
    });
});

describe('Svelte Select 清除', () => {
    it('showClear 有值时渲染有名称的清除按钮，点击先发 onChange 再发 onClear', async () => {
        const calls: string[] = [];
        setup({ showClear: true, onClear: () => calls.push('clear'), onChange: (value) => calls.push(`change ${value}`) }, { mode: 'bind', value: 'abc' });
        const button = screen.getByRole('button', { name: '清空已选值' });
        await fireEvent.click(button);
        await settle();
        expect(calls).toEqual(['change undefined', 'clear']);
        expect(screen.queryByRole('button', { name: '清空已选值' })).toBeNull();
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('没有值或禁用时不渲染清除按钮', () => {
        setup({ showClear: true });
        expect(screen.queryByRole('button')).toBeNull();
        document.body.innerHTML = '';
        setup({ showClear: true, disabled: true }, { value: 'abc' });
        expect(screen.queryByRole('button')).toBeNull();
    });
});

describe('Svelte Select combobox 语义', () => {
    it('combobox 控制 listbox，两者同名；没有名称来源时回落到语言包', async () => {
        setup({ 'aria-label': undefined } as SelectProps);
        const trigger = getTrigger();
        expect(trigger).toHaveAttribute('aria-label', '选择');
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).not.toHaveAttribute('aria-activedescendant');
        await clickTrigger();
        const listbox = screen.getByRole('listbox');
        expect(trigger).toHaveAttribute('aria-controls', listbox.id);
        expect(listbox).toHaveAttribute('aria-label', '选择');
        expect(trigger).toHaveAttribute('aria-activedescendant', getOptions()[0].id);
        expect(document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')).toHaveAttribute('role', 'option');
    });

    it('aria-labelledby 优先，listbox 用同一来源', async () => {
        setup({ 'aria-labelledby': 'lbl' } as SelectProps);
        await clickTrigger();
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'lbl');
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'lbl');
    });

    it('id 为触发器及其选项命名', async () => {
        setup({ id: 'fruit' });
        await clickTrigger();
        expect(getTrigger()).toHaveAttribute('id', 'fruit');
        expect(getOptions()[1]).toHaveAttribute('id', 'fruit-option-1');
    });

    it('只有 insetLabel 时以它命名 combobox 与 listbox', async () => {
        setup({ 'aria-label': undefined, insetLabel: createRawSnippet(() => ({ render: () => '<span>水果</span>' })) } as SelectProps);
        await clickTrigger();
        const labelId = document.querySelector(`.${prefixCls}-inset-label`)?.id;
        expect(labelId).toBeTruthy();
        expect(getTrigger()).toHaveAttribute('aria-labelledby', labelId);
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', labelId);
    });

    it('加载中只显示 Spin，combobox 不输出 aria-activedescendant', async () => {
        setup({ loading: true });
        await clickTrigger();
        expect(document.querySelector(`.${prefixCls}-loading-wrapper .semi-spin`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });
});

describe('Svelte Select snippet', () => {
    it('optionItem 替换整行，参数带 id 与选中状态', async () => {
        const optionItem = createRawSnippet((scope: () => SelectOptionItemSnippetProps) => ({
            render: () => `<div role="option" id="${scope().id}" aria-selected="${scope().selected}">custom ${scope().label}</div>`,
            setup: (node) => {
                node.addEventListener('click', (event) => scope().onclick(event as MouseEvent));
            },
        }));
        const { store } = setup({ optionItem }, { value: 'abc' });
        await clickTrigger();
        expect(getOptionTexts()).toEqual(['custom Abc', 'custom Hotsoon', 'custom Pipixia', 'custom TopBuzz']);
        expect(getOptions()[0]).toHaveAttribute('aria-selected', 'true');
        await fireEvent.click(getOptions()[1]);
        await settle();
        expect(store.log).toEqual(['change "hotsoon"']);
    });

    it('selectedItem 渲染单选的已选内容', () => {
        setup({ selectedItem: createRawSnippet((scope: () => { option: SelectOptionProps }) => ({ render: () => `<b>${scope().option.label}!</b>` })) }, { value: 'abc' });
        expect(getSelectionText()).toBe('Abc!');
    });

    it('面板的四个插槽位置', async () => {
        const slot = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));
        setup({ outerTopSlot: slot('ot'), innerTopSlot: slot('it'), innerBottomSlot: slot('ib'), outerBottomSlot: slot('ob') });
        await clickTrigger();
        const listbox = screen.getByRole('listbox');
        expect(within(listbox).getByText('it')).toBeInTheDocument();
        expect(within(listbox).getByText('ib')).toBeInTheDocument();
        expect(listbox.contains(screen.getByText('ot'))).toBe(false);
        expect(listbox.contains(screen.getByText('ob'))).toBe(false);
    });
});

const fruits = { key: 'fruits', label: 'Fruits' };
const vegetables = { key: 'vegetables', label: 'Vegetables' };
const groupedList: SelectOptionProps[] = [
    { value: 'apple', label: 'Apple', group: fruits },
    { value: 'banana', label: 'Banana', group: fruits },
    { value: 'carrot', label: 'Carrot', group: vegetables },
    { value: 'leek', label: 'Leek', group: vegetables, disabled: true },
    { value: 'rice', label: 'Rice' },
];

const getGroups = () => screen.queryAllByRole('group');

describe('Svelte Select 分组与 optionLabel', () => {
    it('分组渲染为 role="group"，aria-labelledby 指向组标题，选项在组内', async () => {
        setup({}, { optionList: groupedList });
        await clickTrigger();
        const groups = getGroups();
        expect(groups).toHaveLength(2);
        expect(screen.getByRole('group', { name: 'Fruits' })).toBe(groups[0]);
        expect(screen.getByRole('group', { name: 'Vegetables' })).toBe(groups[1]);
        const title = document.getElementById(groups[0].getAttribute('aria-labelledby') as string);
        expect(title).toHaveClass(`${prefixCls}-group`);
        expect(title).toHaveTextContent('Fruits');
        expect(
            within(groups[0])
                .getAllByRole('option')
                .map((option) => option.textContent?.trim())
        ).toEqual(['Apple', 'Banana']);
        expect(
            within(groups[1])
                .getAllByRole('option')
                .map((option) => option.textContent?.trim())
        ).toEqual(['Carrot', 'Leek']);
        // the entry without a group sits directly in the listbox
        expect(groups.some((group) => group.contains(screen.getByRole('option', { name: 'Rice' })))).toBe(false);
        expect(getOptionTexts()).toEqual(['Apple', 'Banana', 'Carrot', 'Leek', 'Rice']);
    });

    it('groupLabel snippet 替换组标题，参数带 group', async () => {
        const groupLabel = createRawSnippet((scope: () => { group: { key: string | number; label?: string | number } }) => ({ render: () => `<b>${scope().group.key}: ${scope().group.label}</b>` }));
        setup({ groupLabel }, { optionList: groupedList });
        await clickTrigger();
        expect(screen.getByRole('group', { name: 'fruits: Fruits' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-group`)).toHaveAttribute('x-semi-prop', 'groupLabel');
    });

    it('没有 label 的分组不渲染标题与 role="group"', async () => {
        setup({}, { optionList: [{ value: 'a', label: 'A', group: { key: 'g' } }] });
        await clickTrigger();
        expect(getGroups()).toHaveLength(0);
        expect(getOptionTexts()).toEqual(['A']);
    });

    it('搜索后没有可见选项的组整组隐藏；搜索组名时显示整组', async () => {
        setup({ filter: true }, { optionList: groupedList });
        await clickTrigger();
        await search('car');
        expect(getGroups()).toHaveLength(1);
        expect(screen.getByRole('group', { name: 'Vegetables' })).toBeInTheDocument();
        expect(getOptionTexts()).toEqual(['Carrot']);
        await search('fruit');
        expect(getGroups()).toHaveLength(1);
        expect(getOptionTexts()).toEqual(['Apple', 'Banana']);
        await search('zzz');
        expect(getGroups()).toHaveLength(0);
    });

    it('方向键跨组移动高亮，跳过禁用项，Enter 选中的是当前组内的项', async () => {
        const { store } = setup({}, { mode: 'bind', optionList: groupedList });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        const active = () => document.getElementById(getTrigger().getAttribute('aria-activedescendant') ?? '') as HTMLElement;
        expect(active()).toHaveTextContent('Carrot');
        expect(active().closest('[role="group"]')).toBe(screen.getByRole('group', { name: 'Vegetables' }));
        await keyDown('ArrowDown');
        expect(active()).toHaveTextContent('Rice');
        await keyDown('ArrowUp');
        await keyDown('ArrowUp');
        expect(active()).toHaveTextContent('Banana');
        expect(active().closest('[role="group"]')).toBe(screen.getByRole('group', { name: 'Fruits' }));
        await keyDown('Enter');
        expect(store.value).toBe('banana');
    });

    it('多选的 selectAll 选中各组内所有可用项', async () => {
        const { api, store } = setup({ multiple: true }, { mode: 'bind', value: [], optionList: groupedList });
        api().open();
        await settle();
        api().selectAll();
        await settle();
        expect(store.value).toEqual(['apple', 'banana', 'carrot', 'rice']);
        const selected = (name: string) =>
            within(screen.getByRole('group', { name }))
                .getAllByRole('option')
                .map((option) => option.getAttribute('aria-selected'));
        expect(selected('Fruits')).toEqual(['true', 'true']);
        expect(selected('Vegetables')).toEqual(['true', 'false']);
    });

    it('回调里的选项不带内部的 _parentGroup，保留 group', async () => {
        const onSelect = vi.fn<(value: string | number, option: SelectOptionProps) => void>();
        setup({ onSelect }, { optionList: groupedList });
        await clickTrigger();
        await fireEvent.click(screen.getByRole('option', { name: 'Carrot' }));
        await settle();
        const option = onSelect.mock.calls[0][1];
        expect(option.group).toEqual(vegetables);
        expect(option).not.toHaveProperty('_parentGroup');
    });

    it('filter、snippet 与 onChange 收到的选项不带 Select 的内部键', async () => {
        const internal = ['_show', '_selected', '_scrollIndex', '_parentGroup', '_keyInJsx', '_inputCreateOnly', '_notExist'];
        const internalKeys = (option: object) => Object.keys(option).filter((key) => internal.includes(key));
        const seen: object[] = [];
        const onChange = vi.fn<(value: SelectValue) => void>();
        const optionItem = createRawSnippet((scope: () => SelectOptionItemSnippetProps) => ({
            render: () => {
                seen.push({ ...scope() });
                return `<div role="option" id="${scope().id}" aria-selected="${scope().selected}">${scope().label}</div>`;
            },
            setup: (node) => {
                node.addEventListener('click', (event) => scope().onclick(event as MouseEvent));
            },
        }));
        const selectedItem = createRawSnippet((scope: () => { option: SelectOptionProps }) => ({
            render: () => {
                seen.push(scope().option);
                return '<span>tag</span>';
            },
        }));
        const filter = (_: string, option: SelectOptionProps) => {
            seen.push(option);
            return true;
        };
        setup({ multiple: true, onChangeWithObject: true, onChange, filter, optionItem, selectedItem }, { optionList: groupedList });
        await clickTrigger();
        await search('a');
        await fireEvent.click(screen.getByRole('option', { name: 'Carrot' }));
        await settle();
        expect(onChange).toHaveBeenCalled();
        seen.push(...(onChange.mock.calls[0][0] as object[]));
        expect(seen.length).toBeGreaterThan(2);
        expect(seen.flatMap(internalKeys)).toEqual([]);
    });

    it('optionLabel 只替换文字，行的 role、选中状态与点击不变', async () => {
        const optionLabel = createRawSnippet((scope: () => { option: SelectOptionProps }) => ({ render: () => `<em>${scope().option.label}!</em>` }));
        const { store } = setup({ optionLabel }, { mode: 'bind', value: 'banana', optionList: groupedList });
        await clickTrigger();
        const rows = getOptions();
        expect(rows.map((row) => row.textContent?.trim())).toEqual(['Apple!', 'Banana!', 'Carrot!', 'Leek!', 'Rice!']);
        expect(rows[1]).toHaveClass(`${prefixCls}-option`, `${prefixCls}-option-selected`);
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(rows[1].querySelector(`.${prefixCls}-option-icon`)).not.toBeNull();
        expect(rows[1].querySelector(`.${prefixCls}-option-text`)).toHaveAttribute('x-semi-prop', 'optionLabel');
        expect(rows[3]).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.click(rows[0]);
        await settle();
        expect(store.value).toBe('apple');
        // the trigger shows the plain label
        expect(getSelectionText()).toBe('Apple');
    });

    it('virtualize 下分组数据照常渲染选项，optionLabel 与键盘有效', async () => {
        const optionLabel = createRawSnippet((scope: () => { option: SelectOptionProps }) => ({ render: () => `<i>${scope().option.label}</i>` }));
        const optionList = Array.from({ length: 60 }, (_, index) => ({ value: index, label: `item ${index}`, group: index < 30 ? fruits : vegetables }));
        setup({ optionLabel, virtualize: { itemSize: 36, height: 72 } }, { optionList });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        expect(getOptions().length).toBeGreaterThan(0);
        expect(getOptions().length).toBeLessThan(10);
        expect(getOptions()[0]).toHaveTextContent('item 0');
        expect(getOptions()[0].querySelector('i')).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getOptions()[1].id);
    });
});

describe('Svelte Select virtualize 与对外方法', () => {
    it('virtualize 只渲染可视行', async () => {
        const optionList = Array.from({ length: 100 }, (_, index) => ({ value: index, label: `option ${index}` }));
        setup({ virtualize: { itemSize: 36, height: 72 } }, { optionList });
        await clickTrigger();
        expect(getOptions().length).toBeGreaterThan(0);
        expect(getOptions().length).toBeLessThan(10);
    });

    it('open、close、search、clearInput、selectAll 与 deselectAll', async () => {
        const { api, store } = setup({ multiple: true, filter: true }, { mode: 'bind', value: [], optionList: [...defaultList, { value: 'x', label: 'X', disabled: true }] });
        api().open();
        await settle();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        api().search('o');
        await settle();
        expect(getOptionTexts()).toEqual(['Hotsoon', 'TopBuzz']);
        api().selectAll();
        await settle();
        expect(store.value).toEqual(['hotsoon', 'toutiao']);
        api().clearInput();
        await settle();
        expect(getOptions()).toHaveLength(5);
        api().deselectAll();
        await settle();
        expect(store.value).toEqual([]);
        api().close();
        await settle();
        expect(screen.queryByRole('listbox')).toBeNull();
    });
});
