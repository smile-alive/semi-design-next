import { screen, waitFor, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export interface AutoCompleteSpecItem {
    value: string;
    label: string;
    disabled?: boolean;
}

/** Framework-free AutoComplete props; each fixture renders an AutoComplete named "City" followed by a button named "after" */
export interface AutoCompleteSpecProps {
    data: (string | AutoCompleteSpecItem)[];
    /** `undefined` is uncontrolled */
    value?: string;
    defaultValue?: string;
    loading?: boolean;
    disabled?: boolean;
    defaultOpen?: boolean;
    defaultActiveFirstOption?: boolean;
    onSearch?: (value: string) => void;
    // Parameter types differ in width between frameworks, so callbacks take `unknown`
    onSelect?: (value: unknown) => void;
    onChange?: (value: unknown) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
}

const cities: AutoCompleteSpecItem[] = [
    { value: 'beijing', label: 'Beijing' },
    { value: 'chengdu', label: 'Chengdu', disabled: true },
    { value: 'dalian', label: 'Dalian' },
    { value: 'xiamen', label: 'Xiamen' },
];

export function autoCompleteSpec(mount: SpecMount<AutoCompleteSpecProps>, options: SpecOptions = {}) {
    defineSpec('AutoComplete（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<AutoCompleteSpecProps>;

        async function render(props: Partial<AutoCompleteSpecProps> = {}) {
            handle = await mount({ data: cities, ...props });
            view = within(handle.container);
            return handle;
        }

        // Svelte keeps the whitespace around snippet text
        const textOf = (element: Element | null | undefined) => element?.textContent?.trim();
        const input = () => view.getByRole<HTMLInputElement>('combobox');
        const listbox = () => screen.queryByRole('listbox');
        const optionEls = () => screen.queryAllByRole('option');
        const labels = () => optionEls().map(textOf);
        const after = () => view.getByRole('button', { name: 'after' });
        const activeLabel = () => {
            const id = input().getAttribute('aria-activedescendant');
            return id ? textOf(document.getElementById(id)) : undefined;
        };
        const option = (label: string) => optionEls().find((element) => textOf(element) === label)!;

        const waitOpen = () => waitFor(() => expect(listbox()).not.toBeNull());
        const waitClosed = () => waitFor(() => expect(listbox()).toBeNull());
        async function openByTyping(text = 'a') {
            await userEvent.type(input(), text);
            await waitOpen();
        }
        const type = (keys: string) => userEvent.keyboard(keys);

        test('输入框是 combobox，带 aria-autocomplete="list" 与 aria-expanded；打开后 aria-controls 指向 listbox，选项是 option', async () => {
            await render();
            expect(input()).toHaveAttribute('aria-autocomplete', 'list');
            expect(input()).toHaveAttribute('aria-expanded', 'false');
            expect(input()).not.toHaveAttribute('aria-activedescendant');
            await openByTyping();
            expect(input()).toHaveAttribute('aria-expanded', 'true');
            expect(listbox()!.id).not.toBe('');
            expect(input().getAttribute('aria-controls')).toBe(listbox()!.id);
            expect(labels()).toEqual(['Beijing', 'Chengdu', 'Dalian', 'Xiamen']);
            expect(option('Chengdu')).toHaveAttribute('aria-disabled', 'true');
        });

        test('关闭时 aria-controls 要么不写，要么指向文档里存在的元素', async () => {
            await render();
            const controls = input().getAttribute('aria-controls');
            expect(controls === null || document.getElementById(controls) !== null).toBe(true);
        });

        test('data 可以直接是字符串数组', async () => {
            await render({ data: ['semi', 'design'], defaultOpen: true });
            await waitOpen();
            expect(labels()).toEqual(['semi', 'design']);
        });

        test('defaultOpen 默认打开面板', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            expect(input()).toHaveAttribute('aria-expanded', 'true');
        });

        test('输入文字打开面板，每次输入各调用一次 onSearch 与 onChange，输入框显示输入内容', async () => {
            const onSearch = vi.fn<NonNullable<AutoCompleteSpecProps['onSearch']>>();
            const onChange = vi.fn<NonNullable<AutoCompleteSpecProps['onChange']>>();
            await render({ onSearch, onChange });
            await openByTyping('de');
            expect(input()).toHaveValue('de');
            expect(onSearch.mock.calls.map(([value]) => value)).toEqual(['d', 'de']);
            expect(onChange.mock.calls.map(([value]) => value)).toEqual(['d', 'de']);
        });

        test('data 更新后候选项随之变化', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            await handle.update({ data: ['Hangzhou', 'Harbin'] });
            await waitFor(() => expect(labels()).toEqual(['Hangzhou', 'Harbin']));
        });

        test('ArrowDown 在面板关闭时打开，焦点留在输入框', async () => {
            const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteSpecProps['onDropdownVisibleChange']>>();
            await render({ onDropdownVisibleChange });
            input().focus();
            await type('{ArrowDown}');
            await waitOpen();
            expect(input()).toHaveFocus();
            expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        });

        test('方向键移动高亮：aria-activedescendant 指向当前项，跳过禁用项并循环', async () => {
            await render({ defaultOpen: true, defaultActiveFirstOption: false });
            await waitOpen();
            input().focus();
            await type('{ArrowDown}');
            expect(activeLabel()).toBe('Beijing');
            await type('{ArrowDown}');
            expect(activeLabel()).toBe('Dalian');
            await type('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Beijing');
            await type('{ArrowUp}');
            expect(activeLabel()).toBe('Xiamen');
            expect(input()).toHaveFocus();
        });

        test('Home 与 End 留给输入框移动光标，不改变高亮，面板保持打开', async () => {
            await render({ defaultValue: 'abc', defaultOpen: true, defaultActiveFirstOption: false });
            await waitOpen();
            input().focus();
            await type('{ArrowDown}');
            expect(activeLabel()).toBe('Beijing');
            await type('{Home}');
            expect(input().selectionStart).toBe(0);
            await type('{End}');
            expect(input().selectionStart).toBe(3);
            expect(activeLabel()).toBe('Beijing');
            expect(listbox()).not.toBeNull();
        });

        test('Enter 选中高亮项：onSelect 与 onChange 收到值，输入框显示选中值，面板关闭，焦点留在输入框', async () => {
            const onSelect = vi.fn<NonNullable<AutoCompleteSpecProps['onSelect']>>();
            const onChange = vi.fn<NonNullable<AutoCompleteSpecProps['onChange']>>();
            await render({ defaultOpen: true, defaultActiveFirstOption: false, onSelect, onChange });
            await waitOpen();
            input().focus();
            await type('{ArrowDown}{ArrowDown}{Enter}');
            await waitClosed();
            expect(onSelect.mock.calls).toEqual([['dalian']]);
            expect(onChange.mock.calls).toEqual([['dalian']]);
            expect(input()).toHaveValue('dalian');
            expect(input()).toHaveFocus();
            expect(input()).toHaveAttribute('aria-expanded', 'false');
        });

        test('点击候选项选中，禁用项点击无效', async () => {
            const onSelect = vi.fn<NonNullable<AutoCompleteSpecProps['onSelect']>>();
            await render({ defaultOpen: true, onSelect });
            await waitOpen();
            await userEvent.click(option('Chengdu'));
            expect(onSelect).not.toHaveBeenCalled();
            expect(listbox()).not.toBeNull();
            await userEvent.click(option('Xiamen'));
            await waitClosed();
            expect(onSelect.mock.calls).toEqual([['xiamen']]);
            expect(input()).toHaveValue('xiamen');
        });

        test('defaultActiveFirstOption：打开时高亮第一个可用项，首项禁用时跳过它，Enter 选中它', async () => {
            const onSelect = vi.fn<NonNullable<AutoCompleteSpecProps['onSelect']>>();
            await render({
                data: [
                    { value: 'off', label: 'Off', disabled: true },
                    { value: 'on', label: 'On' },
                    { value: 'more', label: 'More' },
                ],
                defaultOpen: true,
                defaultActiveFirstOption: true,
                onSelect,
            });
            await waitOpen();
            input().focus();
            await waitFor(() => expect(activeLabel()).toBe('On'));
            await type('{Enter}');
            expect(onSelect.mock.calls).toEqual([['on']]);
        });

        test('defaultActiveFirstOption 为 false 时打开后没有高亮项，Enter 不选中', async () => {
            const onSelect = vi.fn<NonNullable<AutoCompleteSpecProps['onSelect']>>();
            await render({ defaultOpen: true, defaultActiveFirstOption: false, onSelect });
            await waitOpen();
            input().focus();
            expect(input()).not.toHaveAttribute('aria-activedescendant');
            await type('{Enter}');
            expect(onSelect).not.toHaveBeenCalled();
        });

        test('Escape 关闭面板并通知 onDropdownVisibleChange(false)，焦点仍在输入框', async () => {
            const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteSpecProps['onDropdownVisibleChange']>>();
            await render({ onDropdownVisibleChange });
            await openByTyping();
            await type('{Escape}');
            await waitClosed();
            expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
            expect(input()).toHaveFocus();
            expect(input()).toHaveAttribute('aria-expanded', 'false');
        });

        test('面板关闭时 Escape 与 Tab 不通知 onDropdownVisibleChange', async () => {
            const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteSpecProps['onDropdownVisibleChange']>>();
            await render({ onDropdownVisibleChange });
            input().focus();
            await type('{Escape}');
            await userEvent.tab();
            expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        });

        test('Tab 关闭面板，焦点移到下一个可聚焦元素', async () => {
            await render();
            await openByTyping();
            await userEvent.tab();
            await waitClosed();
            expect(after()).toHaveFocus();
        });

        test('点击组件外部关闭面板，焦点留在被点击处', async () => {
            await render();
            await openByTyping();
            await userEvent.click(after());
            await waitClosed();
            expect(after()).toHaveFocus();
            expect(input()).toHaveAttribute('aria-expanded', 'false');
        });

        test('非受控：defaultValue 作为输入框初始值', async () => {
            await render({ defaultValue: 'abc' });
            expect(input()).toHaveValue('abc');
        });

        test('受控：value 决定输入框内容，输入与选择只上报回调，value 变化后更新，变回 undefined 清空', async () => {
            const onChange = vi.fn<NonNullable<AutoCompleteSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<AutoCompleteSpecProps['onSelect']>>();
            await render({ value: 'abc', onChange, onSelect });
            expect(input()).toHaveValue('abc');
            await userEvent.type(input(), 'x');
            expect(onChange).toHaveBeenLastCalledWith('abcx');
            expect(input()).toHaveValue('abc');
            await waitOpen();
            await userEvent.click(option('Dalian'));
            expect(onSelect).toHaveBeenLastCalledWith('dalian');
            expect(onChange).toHaveBeenLastCalledWith('dalian');
            expect(input()).toHaveValue('abc');
            await handle.update({ value: 'dalian' });
            expect(input()).toHaveValue('dalian');
            await handle.update({ value: undefined });
            expect(input()).toHaveValue('');
        });

        test('loading 时不显示候选项', async () => {
            await render({ loading: true, defaultOpen: true });
            await waitOpen();
            expect(optionEls()).toHaveLength(0);
            await handle.update({ loading: false });
            await waitFor(() => expect(labels()).toEqual(['Beijing', 'Chengdu', 'Dalian', 'Xiamen']));
        });

        test('disabled：输入框禁用，defaultOpen 也不打开面板', async () => {
            await render({ disabled: true, defaultOpen: true });
            expect(input()).toBeDisabled();
            expect(listbox()).toBeNull();
        });

        test('遵循 APG editable combobox 模式', async () => {
            await render({ defaultOpen: true });
            await waitOpen();
            await expect(checkPattern('combobox', handle.container, { press })).resolves.toBeUndefined();
        });
    });
}
