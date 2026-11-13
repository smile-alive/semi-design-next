import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

/** Framework-free TagInput props; each fixture maps the names its framework spells differently */
export interface TagInputSpecProps {
    /** `undefined` is uncontrolled, `null` is controlled with no tags */
    value?: string[] | null;
    defaultValue?: string[];
    /** `undefined` leaves the text to the component */
    inputValue?: string;
    separator?: string | string[] | null;
    max?: number;
    maxTagCount?: number;
    maxLength?: number;
    allowDuplicates?: boolean;
    addOnBlur?: boolean;
    showClear?: boolean;
    disabled?: boolean;
    placeholder?: string;
    /** Undeclared attributes, spread onto the component */
    attrs?: Record<string, string>;
    onChange?: (value: string[]) => void;
    // The event is a different class per framework, so only `type` is common
    onInputChange?: (value: string, event: { type: string }) => void;
    onAdd?: (addedValue: string[]) => void;
    onRemove?: (removedValue: string, index: number) => void;
    onExceed?: (value: string[]) => void;
    onInputExceed?: (value: string) => void;
    onFocus?: (event: { type: string }) => void;
    onBlur?: (event: { type: string }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-tagInput`;

export function tagInputSpec(mount: SpecMount<TagInputSpecProps>, options: SpecOptions = {}) {
    defineSpec('TagInput（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<TagInputSpecProps>;

        async function render(props: TagInputSpecProps = {}) {
            handle = await mount(props);
            view = within(handle.container);
            return handle;
        }

        const root = () => view.getByRole('group');
        const input = () => view.getByRole<HTMLInputElement>('textbox');
        // Svelte keeps the whitespace around a snippet's text
        const tagTexts = () => [...handle.container.querySelectorAll(`.${prefix}-wrapper .${BASE_CLASS_PREFIX}-tag-content`)].map((node) => node.textContent?.trim());
        const tagElements = () => [...handle.container.querySelectorAll<HTMLElement>(`.${prefix}-wrapper .${BASE_CLASS_PREFIX}-tag`)];
        const closeIcons = () => [...handle.container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tag-close`)];
        const restCount = () => handle.container.querySelector(`.${prefix}-wrapper-n`);
        const clearButton = () => handle.container.querySelector<HTMLButtonElement>(`.${prefix}-clearBtn`);
        const type = (text: string) => userEvent.type(input(), text);
        const enter = () => userEvent.keyboard('{Enter}');

        test('根元素是 group，里面是文本输入框；非受控时 defaultValue 渲染初始标签', async () => {
            await render({ defaultValue: ['abc', 'hotsoon'] });
            expect(root()).toBeInTheDocument();
            expect(input()).toBeInTheDocument();
            expect(tagTexts()).toEqual(['abc', 'hotsoon']);
        });

        test('placeholder 只在没有标签时显示', async () => {
            await render({ placeholder: 'tags' });
            expect(input()).toHaveAttribute('placeholder', 'tags');
            handle.unmount();
            await render({ placeholder: 'tags', defaultValue: ['a'] });
            expect(input().getAttribute('placeholder') ?? '').toBe('');
        });

        test('Enter 把输入的文字添加为标签并清空输入框，onAdd 收到新增项，onChange 收到完整列表', async () => {
            const onAdd = vi.fn<NonNullable<TagInputSpecProps['onAdd']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ defaultValue: ['lark'], onAdd, onChange });
            await type('newtag');
            await enter();
            expect(onAdd).toHaveBeenCalledExactlyOnceWith(['newtag']);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['lark', 'newtag']);
            expect(tagTexts()).toEqual(['lark', 'newtag']);
            expect(input()).toHaveValue('');
        });

        test('输入框为空时按 Enter 不添加也不通知', async () => {
            const onAdd = vi.fn<NonNullable<TagInputSpecProps['onAdd']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ onAdd, onChange });
            await userEvent.click(input());
            await enter();
            expect(onAdd).not.toHaveBeenCalled();
            expect(onChange).not.toHaveBeenCalled();
            expect(tagTexts()).toEqual([]);
        });

        test('separator 把输入拆成多个标签，忽略空片段；数组形式可以有多个分隔符，null 不拆分', async () => {
            const onAdd = vi.fn<NonNullable<TagInputSpecProps['onAdd']>>();
            await render({ onAdd });
            await type('abc,toutiao,,,hotsoon');
            await enter();
            expect(onAdd).toHaveBeenLastCalledWith(['abc', 'toutiao', 'hotsoon']);
            expect(tagTexts()).toEqual(['abc', 'toutiao', 'hotsoon']);

            handle.unmount();
            await render({ onAdd, separator: ['-', '/'] });
            await type('a-b/c');
            await enter();
            expect(onAdd).toHaveBeenLastCalledWith(['a', 'b', 'c']);

            handle.unmount();
            await render({ onAdd, separator: null });
            await type('semi,design');
            await enter();
            expect(onAdd).toHaveBeenLastCalledWith(['semi,design']);
        });

        test('allowDuplicates 默认允许重复；为 false 时跳过已有的标签', async () => {
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ defaultValue: ['abc'], onChange });
            await type('abc');
            await enter();
            expect(tagTexts()).toEqual(['abc', 'abc']);
            handle.unmount();

            onChange.mockClear();
            await render({ defaultValue: ['abc'], allowDuplicates: false, onChange });
            await type('abc,def,def');
            await enter();
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['abc', 'def']);
            expect(tagTexts()).toEqual(['abc', 'def']);
        });

        test('max：超出时不添加，onExceed 收到截断前的完整列表，onChange 与 onAdd 不触发', async () => {
            const onExceed = vi.fn<NonNullable<TagInputSpecProps['onExceed']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            const onAdd = vi.fn<NonNullable<TagInputSpecProps['onAdd']>>();
            await render({ defaultValue: ['a', 'b', 'c'], max: 3, onExceed, onChange, onAdd });
            await type('d');
            await enter();
            expect(onExceed).toHaveBeenCalledExactlyOnceWith(['a', 'b', 'c', 'd']);
            expect(onChange).not.toHaveBeenCalled();
            expect(onAdd).not.toHaveBeenCalled();
            expect(tagTexts()).toEqual(['a', 'b', 'c']);
        });

        test('max：未满时按剩余名额截取新增的标签', async () => {
            const onAdd = vi.fn<NonNullable<TagInputSpecProps['onAdd']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            const onExceed = vi.fn<NonNullable<TagInputSpecProps['onExceed']>>();
            await render({ defaultValue: ['a', 'b'], max: 3, onAdd, onChange, onExceed });
            await type('x,y');
            await enter();
            expect(onExceed).toHaveBeenCalledExactlyOnceWith(['a', 'b', 'x', 'y']);
            expect(onAdd).toHaveBeenCalledExactlyOnceWith(['x']);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['a', 'b', 'x']);
        });

        test('maxTagCount 把多出的标签折叠为 +N', async () => {
            await render({ defaultValue: ['abc', 'hotsoon', 'lark'], maxTagCount: 2 });
            expect(tagTexts()).toEqual(['abc', 'hotsoon']);
            expect(restCount()).toHaveTextContent('+1');
        });

        test('maxLength 限制输入长度，超出的输入经 onInputExceed 通知完整文本', async () => {
            const onInputExceed = vi.fn<NonNullable<TagInputSpecProps['onInputExceed']>>();
            await render({ maxLength: 5, onInputExceed });
            await type('abcdef');
            expect(onInputExceed).toHaveBeenCalledExactlyOnceWith('abcdef');
            expect(input()).toHaveValue('abcde');
        });

        test('onInputChange 在每次输入时收到当前文字和事件', async () => {
            const onInputChange = vi.fn<NonNullable<TagInputSpecProps['onInputChange']>>();
            await render({ onInputChange });
            await type('test');
            expect(onInputChange).toHaveBeenCalledTimes(4);
            expect(onInputChange.mock.calls.map(([value]) => value)).toEqual(['t', 'te', 'tes', 'test']);
            expect(onInputChange.mock.calls[3][1]).toEqual(expect.objectContaining({ type: expect.any(String) }));
        });

        test('受控 inputValue：输入只通知，文字由 inputValue 决定，更新后跟随', async () => {
            const onInputChange = vi.fn<NonNullable<TagInputSpecProps['onInputChange']>>();
            await render({ inputValue: 'initial', onInputChange });
            expect(input()).toHaveValue('initial');
            await type('x');
            expect(onInputChange).toHaveBeenLastCalledWith('initialx', expect.anything());
            expect(input()).toHaveValue('initial');
            await handle.update({ inputValue: 'updated' });
            expect(input()).toHaveValue('updated');
        });

        test('受控 inputValue：Enter 添加标签后，onInputChange 报告被清空的文字，输入框仍显示 inputValue', async () => {
            const onInputChange = vi.fn<NonNullable<TagInputSpecProps['onInputChange']>>();
            await render({ inputValue: 'a,b', onInputChange });
            await userEvent.click(input());
            await enter();
            expect(tagTexts()).toEqual(['a', 'b']);
            expect(onInputChange).toHaveBeenCalledTimes(1);
            expect(onInputChange.mock.calls[0][0]).toBe('');
            expect(input()).toHaveValue('a,b');
        });

        test('受控 value：始终显示 value，添加、Backspace、关闭只上报下一个列表，更新后跟随', async () => {
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            const onRemove = vi.fn<NonNullable<TagInputSpecProps['onRemove']>>();
            await render({ value: ['abc', 'def'], onChange, onRemove });
            await type('new');
            await enter();
            expect(onChange).toHaveBeenLastCalledWith(['abc', 'def', 'new']);
            await userEvent.keyboard('{Backspace}');
            expect(onRemove).toHaveBeenLastCalledWith('def', 1);
            expect(onChange).toHaveBeenLastCalledWith(['abc']);
            await userEvent.click(closeIcons()[0]);
            expect(onRemove).toHaveBeenLastCalledWith('abc', 0);
            expect(onChange).toHaveBeenLastCalledWith(['def']);
            expect(tagTexts()).toEqual(['abc', 'def']);

            await handle.update({ value: ['hotsoon'] });
            expect(tagTexts()).toEqual(['hotsoon']);
            await handle.update({ value: null });
            expect(tagTexts()).toEqual([]);
        });

        test('输入框为空时 Backspace 删除最后一个标签，onRemove 收到标签和下标；有文字时只删文字', async () => {
            const onRemove = vi.fn<NonNullable<TagInputSpecProps['onRemove']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ defaultValue: ['abc', 'hotsoon', 'lark'], onRemove, onChange });
            await type('x');
            await userEvent.keyboard('{Backspace}');
            expect(onRemove).not.toHaveBeenCalled();
            expect(tagTexts()).toEqual(['abc', 'hotsoon', 'lark']);
            await userEvent.keyboard('{Backspace}');
            expect(onRemove).toHaveBeenCalledExactlyOnceWith('lark', 2);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['abc', 'hotsoon']);
            expect(tagTexts()).toEqual(['abc', 'hotsoon']);
        });

        test('没有标签时 Backspace 无操作', async () => {
            const onRemove = vi.fn<NonNullable<TagInputSpecProps['onRemove']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ onRemove, onChange });
            await userEvent.click(input());
            await userEvent.keyboard('{Backspace}');
            expect(onRemove).not.toHaveBeenCalled();
            expect(onChange).not.toHaveBeenCalled();
        });

        test('点击标签的关闭图标移除该标签，onRemove 收到标签和下标', async () => {
            const onRemove = vi.fn<NonNullable<TagInputSpecProps['onRemove']>>();
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ defaultValue: ['abc', 'hotsoon', 'toutiao'], onRemove, onChange });
            await userEvent.click(closeIcons()[1]);
            expect(onRemove).toHaveBeenCalledExactlyOnceWith('hotsoon', 1);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['abc', 'toutiao']);
            expect(tagTexts()).toEqual(['abc', 'toutiao']);
        });

        test('标签是可聚焦的按钮，聚焦后按 Delete 或 Backspace 移除该标签', async () => {
            const onRemove = vi.fn<NonNullable<TagInputSpecProps['onRemove']>>();
            await render({ defaultValue: ['abc', 'hotsoon', 'toutiao'], onRemove });
            const tags = tagElements();
            expect(tags.every((tag) => tag.getAttribute('role') === 'button' || tag.tagName === 'BUTTON')).toBe(true);
            tags[1].focus();
            await userEvent.keyboard('{Delete}');
            expect(onRemove).toHaveBeenLastCalledWith('hotsoon', 1);
            expect(tagTexts()).toEqual(['abc', 'toutiao']);
            tagElements()[0].focus();
            await userEvent.keyboard('{Backspace}');
            expect(onRemove).toHaveBeenLastCalledWith('abc', 0);
            expect(tagTexts()).toEqual(['toutiao']);
        });

        test('showClear：有内容时出现清除按钮，点击清空标签与文字、onChange 收到空列表、焦点回到输入框', async () => {
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ defaultValue: ['abc', 'def'], showClear: true, onChange });
            await userEvent.click(clearButton()!);
            expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
            expect(tagTexts()).toEqual([]);
            expect(input()).toHaveFocus();
            expect(clearButton()).toBeNull();
        });

        test('showClear：清除按钮是原生按钮，Tab 可达，Enter 与 Space 触发', async () => {
            for (const key of ['{Enter}', ' ']) {
                const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
                await render({ defaultValue: ['abc'], showClear: true, onChange });
                input().focus();
                await userEvent.tab();
                expect(clearButton()).toHaveFocus();
                expect(clearButton()!.tagName).toBe('BUTTON');
                await userEvent.keyboard(key);
                expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
                expect(tagTexts()).toEqual([]);
                handle.unmount();
            }
        });

        test('showClear 为 false 或没有内容时没有清除按钮', async () => {
            await render({ showClear: true });
            expect(clearButton()).toBeNull();
            await handle.update({ inputValue: 'semi' });
            expect(clearButton()).not.toBeNull();
            await handle.update({ showClear: false });
            expect(clearButton()).toBeNull();
        });

        test('addOnBlur：失焦时把输入的文字添加为标签，先 onAdd 再 onBlur，各一次', async () => {
            const calls: string[] = [];
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ addOnBlur: true, onAdd: () => calls.push('add'), onBlur: () => calls.push('blur'), onChange });
            await type('x');
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.tab();
            expect(calls).toEqual(['add', 'blur']);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['x']);
            expect(tagTexts()).toEqual(['x']);
            expect(input()).toHaveValue('');
        });

        test('未设置 addOnBlur 时失焦不添加输入的文字', async () => {
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ onChange });
            await type('x');
            await userEvent.tab();
            expect(onChange).not.toHaveBeenCalled();
            expect(tagTexts()).toEqual([]);
        });

        test('进入时 onFocus 触发一次，离开整个组件时 onBlur 触发一次', async () => {
            const onFocus = vi.fn<NonNullable<TagInputSpecProps['onFocus']>>();
            const onBlur = vi.fn<NonNullable<TagInputSpecProps['onBlur']>>();
            await render({ onFocus, onBlur });
            await userEvent.click(input());
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.tab();
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onFocus).toHaveBeenCalledTimes(1);
        });

        test('disabled：输入框不可用，group 带 aria-disabled，标签不能关闭，输入、Backspace 无效', async () => {
            const onChange = vi.fn<NonNullable<TagInputSpecProps['onChange']>>();
            await render({ defaultValue: ['a', 'b'], disabled: true, onChange });
            expect(input()).toBeDisabled();
            expect(root()).toHaveAttribute('aria-disabled', 'true');
            expect(closeIcons()).toHaveLength(0);
            await userEvent.type(input(), 'x{Backspace}');
            await userEvent.click(root());
            expect(input()).toHaveValue('');
            expect(onChange).not.toHaveBeenCalled();
            expect(tagTexts()).toEqual(['a', 'b']);
            await handle.update({ disabled: false });
            expect(input()).toBeEnabled();
            expect(root()).not.toHaveAttribute('aria-disabled');
        });

        test('未声明的属性落在根元素上', async () => {
            await render({ attrs: { 'data-testid': 'tags' } });
            expect(root()).toHaveAttribute('data-testid', 'tags');
        });
    });
}
