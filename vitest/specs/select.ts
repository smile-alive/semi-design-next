import { screen, waitFor, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export interface SelectSpecOption {
    value: string;
    label: string;
    disabled?: boolean;
    /** Title of the group the option belongs to; options of one group are adjacent */
    group?: string;
}

/** Framework-free Select props; each fixture renders `options` in a Select followed by a button named "after" */
export interface SelectSpecProps {
    options: SelectSpecOption[];
    /** `undefined` is uncontrolled */
    value?: string | string[];
    defaultValue?: string | string[];
    multiple?: boolean;
    max?: number;
    filter?: boolean;
    searchPosition?: 'trigger' | 'dropdown';
    allowCreate?: boolean;
    showClear?: boolean;
    disabled?: boolean;
    defaultOpen?: boolean;
    defaultActiveFirstOption?: boolean;
    /** Renders a button named "slot button" at the bottom of the dropdown, the only focusable element in it */
    bottomButton?: boolean;
    // Parameter types differ in width between frameworks, so callbacks take `unknown`
    onChange?: (value: unknown) => void;
    onSelect?: (value: unknown) => void;
    onDeselect?: (value: unknown) => void;
    onSearch?: (value: string) => void;
    onClear?: () => void;
    onExceed?: (option: unknown) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-select`;

const fruits: SelectSpecOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana', disabled: true },
    { value: 'cherry', label: 'Cherry' },
    { value: 'durian', label: 'Durian' },
];

const grouped: SelectSpecOption[] = [
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
];

export function selectSpec(mount: SpecMount<SelectSpecProps>, options: SpecOptions = {}) {
    defineSpec('Select（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<SelectSpecProps>;

        async function render(props: Partial<SelectSpecProps> = {}) {
            handle = await mount({ options: fruits, ...props });
            view = within(handle.container);
            return handle;
        }

        // Svelte keeps the whitespace around snippet text
        const textOf = (element: Element | null | undefined) => element?.textContent?.trim();
        const trigger = () => view.getByRole('combobox');
        const listbox = () => screen.queryByRole('listbox');
        const optionEls = () => screen.queryAllByRole('option');
        const labels = () => optionEls().map(textOf);
        const after = () => view.getByRole('button', { name: 'after' });
        const activeLabel = () => {
            const id = trigger().getAttribute('aria-activedescendant');
            return id ? textOf(document.getElementById(id)) : undefined;
        };
        // The text of the single selection, empty while the placeholder shows
        const selected = () => {
            const element = handle.container.querySelector(`.${prefix}-selection-text`);
            return element?.classList.contains(`${prefix}-selection-placeholder`) ? '' : textOf(element);
        };
        const tags = () => [...handle.container.querySelectorAll(`.${prefix}-selection .${BASE_CLASS_PREFIX}-tag-content`)].map(textOf);
        const searchInput = () => document.querySelector<HTMLInputElement>(`.${prefix}-dropdown-search-wrapper input`)!;
        const option = (label: string) => optionEls().find((element) => textOf(element) === label)!;

        const waitOpen = () => waitFor(() => expect(listbox()).not.toBeNull());
        const waitClosed = () => waitFor(() => expect(listbox()).toBeNull());
        async function open() {
            await userEvent.click(trigger());
            await waitOpen();
        }
        async function openByKey(key = '{ArrowDown}') {
            trigger().focus();
            await userEvent.keyboard(key);
            await waitOpen();
        }
        async function type(text: string) {
            await userEvent.keyboard(text);
        }

        test('select-only：触发器是 combobox，带 aria-haspopup="listbox" 与 aria-expanded，打开后 aria-controls 指向 listbox', async () => {
            await render();
            expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(trigger()).not.toHaveAttribute('aria-autocomplete');
            await open();
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(trigger().getAttribute('aria-controls')).toBe(listbox()!.id);
            expect(listbox()!.id).not.toBe('');
        });

        test('关闭时 aria-controls 要么不写，要么指向文档里存在的元素', async () => {
            await render();
            const controls = trigger().getAttribute('aria-controls');
            expect(controls === null || document.getElementById(controls) !== null).toBe(true);
        });

        test('选项是 option，禁用项带 aria-disabled，已选项带 aria-selected', async () => {
            await render({ defaultValue: 'cherry' });
            await open();
            expect(labels()).toEqual(['Apple', 'Banana', 'Cherry', 'Durian']);
            expect(option('Banana')).toHaveAttribute('aria-disabled', 'true');
            expect(option('Apple')).not.toHaveAttribute('aria-disabled', 'true');
            expect(option('Cherry')).toHaveAttribute('aria-selected', 'true');
            expect(option('Apple')).toHaveAttribute('aria-selected', 'false');
        });

        for (const [name, key] of [
            ['Enter', '{Enter}'],
            ['Space', ' '],
            ['ArrowDown', '{ArrowDown}'],
            ['ArrowUp', '{ArrowUp}'],
        ] as const) {
            test(`聚焦触发器后按 ${name} 打开面板，焦点留在触发器`, async () => {
                const onDropdownVisibleChange = vi.fn<NonNullable<SelectSpecProps['onDropdownVisibleChange']>>();
                await render({ onDropdownVisibleChange });
                await openByKey(key);
                expect(trigger()).toHaveAttribute('aria-expanded', 'true');
                expect(trigger()).toHaveFocus();
                expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
            });
        }

        test('开合各通知一次 onDropdownVisibleChange，参数是目标状态', async () => {
            const onDropdownVisibleChange = vi.fn<NonNullable<SelectSpecProps['onDropdownVisibleChange']>>();
            await render({ onDropdownVisibleChange });
            await open();
            await type('{Escape}');
            await waitClosed();
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('defaultOpen 默认打开面板', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        });

        test('disabled：点击与按键都不打开面板', async () => {
            const onDropdownVisibleChange = vi.fn<NonNullable<SelectSpecProps['onDropdownVisibleChange']>>();
            await render({ disabled: true, onDropdownVisibleChange });
            await userEvent.click(trigger());
            trigger().focus();
            await userEvent.keyboard('{ArrowDown}{Enter}');
            expect(listbox()).toBeNull();
            expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        });

        test('方向键移动高亮：焦点留在触发器，aria-activedescendant 指向当前项，跳过禁用项并循环', async () => {
            await render();
            await openByKey('{ArrowDown}');
            await waitFor(() => expect(activeLabel()).toBe('Apple'));
            await type('{ArrowDown}');
            expect(activeLabel()).toBe('Cherry');
            await type('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Apple');
            await type('{ArrowUp}');
            expect(activeLabel()).toBe('Durian');
            expect(trigger()).toHaveFocus();
        });

        test('Home 与 End 移到第一个和最后一个可用项', async () => {
            await render({
                options: [{ value: 'x', label: 'X', disabled: true }, ...fruits, { value: 'y', label: 'Y', disabled: true }],
            });
            await open();
            await type('{End}');
            await waitFor(() => expect(activeLabel()).toBe('Durian'));
            await type('{Home}');
            expect(activeLabel()).toBe('Apple');
        });

        // The clock is frozen in the test setup, so typed characters never time out and keep extending one search string
        test('typeahead：按字母移到以它开头的可用项，继续输入缩小范围', async () => {
            await render({
                options: [
                    { value: 'apple', label: 'Apple' },
                    { value: 'banana', label: 'Banana', disabled: true },
                    { value: 'cherry', label: 'Cherry' },
                    { value: 'cranberry', label: 'Cranberry' },
                ],
            });
            await open();
            await waitFor(() => expect(activeLabel()).toBe('Apple'));
            await type('c');
            expect(activeLabel()).toBe('Cherry');
            await type('r');
            expect(activeLabel()).toBe('Cranberry');
        });

        test('typeahead：只匹配禁用项时高亮不动', async () => {
            await render();
            await open();
            await waitFor(() => expect(activeLabel()).toBe('Apple'));
            await type('b');
            expect(activeLabel()).toBe('Apple');
        });

        test('关闭时按字母先打开面板并移到匹配项', async () => {
            await render();
            trigger().focus();
            await userEvent.keyboard('d');
            await waitOpen();
            expect(activeLabel()).toBe('Durian');
        });

        test('defaultActiveFirstOption：打开时高亮第一个可用项，首项禁用时跳过它', async () => {
            await render({
                options: [
                    { value: 'off', label: 'Off', disabled: true },
                    { value: 'on', label: 'On' },
                    { value: 'more', label: 'More' },
                ],
                defaultActiveFirstOption: true,
            });
            await open();
            await waitFor(() => expect(activeLabel()).toBe('On'));
            await type('{Enter}');
            expect(selected()).toBe('On');
        });

        test('defaultActiveFirstOption 为 false 时打开后没有高亮项，按 Enter 不选中', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            await render({ defaultActiveFirstOption: false, onChange });
            await open();
            expect(trigger()).not.toHaveAttribute('aria-activedescendant');
            await type('{Enter}');
            expect(onChange).not.toHaveBeenCalled();
        });

        test('有已选值时打开，高亮已选项', async () => {
            await render({ defaultValue: 'cherry' });
            await open();
            await waitFor(() => expect(activeLabel()).toBe('Cherry'));
        });

        test('Enter 选中高亮项：单选关闭面板，焦点留在触发器，onChange、onSelect 收到值', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<SelectSpecProps['onSelect']>>();
            await render({ defaultActiveFirstOption: false, onChange, onSelect });
            await openByKey();
            await type('{ArrowDown}{ArrowDown}{Enter}');
            await waitClosed();
            expect(onChange.mock.calls).toEqual([['cherry']]);
            expect(onSelect.mock.calls.map(([value]) => value)).toEqual(['cherry']);
            expect(selected()).toBe('Cherry');
            expect(trigger()).toHaveFocus();
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        });

        test('点击选项：单选关闭面板，禁用项点击无效', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            await render({ onChange });
            await open();
            await userEvent.click(option('Banana'));
            expect(onChange).not.toHaveBeenCalled();
            expect(listbox()).not.toBeNull();
            await userEvent.click(option('Durian'));
            await waitClosed();
            expect(onChange.mock.calls).toEqual([['durian']]);
            expect(selected()).toBe('Durian');
        });

        test('Escape 关闭面板，焦点仍在触发器', async () => {
            await render();
            await open();
            await type('{Escape}');
            await waitClosed();
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(trigger()).toHaveFocus();
        });

        test('面板里没有可聚焦元素时 Tab 关闭面板，焦点移到下一个可聚焦元素', async () => {
            await render();
            await open();
            await userEvent.tab();
            await waitClosed();
            expect(after()).toHaveFocus();
        });

        test('面板里有可聚焦元素时 Tab 进入面板，面板保持打开；在最后一个元素上再按 Tab 关闭面板，焦点回到触发器', async () => {
            await render({ bottomButton: true });
            await open();
            await userEvent.tab();
            const button = screen.getByRole('button', { name: 'slot button' });
            expect(button).toHaveFocus();
            expect(listbox()).not.toBeNull();
            await userEvent.tab();
            await waitClosed();
            expect(trigger()).toHaveFocus();
        });

        test('点击组件外部关闭面板，焦点留在被点击处', async () => {
            await render();
            await open();
            await userEvent.click(after());
            await waitClosed();
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(after()).toHaveFocus();
        });

        test('Tab 离开已关闭的面板后不会再打开', async () => {
            await render();
            await open();
            await type('{Escape}');
            await waitClosed();
            await userEvent.tab();
            expect(after()).toHaveFocus();
            expect(listbox()).toBeNull();
        });

        test('非受控：defaultValue 作为初始值，选择后更新', async () => {
            await render({ defaultValue: 'apple' });
            expect(selected()).toBe('Apple');
            await open();
            await userEvent.click(option('Cherry'));
            await waitClosed();
            expect(selected()).toBe('Cherry');
        });

        test('受控：value 决定显示，选择只上报 onChange，value 变化后更新，变回 undefined 清空', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            await render({ value: 'apple', onChange });
            expect(selected()).toBe('Apple');
            await open();
            await userEvent.click(option('Cherry'));
            await waitFor(() => expect(onChange.mock.calls).toEqual([['cherry']]));
            expect(selected()).toBe('Apple');
            await handle.update({ value: 'durian' });
            expect(selected()).toBe('Durian');
            await handle.update({ value: undefined });
            expect(selected()).toBe('');
        });

        test('props 更新 options 后下拉里的选项随之变化', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            expect(labels()).toEqual(['Apple', 'Banana', 'Cherry', 'Durian']);
            await handle.update({ options: [{ value: 'elder', label: 'Elder' }, ...fruits.slice(0, 1)] });
            await waitFor(() => expect(labels()).toEqual(['Elder', 'Apple']));
        });

        test('分组：选项在带标题的 group 里，group 的 aria-labelledby 指向标题', async () => {
            await render({ options: grouped, defaultOpen: true });
            await waitOpen();
            const groups = screen.getAllByRole('group');
            expect(groups).toHaveLength(2);
            expect(groups.map((group) => textOf(document.getElementById(group.getAttribute('aria-labelledby')!)))).toEqual(['Fruits', 'Vegetables']);
            expect(within(groups[0]).getAllByRole('option').map(textOf)).toEqual(['Apple', 'Banana']);
            expect(within(groups[1]).getAllByRole('option').map(textOf)).toEqual(['Carrot']);
        });

        test('multiple：点击选项后保持打开，onChange 收到数组，onSelect 与 onDeselect 收到选项值', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<SelectSpecProps['onSelect']>>();
            const onDeselect = vi.fn<NonNullable<SelectSpecProps['onDeselect']>>();
            await render({ multiple: true, onChange, onSelect, onDeselect });
            await open();
            await userEvent.click(option('Apple'));
            await userEvent.click(option('Cherry'));
            expect(listbox()).not.toBeNull();
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(tags()).toEqual(['Apple', 'Cherry']);
            expect(onChange.mock.calls).toEqual([[['apple']], [['apple', 'cherry']]]);
            expect(onSelect.mock.calls.map(([value]) => value)).toEqual(['apple', 'cherry']);
            await userEvent.click(option('Apple'));
            expect(tags()).toEqual(['Cherry']);
            expect(onDeselect.mock.calls.map(([value]) => value)).toEqual(['apple']);
            expect(onChange).toHaveBeenLastCalledWith(['cherry']);
        });

        test('multiple：键盘 Enter 切换高亮项并保持打开', async () => {
            await render({ multiple: true, defaultActiveFirstOption: false });
            await openByKey();
            await type('{ArrowDown}{Enter}');
            expect(tags()).toEqual(['Apple']);
            expect(listbox()).not.toBeNull();
            await type('{Enter}');
            expect(tags()).toEqual([]);
            expect(listbox()).not.toBeNull();
        });

        test('multiple：受控 value 决定标签，选择只上报 onChange', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            await render({ multiple: true, value: ['apple'], onChange });
            expect(tags()).toEqual(['Apple']);
            await open();
            await userEvent.click(option('Cherry'));
            expect(onChange.mock.calls).toEqual([[['apple', 'cherry']]]);
            expect(tags()).toEqual(['Apple']);
            await handle.update({ value: ['cherry', 'durian'] });
            expect(tags()).toEqual(['Cherry', 'Durian']);
            await handle.update({ value: undefined });
            expect(tags()).toEqual([]);
        });

        test('multiple 配合 max：达到上限后再选择只调用 onExceed，值不变', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            const onExceed = vi.fn<NonNullable<SelectSpecProps['onExceed']>>();
            await render({ multiple: true, max: 2, defaultValue: ['apple', 'cherry'], onChange, onExceed });
            await open();
            await userEvent.click(option('Durian'));
            expect(onExceed).toHaveBeenCalledTimes(1);
            expect(onExceed.mock.calls[0][0]).toMatchObject({ value: 'durian' });
            expect(onChange).not.toHaveBeenCalled();
            expect(tags()).toEqual(['Apple', 'Cherry']);
        });

        test('showClear：有值时悬停出现清除按钮，点击清空并调用 onClear，不打开面板', async () => {
            const onClear = vi.fn<NonNullable<SelectSpecProps['onClear']>>();
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            await render({ defaultValue: 'apple', showClear: true, onClear, onChange });
            await userEvent.hover(trigger());
            await userEvent.click(handle.container.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)!);
            expect(selected()).toBe('');
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(listbox()).toBeNull();
        });

        test('showClear：没有值时不出现清除按钮', async () => {
            await render({ showClear: true });
            await userEvent.hover(trigger());
            expect(handle.container.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).toBeNull();
        });

        test('editable：打开后输入框是 combobox，带 aria-autocomplete="list"，aria-controls 指向 listbox', async () => {
            await render({ filter: true });
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            trigger().focus();
            await userEvent.keyboard('{ArrowDown}');
            await waitOpen();
            expect(trigger().tagName).toBe('INPUT');
            expect(trigger()).toHaveAttribute('aria-autocomplete', 'list');
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(trigger().getAttribute('aria-controls')).toBe(listbox()!.id);
        });

        test('editable：输入过滤选项并调用 onSearch，焦点留在输入框，高亮落在第一个匹配项，Enter 选中', async () => {
            const onSearch = vi.fn<NonNullable<SelectSpecProps['onSearch']>>();
            await render({ filter: true, onSearch });
            await open();
            await userEvent.keyboard('ch');
            await waitFor(() => expect(labels()).toEqual(['Cherry']));
            expect(onSearch.mock.calls.map(([value]) => value)).toEqual(['c', 'ch']);
            expect(trigger()).toHaveFocus();
            await waitFor(() => expect(activeLabel()).toBe('Cherry'));
            await type('{Enter}');
            await waitClosed();
            expect(selected()).toBe('Cherry');
        });

        test('editable：没有匹配项时显示空状态，没有高亮项', async () => {
            await render({ filter: true });
            await open();
            await userEvent.keyboard('zzz');
            await waitFor(() => expect(optionEls()).toHaveLength(0));
            expect(trigger()).not.toHaveAttribute('aria-activedescendant');
        });

        test('editable：Space 与 Home、End 留给输入框，不打开面板也不改高亮', async () => {
            await render({ filter: true });
            await open();
            await userEvent.keyboard('a b{Home}{End}');
            expect(trigger()).toHaveValue('a b');
            expect(listbox()).not.toBeNull();
        });

        test('editable：Escape 关闭面板，焦点仍在输入框', async () => {
            await render({ filter: true });
            await open();
            await type('{Escape}');
            await waitClosed();
            expect(trigger()).toHaveFocus();
        });

        test('editable：关闭面板后搜索词清空，选项恢复完整', async () => {
            await render({ filter: true });
            await open();
            await userEvent.keyboard('che');
            await waitFor(() => expect(labels()).toEqual(['Cherry']));
            await type('{Escape}');
            await waitClosed();
            await open();
            expect(trigger()).toHaveValue('');
            expect(labels()).toEqual(['Apple', 'Banana', 'Cherry', 'Durian']);
        });

        test('editable：点击外部关闭面板，焦点留在被点击处，搜索词清空', async () => {
            await render({ filter: true });
            await open();
            await userEvent.keyboard('che');
            await userEvent.click(after());
            await waitClosed();
            expect(after()).toHaveFocus();
            await open();
            expect(trigger()).toHaveValue('');
        });

        test('editable multiple：选中后保持打开，搜索词默认清空', async () => {
            await render({ filter: true, multiple: true });
            await open();
            await userEvent.keyboard('ch');
            await waitFor(() => expect(labels()).toEqual(['Cherry']));
            await userEvent.click(option('Cherry'));
            expect(tags()).toEqual(['Cherry']);
            expect(trigger()).toHaveValue('');
            expect(listbox()).not.toBeNull();
        });

        test('searchPosition="dropdown"：搜索框在下拉里，输入过滤选项并调用 onSearch', async () => {
            const onSearch = vi.fn<NonNullable<SelectSpecProps['onSearch']>>();
            await render({ filter: true, searchPosition: 'dropdown', defaultOpen: true, onSearch });
            await waitOpen();
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(handle.container.contains(searchInput())).toBe(false);
            await userEvent.type(searchInput(), 'ch');
            await waitFor(() => expect(labels()).toEqual(['Cherry']));
            expect(onSearch.mock.calls.map(([value]) => value)).toEqual(['c', 'ch']);
        });

        test('searchPosition="dropdown"：在搜索框里 Enter 选中过滤后的高亮项，面板关闭，焦点回到触发器', async () => {
            await render({ filter: true, searchPosition: 'dropdown', defaultOpen: true });
            await waitOpen();
            await userEvent.type(searchInput(), 'ch');
            await waitFor(() => expect(labels()).toEqual(['Cherry']));
            await type('{Enter}');
            await waitClosed();
            expect(selected()).toBe('Cherry');
            expect(trigger()).toHaveFocus();
        });

        test('searchPosition="dropdown"：在搜索框里 Escape 关闭面板，焦点回到触发器', async () => {
            await render({ filter: true, searchPosition: 'dropdown', defaultOpen: true });
            await waitOpen();
            searchInput().focus();
            await type('{Escape}');
            await waitClosed();
            expect(trigger()).toHaveFocus();
        });

        test('allowCreate：输入新值后出现创建项，选中后值变为输入内容', async () => {
            const onChange = vi.fn<NonNullable<SelectSpecProps['onChange']>>();
            await render({ filter: true, allowCreate: true, onChange });
            await open();
            await userEvent.keyboard('kiwi');
            // The create item's text carries a localized prefix
            await waitFor(() => expect(optionEls()).toHaveLength(1));
            expect(labels()[0]).toMatch(/kiwi$/);
            await userEvent.click(optionEls()[0]);
            await waitClosed();
            expect(onChange.mock.calls).toEqual([['kiwi']]);
            expect(selected()).toBe('kiwi');
        });

        test('遵循 APG select-only combobox 模式', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            await expect(checkPattern('combobox', handle.container, { press })).resolves.toBeUndefined();
        });

        test('遵循 APG 可搜索 combobox 模式：filter 的搜索框在触发器里', async () => {
            await render({ filter: true, defaultOpen: true });
            await waitOpen();
            await expect(checkPattern('combobox', handle.container, { press })).resolves.toBeUndefined();
        });
    });
}
