import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TagInputProps } from '../interface';
import TagInputCase from './tag-input-case.svelte';
import TagInputModes from './tag-input-modes.svelte';

type Case = NonNullable<Parameters<typeof TagInputCase>[1]>['store'];
type Modes = Parameters<typeof TagInputModes>[1];

const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
const tagSelector = `.${tagInputCls}-wrapper .${BASE_CLASS_PREFIX}-tag-content`;

const getRoot = () => document.querySelector(`.${tagInputCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('textbox');
const getTagTexts = () => [...document.querySelectorAll(tagSelector)].map((node) => node.textContent);
const getClearBtn = () => document.querySelector<HTMLElement>(`.${tagInputCls}-clearBtn`);
const getRestCount = () => document.querySelector(`.${tagInputCls}-wrapper-n`);
const getHandles = () => document.querySelectorAll(`.${tagInputCls}-drag-handler`);
async function settle() {
    await tick();
    await tick();
    flushSync();
}
async function pressEnter() {
    await fireEvent.keyDown(getInput(), { key: 'Enter' });
    await settle();
}
async function pressBackspace() {
    await fireEvent.keyDown(getInput(), { key: 'Backspace' });
    await settle();
}
async function typeText(text: string) {
    await userEvent.type(getInput(), text);
    await settle();
}
function dispatch(el: Element, event: Event) {
    el.dispatchEvent(event);
    return event;
}
const mouseDown = (el: Element) => dispatch(el, new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

function present<T>(value?: T | null): T {
    if (value == null) {
        throw new Error('expected a value');
    }
    return value;
}
const handleOf = (store: Case) => present(present(store.handle).current);

function setup(initial: Case = {}) {
    const store = createStore<Case>({ props: {}, slots: {}, handle: {}, ...initial });
    const view = render(TagInputCase, { props: { store } });
    const update = async (props: NonNullable<Case['props']>) => {
        Object.assign(store.props as object, props);
        await settle();
    };
    return { store, view, update };
}

function setupModes(target: Modes['target'], mode: Modes['mode'], initial: { value?: string[] | null; inputValue?: string; accept?: boolean } = {}) {
    const store = createStore<Modes['store']>({ value: initial.value, inputValue: initial.inputValue, accept: initial.accept ?? true, log: [] });
    render(TagInputModes, { props: { target, mode, store } });
    return { store, input: screen.getByRole('textbox') as HTMLInputElement };
}

type Props = NonNullable<TagInputProps>;

describe('Svelte TagInput', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('带 prefix 与 suffix', () => {
        setup({ slots: { prefix: 'node', suffix: 'node' } });
        expect(document.querySelector(`.${tagInputCls}-suffix b`)).not.toBeNull();
        expect(document.querySelector(`.${tagInputCls}-prefix b`)).not.toBeNull();
        expect(getRoot()).toHaveClass(`${tagInputCls}-with-prefix`, `${tagInputCls}-with-suffix`);
    });

    it('validateStatus 加对应类，error 时输入框带 aria-invalid，显式的 aria-invalid 优先', async () => {
        const { update } = setup({ props: { validateStatus: 'warning' } });
        expect(getRoot()).toHaveClass(`${tagInputCls}-warning`);
        expect(getInput()).not.toHaveAttribute('aria-invalid');
        await update({ validateStatus: 'error' });
        expect(getRoot()).toHaveClass(`${tagInputCls}-error`);
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        expect(getRoot()).not.toHaveAttribute('aria-invalid');
        await update({ 'aria-invalid': false });
        expect(getInput()).toHaveAttribute('aria-invalid', 'false');
    });

    it('placeholder 只在没有标签时显示', async () => {
        const { update } = setup({ props: { placeholder: 'semi placeholder' } });
        expect(getInput()).toHaveAttribute('placeholder', 'semi placeholder');
        await update({ value: ['a'] });
        expect(getInput()).toHaveAttribute('placeholder', '');
    });

    it('class 与 style 落在根元素，输入框不带', () => {
        setup({ props: { class: 'test', style: 'color: red' } });
        const root = document.querySelector('div.test');
        expect(root).toHaveClass(tagInputCls);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getInput()).not.toHaveClass('test');
    });

    it.each([
        ['large', `${tagInputCls}-large`],
        ['small', `${tagInputCls}-small`],
    ] as const)('size=%s', (size, cls) => {
        setup({ props: { size } });
        expect(getRoot()).toHaveClass(cls);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-${size}`)).toHaveLength(1);
    });

    it('默认尺寸不加 small、large 类', () => {
        setup({ props: { size: 'default' } });
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-small`);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-large`);
    });

    it('showClear：无内容时占位，有内容时是具名按钮，关闭时不渲染', () => {
        const empty = setup({ props: { showClear: true } });
        expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull();
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`)).not.toBeNull();
        empty.view.unmount();

        const off = setup({ props: { showClear: false } });
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`)).toBeNull();
        off.view.unmount();

        setup({ props: { showClear: true, inputValue: 'semi' } });
        expect(screen.getByRole('button', { name: zh_CN.TagInput.clear })).toBe(getClearBtn());
    });

    it('禁用时不出现清除按钮与关闭图标', async () => {
        setup({ props: { showClear: true, disabled: true, value: ['abc'] } });
        await userEvent.hover(getRoot());
        expect(getClearBtn()).toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
    });

    it('clearIcon 替换默认图标', () => {
        setup({ props: { showClear: true, value: ['abc'] }, clearIcon: true });
        expect(getClearBtn()?.querySelector('.custom-clear-icon')).not.toBeNull();
        expect(getClearBtn()?.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).toBeNull();
    });

    it('value 单向传入作初值，undefined 时按非受控处理', () => {
        setup({ props: { value: ['abc', 'hotsoon'] } });
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
    });

    it('value 为 null 时受控且没有标签，交互只通知', async () => {
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        const { store } = setup({ props: { value: null, onChange } });
        expect(getTagTexts()).toEqual([]);
        await typeText('x{Enter}');
        expect(onChange).toHaveBeenCalledWith(['x']);
        // unbound, the write stays local, so the tag shows
        expect(getTagTexts()).toEqual(['x']);
        present(store.props).value = null;
        await settle();
        expect(getTagTexts()).toEqual(['x']);
    });

    it('disabled 时输入框禁用，根元素带 aria-disabled', async () => {
        const { update } = setup({ props: { disabled: true } });
        expect(getRoot()).toHaveClass(`${tagInputCls}-disabled`);
        expect(getInput()).toBeDisabled();
        expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
        await update({ disabled: false });
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-disabled`);
        expect(getInput()).not.toBeDisabled();
        expect(getRoot()).not.toHaveAttribute('aria-disabled');
    });

    it('separator：字符串、null、数组', async () => {
        const dash = setup({ props: { separator: '-', inputValue: 'abc-hotsoon' } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        dash.view.unmount();

        const none = setup({ props: { separator: null, inputValue: 'semi-hotsoon' } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['semi-hotsoon']);
        none.view.unmount();

        setup({ props: { separator: ['-', '/', '*'], inputValue: 'abc-hotsoon/pipixi*qingyan' } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon', 'pipixi', 'qingyan']);
    });

    it('输入时按分隔符拆分，Enter 后加入标签', async () => {
        setup({ props: { separator: [',', ';'] } });
        await typeText('a;b,c');
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        expect(getInput()).toHaveValue('');
    });

    it('粘贴带分隔符的文字，Enter 后拆成多个标签', async () => {
        setup();
        await userEvent.click(getInput());
        await userEvent.paste('a,b,c');
        await settle();
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('split 函数拆分输入，每次读取', async () => {
        const split = vi.fn<NonNullable<Props['split']>>((text, sep) => text.split(sep as string).filter(Boolean));
        setup({ props: { split, inputValue: 'abc,def' } });
        await pressEnter();
        expect(split).toHaveBeenCalledWith('abc,def', ',');
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('关闭图标、Backspace 与清除按钮移除标签并通知 onRemove、onChange', async () => {
        const onRemove = vi.fn<NonNullable<Props['onRemove']>>();
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        setup({ props: { value: ['abc', 'hotsoon', 'toutiao', 'lark'], onRemove, onChange, showClear: true } });
        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[1]);
        expect(onRemove).toHaveBeenNthCalledWith(1, 'hotsoon', 1);
        expect(onChange).toHaveBeenNthCalledWith(1, ['abc', 'toutiao', 'lark']);
        expect(getTagTexts()).toEqual(['abc', 'toutiao', 'lark']);

        await pressBackspace();
        expect(onRemove).toHaveBeenNthCalledWith(2, 'lark', 2);
        expect(onChange).toHaveBeenNthCalledWith(2, ['abc', 'toutiao']);

        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenNthCalledWith(3, []);
        expect(onRemove).toHaveBeenCalledTimes(2);
        expect(getTagTexts()).toEqual([]);
        expect(getInput()).toHaveFocus();
    });

    it('空输入时按 Backspace 无操作', async () => {
        const onRemove = vi.fn<NonNullable<Props['onRemove']>>();
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        setup({ props: { value: [], onRemove, onChange } });
        await pressBackspace();
        expect(onRemove).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('onAdd 与 onChange 只在有新标签时触发，空白项被丢弃', async () => {
        const onAdd = vi.fn<NonNullable<Props['onAdd']>>();
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        const empty = setup({ props: { onChange, onAdd } });
        await pressEnter();
        expect(onAdd).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        empty.view.unmount();

        setup({ props: { inputValue: 'abc,toutiao,,,hotsoon', onChange, value: ['lark'], onAdd } });
        await pressEnter();
        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(['abc', 'toutiao', 'hotsoon']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['lark', 'abc', 'toutiao', 'hotsoon']);
    });

    it('allowDuplicates 为 false 时丢弃重复项，默认保留', async () => {
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        const dup = setup({ props: { allowDuplicates: true, value: ['abc'], inputValue: 'abc' } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'abc']);
        dup.view.unmount();

        setup({ props: { value: ['abc'], allowDuplicates: false, onChange } });
        await typeText('abc,def,def');
        await pressEnter();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['abc', 'def']);
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('max：超出时只补满剩余名额并通知 onExceed', async () => {
        const onExceed = vi.fn<NonNullable<Props['onExceed']>>();
        setup({ props: { value: ['a', 'b', 'c'], max: 3, onExceed } });
        await typeText('d');
        await pressEnter();
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('已超过 max 时再添加，不删既有标签，change 与 add 都不触发', async () => {
        const onExceed = vi.fn<NonNullable<Props['onExceed']>>();
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        const onAdd = vi.fn<NonNullable<Props['onAdd']>>();
        setup({ props: { value: ['a', 'b', 'c', 'd', 'e'], max: 3, onExceed, onChange, onAdd } });
        await typeText('x,y,z');
        await pressEnter();
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(onAdd).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('maxTagCount 折叠，+N 显示剩余数量', async () => {
        setup({ props: { value: ['abc', 'hotsoon'], maxTagCount: 2, inputValue: 'lark' } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        expect(getRestCount()).toHaveTextContent('+1');
    });

    it('showRestTagsPopover 为 false 时 +N 是不可聚焦的 span', () => {
        setup({ props: { value: ['abc', 'hotsoon', 'lark'], maxTagCount: 1, showRestTagsPopover: false } });
        expect(getRestCount()).toHaveTextContent('+2');
        expect(getRestCount()).not.toHaveAttribute('tabindex');
        expect(getTagTexts()).toEqual(['abc']);
    });

    it('+N 悬停打开浮层，restTagsPopoverProps 传给 Popover', async () => {
        // jsdom keeps no hover state; Tooltip re-checks `:hover` on its trigger right after opening and closes otherwise
        const nativeMatches = Object.getOwnPropertyDescriptor(Element.prototype, 'matches')?.value as Element['matches'];
        vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
            return selector === ':hover' ? this === getRestCount() : nativeMatches.call(this, selector);
        });
        setup({ props: { value: ['abc', 'hotsoon', 'lark'], maxTagCount: 1, restTagsPopoverProps: { position: 'bottom' } } });
        await userEvent.hover(getRestCount() as Element);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).not.toBeNull());
        const popover = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(popover).toHaveAttribute('x-placement', 'bottom');
        expect(popover).toHaveTextContent('hotsoon');
        expect(popover).toHaveTextContent('lark');
    });

    it('expandRestTagsOnClick 为 true 时点击展开剩余标签，点击外部后折叠', async () => {
        setup({ props: { value: ['abc', 'hotsoon', 'lark', 'bytedance'], maxTagCount: 2, showRestTagsPopover: false } });
        expect(getRestCount()).toHaveTextContent('+2');
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(getRestCount()).toBeNull();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon', 'lark', 'bytedance']);
        await userEvent.click(document.body);
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        expect(getRestCount()).toHaveTextContent('+2');
    });

    it('expandRestTagsOnClick 为 false 时点击不展开', async () => {
        setup({ props: { value: ['abc', 'hotsoon', 'lark'], maxTagCount: 1, expandRestTagsOnClick: false, showRestTagsPopover: false } });
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(getRestCount()).toHaveTextContent('+2');
        expect(getTagTexts()).toEqual(['abc']);
    });

    it('maxLength 拒绝过长的输入并保持原文', async () => {
        setup({ props: { maxLength: 3 } });
        await typeText('tik');
        expect(getInput()).toHaveValue('tik');
        await typeText('t');
        expect(getInput()).toHaveValue('tik');
    });

    it('maxLength：粘贴过长的文字触发 onInputExceed 且不写入', async () => {
        const onInputExceed = vi.fn<NonNullable<Props['onInputExceed']>>();
        setup({ props: { maxLength: 2, onInputExceed } });
        await userEvent.click(getInput());
        await userEvent.paste('hotsoon');
        await settle();
        expect(onInputExceed).toHaveBeenCalledTimes(1);
        expect(onInputExceed).toHaveBeenCalledWith('hotsoon');
        expect(getInput()).toHaveValue('');
    });

    it('输入法组合期间不校验 maxLength，组合结束后截断并通知', async () => {
        const onInputExceed = vi.fn<NonNullable<Props['onInputExceed']>>();
        setup({ props: { value: ['abc'], maxLength: 3, onInputExceed } });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.input(input, { target: { value: 'zhongwen' } });
        await settle();
        expect(input).toHaveValue('zhongwen');
        expect(onInputExceed).not.toHaveBeenCalled();
        await fireEvent.compositionEnd(input, { target: { value: 'zhongwen' } });
        await settle();
        expect(input).toHaveValue('zho');
        expect(onInputExceed).toHaveBeenCalledWith('zhongwen');
    });

    it('输入法提交的文本含分隔符时逐段截断，数组 separator 取首个分隔符拼接', async () => {
        const { view } = setup({ props: { maxLength: 2, separator: ',' } });
        await fireEvent.compositionStart(getInput());
        await fireEvent.compositionEnd(getInput(), { target: { value: 'ab,cde' } });
        await settle();
        expect(getInput()).toHaveValue('ab,cd');
        view.unmount();

        setup({ props: { maxLength: 2, separator: ['-', ' '] } });
        await fireEvent.compositionStart(getInput());
        await fireEvent.compositionEnd(getInput(), { target: { value: 'ab-cde' } });
        await settle();
        expect(getInput()).toHaveValue('ab-cd');
        await pressEnter();
        expect(getTagTexts()).toEqual(['ab', 'cd']);
    });

    it('组合结束时未超长的文本原样保留', async () => {
        const onInputExceed = vi.fn<NonNullable<Props['onInputExceed']>>();
        setup({ props: { value: ['abc'], maxLength: 3, onInputExceed } });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.input(input, { target: { value: 'zhong' } });
        await fireEvent.compositionEnd(input, { target: { value: '中' } });
        await settle();
        expect(input).toHaveValue('中');
        expect(onInputExceed).not.toHaveBeenCalled();
    });

    it('onInputChange 的事件覆盖 input、keydown、focusout、click 与 compositionend', async () => {
        const onInputChange = vi.fn<NonNullable<Props['onInputChange']>>();
        setup({ props: { addOnBlur: true, maxLength: 2, showClear: true, value: ['t'], onInputChange }, after: true });
        const types = () => onInputChange.mock.calls.map(([, event]) => event.type);
        await typeText('a');
        await pressEnter();
        await typeText('b');
        await userEvent.tab();
        await userEvent.tab();
        await typeText('c');
        await userEvent.click(getClearBtn() as HTMLElement);
        await fireEvent.compositionStart(getInput());
        await fireEvent.compositionEnd(getInput(), { target: { value: 'abc' } });
        await settle();
        expect(types()).toEqual(['input', 'keydown', 'input', 'focusout', 'input', 'click', 'compositionend']);
    });

    it('onFocus、onBlur 收到根元素的 focusin、focusout，各一次', async () => {
        const onBlur = vi.fn<NonNullable<Props['onBlur']>>();
        const onFocus = vi.fn<NonNullable<Props['onFocus']>>();
        setup({ props: { onBlur, onFocus } });
        await userEvent.click(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
    });

    it('onKeyDown 只来自输入框，在 TagInput 处理之后触发，preventDefault 不阻止 Enter', async () => {
        const onKeyDown = vi.fn<NonNullable<Props['onKeyDown']>>((event) => event.preventDefault());
        setup({ props: { inputValue: 'a', onKeyDown } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a']);
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('Enter');
    });

    it('onKeyDown 收到键入的按键，onChange 不收到输入框的原生 change', async () => {
        const onKeyDown = vi.fn<NonNullable<Props['onKeyDown']>>();
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        setup({ props: { onKeyDown, onChange, value: ['t'] } });
        await typeText('a');
        await fireEvent.change(getInput());
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('a');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('根元素的 onclick 与内部的激活处理都执行', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({ props: { value: ['a'], onclick } });
        await userEvent.click(getRoot());
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('tag snippet 整体替换标签，onClose 移除对应标签', async () => {
        const onRemove = vi.fn<NonNullable<Props['onRemove']>>();
        setup({ props: { value: ['abc', 'hotsoon'], onRemove }, tag: 'text' });
        expect([...document.querySelectorAll('.custom-tag-item')].map((item) => item.textContent)).toEqual(['abc', 'hotsoon']);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('tag snippet 接收 value、index 与 onClose，禁用时忽略关闭，带事件时阻止默认行为', async () => {
        const onRemove = vi.fn<NonNullable<Props['onRemove']>>();
        const { update } = setup({ props: { value: ['a', 'b'], onRemove, disabled: true }, tag: 'button' });
        await userEvent.click(screen.getByText('1:b'));
        expect(onRemove).not.toHaveBeenCalled();
        await update({ disabled: false });
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        screen.getByText('1:b').dispatchEvent(event);
        await settle();
        expect(event.defaultPrevented).toBe(true);
        expect(onRemove).toHaveBeenCalledWith('b', 1);
        expect(screen.queryByText('1:b')).toBeNull();
    });

    it('tag snippet 渲染为空时不出现默认标签', () => {
        setup({ props: { value: ['a', 'b'] }, tag: 'none' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
        expect(getTagTexts()).toEqual([]);
    });

    it('autofocus 在挂载后聚焦输入框并进入聚焦态，禁用时不聚焦', async () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = setup({ props: { autofocus: true } });
        await settle();
        expect(focus.mock.contexts).toContain(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        view.view.unmount();

        focus.mockClear();
        setup({ props: { autofocus: true, disabled: true } });
        await settle();
        expect(focus.mock.contexts).not.toContain(getInput());
    });

    it('aria-label 落在输入框，未传名称时回退到语言包文案，名称交给 label 或 id 时不加', () => {
        const named = setup({ props: { 'aria-label': 'Tag input field' } });
        expect(screen.getByLabelText('Tag input field')).toBe(getInput());
        expect(getRoot()).not.toHaveAttribute('aria-label');
        named.view.unmount();

        const unnamed = setup();
        expect(getInput()).toHaveAttribute('aria-label', zh_CN.TagInput.input);
        unnamed.view.unmount();

        const labelled = setup({ props: { 'aria-labelledby': 'someone' } });
        expect(getInput()).not.toHaveAttribute('aria-label');
        labelled.view.unmount();

        setup({ props: { id: 'form-id' } });
        expect(getInput()).not.toHaveAttribute('aria-label');
    });

    it('渲染出的 insetLabel 为输入框命名，insetLabelId 与显式名称优先', () => {
        const first = setup({ slots: { insetLabel: 'Tags' } });
        expect(screen.getByRole('textbox', { name: 'Tags' })).toBe(getInput());
        expect(document.querySelector(`.${tagInputCls}-inset-label`)).toHaveClass(`${tagInputCls}-prefix-text`);
        first.view.unmount();

        const second = setup({ props: { insetLabelId: 'inset-id' }, slots: { insetLabel: 'Tags' } });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'inset-id');
        expect(document.querySelector(`.${tagInputCls}-inset-label`)).toHaveAttribute('id', 'inset-id');
        second.view.unmount();

        setup({ props: { 'aria-label': 'Own name' }, slots: { insetLabel: 'Tags' } });
        expect(screen.getByRole('textbox', { name: 'Own name' })).toBe(getInput());
    });

    it('prefix 与 insetLabel 同时提供时渲染 prefix，并带 -inset-label 类', () => {
        setup({ slots: { prefix: 'P', insetLabel: 'L' } });
        const node = document.querySelector(`.${tagInputCls}-prefix`);
        expect(node).toHaveTextContent('P');
        expect(node).toHaveClass(`${tagInputCls}-inset-label`);
        expect(node).toHaveAttribute('x-semi-prop', 'prefix');
    });

    it('前后缀的内容决定类名：文本、图标', async () => {
        setup({ slots: { prefix: 'Prefix:', suffix: 'icon' } });
        await settle();
        expect(document.querySelector(`.${tagInputCls}-prefix`)).toHaveClass(`${tagInputCls}-prefix-text`);
        expect(document.querySelector(`.${tagInputCls}-suffix`)).toHaveClass(`${tagInputCls}-suffix-icon`);
    });

    it('标签的可访问名称取自语言包，值里的 $&、$$ 原文写入', () => {
        setup({ props: { value: ['$&-$$', 'abc'] } });
        expect(screen.getByRole('button', { name: zh_CN.Tag.closableTag.split('${tag}').join('$&-$$') })).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
        expect(screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', 'abc') })).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
    });

    it('禁用时静态标签不带 role 与 aria-label，文字本身可见', () => {
        setup({ props: { disabled: true, value: ['abc'] } });
        const tag = document.querySelector(`.${BASE_CLASS_PREFIX}-tag`);
        expect(tag).toHaveTextContent('abc');
        expect(tag).not.toHaveAttribute('role');
        expect(tag).not.toHaveAttribute('aria-label');
    });

    it('preventScroll 传给 focus', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const { store } = setup({ props: { preventScroll: true } });
        handleOf(store).focus();
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).toHaveFocus();
    });

    it('focus 与 blur 方法进入、结束激活态', async () => {
        const { store } = setup({ props: { value: ['abc'] } });
        handleOf(store).focus();
        await settle();
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        handleOf(store).blur();
        await settle();
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('focus 方法在禁用时不聚焦', async () => {
        const { store } = setup({ props: { value: ['abc'], disabled: true } });
        handleOf(store).focus();
        await settle();
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('blur 方法在焦点位于标签或清除按钮时同样移出焦点', async () => {
        const onBlur = vi.fn<NonNullable<Props['onBlur']>>();
        const { store } = setup({ props: { value: ['abc'], showClear: true, onBlur } });
        const tag = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tag`) as HTMLElement;
        tag.focus();
        handleOf(store).blur();
        await settle();
        expect(tag).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
        present(getClearBtn()).focus();
        handleOf(store).blur();
        await settle();
        expect(document.activeElement).toBe(document.body);
        expect(onBlur).toHaveBeenCalledTimes(2);
    });

    it('鼠标进入、离开不改变根元素类名', async () => {
        setup({ props: { value: ['abc'] } });
        const { className } = getRoot();
        await fireEvent.mouseEnter(getRoot());
        expect(getRoot().className).toBe(className);
        await fireEvent.mouseLeave(getRoot());
        expect(getRoot().className).toBe(className);
    });

    it('禁用时忽略输入、Backspace 与点击', async () => {
        const onChange = vi.fn<NonNullable<Props['onChange']>>();
        setup({ props: { value: ['a'], disabled: true, onChange } });
        await userEvent.type(getInput(), 'x');
        expect(getInput()).toHaveValue('');
        await userEvent.click(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a']);
    });

    it('addOnBlur：失焦时只添加一次文本，再通知 blur；没有文本时不上报 onInputChange', async () => {
        const calls: unknown[] = [];
        const onInputChange = vi.fn<NonNullable<Props['onInputChange']>>();
        setup({
            props: { addOnBlur: true, onAdd: (value) => calls.push(['add', value]), onBlur: () => calls.push(['blur']), onInputChange },
            after: true,
        });
        await userEvent.click(getInput());
        await userEvent.tab();
        expect(calls).toEqual([['blur']]);
        expect(onInputChange).not.toHaveBeenCalled();

        calls.length = 0;
        await userEvent.click(getInput());
        await typeText('x');
        await userEvent.tab();
        expect(calls).toEqual([['add', ['x']], ['blur']]);
        expect(getTagTexts()).toEqual(['x']);
        expect(getInput()).toHaveValue('');
    });

    it('点击输入框后用 Tab 离开，激活状态随之结束', async () => {
        setup({ props: { value: ['abc'] }, after: true });
        await userEvent.click(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('点击内部不结束激活，点击外部结束，再点击内部重新进入', async () => {
        setup({ props: { value: ['abc'] } });
        await userEvent.click(getRoot());
        await userEvent.click(screen.getByText('abc'));
        await userEvent.click(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await userEvent.click(document.body);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('在内部按下、在外部松开时保持激活', async () => {
        setup({ props: { value: ['abc'] } });
        await userEvent.click(getRoot());
        await fireEvent.mouseDown(getInput());
        await fireEvent.mouseUp(document.body);
        await fireEvent.click(document.body);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('点击 prefix、suffix 聚焦输入框，它们的 mousedown 阻止默认行为，输入框的不阻止', async () => {
        const onFocus = vi.fn<NonNullable<Props['onFocus']>>();
        setup({ props: { value: ['abc'], onFocus }, slots: { prefix: 'Prefix', suffix: 'Suffix' } });
        expect(mouseDown(screen.getByText('Prefix')).defaultPrevented).toBe(true);
        expect(mouseDown(screen.getByText('Suffix')).defaultPrevented).toBe(true);
        expect(mouseDown(getInput()).defaultPrevented).toBe(false);
        await userEvent.click(screen.getByText('Prefix'));
        expect(getInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('清除按钮是输入框后的具名原生按钮，Enter 与 Space 可以触发，之后焦点回到输入框', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onChange = vi.fn<NonNullable<Props['onChange']>>();
            const { view } = setup({ props: { showClear: true, value: ['abc'], onChange } });
            getInput().focus();
            await userEvent.tab();
            const clear = screen.getByRole('button', { name: zh_CN.TagInput.clear });
            expect(clear).toHaveFocus();
            expect(clear).toHaveAttribute('type', 'button');
            await userEvent.keyboard(key);
            await settle();
            expect(onChange).toHaveBeenCalledWith([]);
            expect(getTagTexts()).toEqual([]);
            expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull();
            expect(getInput()).toHaveFocus();
            view.unmount();
        }
    });

    it('获得焦点的清除按钮因值在别处被清空而移除时，焦点交给输入框', async () => {
        const { store } = setup({ props: { value: ['abc'], showClear: true } });
        getInput().focus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.TagInput.clear })).toHaveFocus();
        present(store.props).value = [];
        await settle();
        expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull();
        expect(getInput()).toHaveFocus();
    });

    it('draggable：点击后出现各自带句柄的标签，句柄是标签的兄弟', async () => {
        setup({ props: { draggable: true, value: ['abc', 'def', 'ghi'] } });
        expect(getHandles()).toHaveLength(0);
        expect(document.querySelector(`.${tagInputCls}-sortable-list`)).toBeNull();
        await userEvent.click(getRoot());
        const itemSelector = `.${tagInputCls}-sortable-list .${tagInputCls}-drag-item`;
        await waitFor(() => expect(document.querySelectorAll(itemSelector)).toHaveLength(3));
        expect(screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })).toHaveLength(3);
        const items = document.querySelectorAll(itemSelector);
        expect([...items].map((item) => item.textContent?.trim())).toEqual(['abc', 'def', 'ghi']);
        for (const item of items) {
            expect(item).toHaveClass(`${tagInputCls}-wrapper-tag-icon`);
            expect(item.querySelector(`.${tagInputCls}-drag-handler`)).not.toBeNull();
        }
        const handle = screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0];
        const tag = screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', 'abc') });
        expect(tag.contains(handle)).toBe(false);
        expect(handle.parentElement).toBe(tag.parentElement);
        expect(handle.parentElement).toHaveClass(`${tagInputCls}-drag-item`);
        expect(tag).not.toHaveClass(`${tagInputCls}-wrapper-tag-icon`);
    });

    it('draggable 时重复标签各有自己的句柄，关闭第二个只删除第二个', async () => {
        const onRemove = vi.fn<NonNullable<Props['onRemove']>>();
        setup({ props: { draggable: true, value: ['a', 'b', 'a'], onRemove } });
        await userEvent.click(getRoot());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        expect(getTagTexts()).toEqual(['a', 'b', 'a']);
        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[2]);
        expect(onRemove).toHaveBeenCalledWith('a', 2);
        await waitFor(() => expect(getTagTexts()).toEqual(['a', 'b']));
    });

    it('draggable 配合 tag snippet 时句柄与自定义节点同在 -drag-item 中', async () => {
        setup({ props: { draggable: true, value: ['abc', 'def'] }, tag: 'text' });
        expect(document.querySelector(`.${tagInputCls}-drag-item`)).toBeNull();
        await userEvent.click(getRoot());
        await waitFor(() => expect(document.querySelectorAll(`.${tagInputCls}-drag-item`)).toHaveLength(2));
        for (const item of document.querySelectorAll(`.${tagInputCls}-drag-item`)) {
            expect(item.querySelector(`.${tagInputCls}-drag-handler`)).not.toBeNull();
            expect(item.querySelector('.custom-tag-item')).not.toBeNull();
        }
    });

    it('data-* 属性落在根元素，控制属性落在输入框', async () => {
        const onkeyup = vi.fn<(event: KeyboardEvent) => void>();
        setup({
            props: {
                id: 'tags',
                role: 'combobox',
                'aria-describedby': 'desc',
                'aria-label': 'Tags',
                'aria-required': true,
                'data-testid': 'root',
                title: 'tags title',
                onkeyup,
            },
        });
        const native = document.querySelector('input') as HTMLInputElement;
        expect(native).toBe(screen.getByRole('combobox', { name: 'Tags' }));
        for (const [attr, value] of [
            ['id', 'tags'],
            ['aria-describedby', 'desc'],
            ['aria-required', 'true'],
        ]) {
            expect(native).toHaveAttribute(attr, value);
            expect(getRoot()).not.toHaveAttribute(attr);
        }
        expect(getRoot()).toHaveAttribute('role', 'group');
        expect(getRoot()).toHaveAttribute('title', 'tags title');
        expect(screen.getByTestId('root')).toBe(getRoot());
        expect(native).not.toHaveAttribute('title');
        await fireEvent.keyUp(native);
        expect(onkeyup).toHaveBeenCalledTimes(1);
    });

    it('显式 tabindex 交给输入框，根元素不成为 Tab 停靠点', () => {
        setup({ props: { tabindex: -1 } });
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
    });

    it('读取 semiGlobal 的默认值，传入 undefined 视为未设置', async () => {
        semiGlobal.config.overrideDefaultProps = { TagInput: { separator: '-', showClear: true } };
        const view = setup({ props: { inputValue: 'a-b' } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(getClearBtn()).not.toBeNull();
        view.view.unmount();

        const second = setup({ props: { inputValue: 'a-b', separator: null, showClear: false } });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a-b']);
        expect(getClearBtn()).toBeNull();
        second.view.unmount();

        semiGlobal.config.overrideDefaultProps = { TagInput: { size: 'large', allowDuplicates: false } };
        setup({ props: { value: ['a'], size: undefined } });
        expect(getRoot()).toHaveClass(`${tagInputCls}-large`);
    });

    it('全局 Input 的默认值不给 TagInput 的输入框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        setup({ props: { value: ['a'] } });
        await typeText('b');
        expect(getInput()).toHaveValue('b');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('卸载激活中的 TagInput 时移除 document 的 mousedown 监听', async () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const live = () => add.mock.calls.filter(([type]) => type === 'mousedown').length - remove.mock.calls.filter(([type]) => type === 'mousedown').length;
        const { view } = setup({ props: { value: ['abc'] } });
        // Svelte's own delegated mousedown listener counts too, and goes away with the mounted root
        const before = live();
        await userEvent.click(getRoot());
        expect(live()).toBe(before + 1);
        view.unmount();
        expect(live()).toBe(0);
    });
});

describe('Svelte TagInput 受控值的写法', () => {
    it('bind:value：交互写回父级，父级改值同步到标签，改回 undefined 时清空', async () => {
        const { store, input } = setupModes('value', 'bind', { value: ['a'] });
        expect(getTagTexts()).toEqual(['a']);
        await userEvent.type(input, 'b{Enter}');
        await settle();
        expect(store.value).toEqual(['a', 'b']);
        expect(getTagTexts()).toEqual(['a', 'b']);
        await pressBackspace();
        expect(store.value).toEqual(['a']);
        store.value = ['x', 'y'];
        await settle();
        expect(getTagTexts()).toEqual(['x', 'y']);
        store.value = undefined;
        await settle();
        expect(getTagTexts()).toEqual([]);
        await userEvent.type(input, 'c{Enter}');
        await settle();
        expect(getTagTexts()).toEqual(['c']);
        expect(store.value).toEqual(['c']);
    });

    it('value 函数绑定：setter 拒绝时标签保持原样，只通知', async () => {
        const { store, input } = setupModes('value', 'function', { value: ['a'], accept: false });
        await userEvent.type(input, 'b{Enter}');
        await settle();
        expect(store.log).toEqual(['set a,b', 'change a,b']);
        expect(store.value).toEqual(['a']);
        expect(getTagTexts()).toEqual(['a']);
    });

    it('value 函数绑定：setter 接受时标签跟随', async () => {
        const { store, input } = setupModes('value', 'function', { value: ['a'], accept: true });
        await userEvent.type(input, 'b{Enter}');
        await settle();
        expect(store.value).toEqual(['a', 'b']);
        expect(getTagTexts()).toEqual(['a', 'b']);
    });

    it('value 单向传值：交互在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, input } = setupModes('value', 'one-way', { value: ['a'] });
        await userEvent.type(input, 'b{Enter}');
        await settle();
        expect(store.value).toEqual(['a']);
        expect(getTagTexts()).toEqual(['a', 'b']);
        store.value = ['x'];
        await settle();
        expect(getTagTexts()).toEqual(['x']);
    });

    it('value 单向传值改回 undefined 时清空', async () => {
        const { store } = setupModes('value', 'one-way', { value: ['a', 'b'] });
        store.value = undefined;
        await settle();
        expect(getTagTexts()).toEqual([]);
    });

    it('value 不传：非受控，自己保存标签', async () => {
        const { store, input } = setupModes('value', 'uncontrolled');
        await userEvent.type(input, 'a,b{Enter}');
        await settle();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(store.log).toEqual(['change a,b']);
    });

    it('bind:inputValue：输入写回父级，父级改值同步到输入框，改回 undefined 时清空', async () => {
        const { store, input } = setupModes('inputValue', 'bind', { inputValue: 'a' });
        expect(input).toHaveValue('a');
        await userEvent.type(input, 'b');
        await settle();
        expect(store.inputValue).toBe('ab');
        expect(input).toHaveValue('ab');
        store.inputValue = 'parent';
        await settle();
        expect(input).toHaveValue('parent');
        store.inputValue = undefined;
        await settle();
        expect(input).toHaveValue('');
        await userEvent.type(input, 'c');
        await settle();
        expect(input).toHaveValue('c');
        expect(store.inputValue).toBe('c');
    });

    it('bind:inputValue：Enter 加入标签后父级的文本被清空', async () => {
        const { store, input } = setupModes('inputValue', 'bind', { inputValue: 'a,b' });
        await fireEvent.keyDown(input, { key: 'Enter' });
        await settle();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(store.inputValue).toBe('');
        expect(input).toHaveValue('');
        expect(store.log).toEqual(['input ']);
    });

    it('inputValue 函数绑定：setter 拒绝时输入框退回原值，只通知', async () => {
        const { store, input } = setupModes('inputValue', 'function', { inputValue: 'fixed', accept: false });
        await userEvent.type(input, 'x');
        await settle();
        expect(store.log).toEqual(['set fixedx', 'input fixedx']);
        expect(store.inputValue).toBe('fixed');
        expect(input).toHaveValue('fixed');
    });

    it('inputValue 函数绑定：setter 接受时输入框跟随', async () => {
        const { store, input } = setupModes('inputValue', 'function', { inputValue: 'a', accept: true });
        await userEvent.type(input, 'b');
        await settle();
        expect(store.inputValue).toBe('ab');
        expect(input).toHaveValue('ab');
    });

    it('inputValue 单向传值：输入在本地覆盖，父级再推值时覆盖本地，改回 undefined 时清空', async () => {
        const { store, input } = setupModes('inputValue', 'one-way', { inputValue: 'a' });
        await userEvent.type(input, 'b');
        await settle();
        expect(store.inputValue).toBe('a');
        expect(input).toHaveValue('ab');
        store.inputValue = 'x';
        await settle();
        expect(input).toHaveValue('x');
        store.inputValue = undefined;
        await settle();
        expect(input).toHaveValue('');
    });

    it('inputValue 不传：非受控，自己保存文本', async () => {
        const { store, input } = setupModes('inputValue', 'uncontrolled');
        await userEvent.type(input, 'ab');
        await settle();
        expect(input).toHaveValue('ab');
        expect(store.log).toEqual(['input a', 'input ab']);
    });
});
