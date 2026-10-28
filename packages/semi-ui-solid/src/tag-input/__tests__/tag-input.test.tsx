import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners } from '@test/utils/solid';
import TagInput, { type TagInputProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import { type FormApi, Form, FormTagInput } from '../../form';
import Tooltip from '../../tooltip';

const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
const tagSelector = `.${tagInputCls}-wrapper .${BASE_CLASS_PREFIX}-tag-content`;

const getRoot = () => document.querySelector(`.${tagInputCls}`) as HTMLElement;
const getInput = () => screen.getByRole('textbox') as HTMLInputElement;
const getTagTexts = () => Array.from(document.querySelectorAll(tagSelector)).map((node) => node.textContent);
const getClearBtn = () => document.querySelector(`.${tagInputCls}-clearBtn`) as HTMLElement;
const getRestCount = () => document.querySelector(`.${tagInputCls}-wrapper-n`);
const pressEnter = () => fireEvent.keyDown(getInput(), { key: 'Enter' });
const pressBackspace = () => fireEvent.keyDown(getInput(), { key: 'Backspace' });

// jsdom keeps no hover state; Tooltip re-checks `:hover` on its trigger right after opening and closes otherwise.
// The spy is set at the first hover of a test (afterEach takes it off and clears `hovered`) and reads the latest
// target, since spying on a spied method returns the same spy and the method read from the prototype would then be
// the spy itself.
let hovered: Element | null = null;
async function hover(target: Element) {
    if (!hovered) {
        vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
            return selector === ':hover' ? Boolean(hovered && this.contains(hovered)) : this.closest(selector) === this;
        });
    }
    hovered = target;
    await userEvent.hover(target);
}

function renderTagInput(props: TagInputProps & Record<string, unknown> = {}) {
    return render(() => <TagInput {...props} />);
}

afterEach(() => {
    vi.restoreAllMocks();
    hovered = null;
    semiGlobal.config.overrideDefaultProps = {};
});

describe('TagInput', () => {
    it('TagInput 带 prefix / suffix', () => {
        render(() => (
            <>
                <TagInput suffix={<div class="suffix">suffix</div>} />
                <TagInput prefix={<div class="prefix">prefix</div>} />
            </>
        ));
        expect(document.querySelector(`.${tagInputCls}-suffix .suffix`)).toHaveTextContent('suffix');
        expect(document.querySelector(`.${tagInputCls}-prefix .prefix`)).toHaveTextContent('prefix');
    });

    it('标签值里的 $&、$$ 按原文写入关闭按钮名称，不当作替换模式', () => {
        renderTagInput({ defaultValue: ['$&-$$'] });
        expect(screen.getByRole('button', { name: zh_CN.Tag.closableTag.split('${tag}').join('$&-$$') })).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
    });

    it('TagInput 的 validateStatus', () => {
        const { container: warning } = renderTagInput({ validateStatus: 'warning' });
        const { container: error } = renderTagInput({ validateStatus: 'error' });
        const { container: normal } = renderTagInput({});
        expect(warning.querySelector(`.${tagInputCls}-warning`)).not.toBeNull();
        expect(error.querySelector(`.${tagInputCls}-error`)).not.toBeNull();
        expect(normal.querySelector(`.${tagInputCls}-error`)).toBeNull();
        expect(normal.querySelector(`.${tagInputCls}-warning`)).toBeNull();
    });

    it('TagInput 的 placeholder', () => {
        renderTagInput({ placeholder: 'semi placeholder' });
        expect(getInput()).toHaveAttribute('placeholder', 'semi placeholder');
    });

    it('TagInput 自定义 class 和 style', () => {
        const { container } = renderTagInput({ class: 'test', style: { color: 'red' } });
        const root = container.querySelector('div.test');
        expect(root).toHaveClass(tagInputCls);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('TagInput 的 size', () => {
        const { container: large } = renderTagInput({ size: 'large' });
        const { container: small } = renderTagInput({ size: 'small' });
        expect(large.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-large`)).toHaveLength(1);
        expect(small.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-small`)).toHaveLength(1);
    });

    it('TagInput 的 showClear', () => {
        const { unmount } = renderTagInput({ showClear: true });
        expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull();
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`)).not.toBeNull();
        unmount();

        const { unmount: unmount2 } = renderTagInput({ showClear: false });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).toBeNull();
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`)).toBeNull();
        unmount2();

        renderTagInput({ showClear: true, inputValue: 'semi' });
        expect(screen.getByRole('button', { name: zh_CN.TagInput.clear })).toBe(getClearBtn());
    });

    it('TagInput 的 defaultValue', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon'] });
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
    });

    it('value 为 undefined 时按非受控处理，显示 defaultValue', () => {
        renderTagInput({ defaultValue: ['semi', 'hotsoon'], value: undefined });
        expect(getTagTexts()).toEqual(['semi', 'hotsoon']);
    });

    it('TagInput 的 defaultValue 且 value 为 null', () => {
        renderTagInput({ defaultValue: ['semi', 'hotsoon'], value: null });
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 的 disabled', () => {
        const { unmount } = renderTagInput({ disabled: true });
        expect(getRoot()).toHaveClass(`${tagInputCls}-disabled`);
        expect(getInput()).toBeDisabled();
        unmount();
        renderTagInput({});
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-disabled`);
    });

    it('TagInput 的 separator', () => {
        const { unmount } = renderTagInput({ separator: '-', inputValue: 'abc-hotsoon' });
        pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        unmount();

        const { unmount: unmount2 } = renderTagInput({ separator: null, inputValue: 'semi-hotsoon' });
        pressEnter();
        expect(getTagTexts()).toEqual(['semi-hotsoon']);
        unmount2();

        renderTagInput({ separator: 1 as unknown as string, inputValue: 'semi1design' });
        pressEnter();
        expect(getTagTexts()).toEqual(['semi', 'design']);
    });

    it('TagInput 的数组类型 separator', () => {
        renderTagInput({ separator: ['-', '/', '*'], inputValue: 'abc-hotsoon/pipixi*qingyan' });
        pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon', 'pipixi', 'qingyan']);
    });

    it('TagInput 的 onRemove 和 onChange', async () => {
        const onRemove = vi.fn<NonNullable<TagInputProps['onRemove']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({
            defaultValue: ['abc', 'hotsoon', 'toutiao', 'lark'],
            onRemove,
            onChange,
            showClear: true,
        });
        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[1]);
        expect(onRemove).toHaveBeenNthCalledWith(1, 'hotsoon', 1);
        expect(onChange).toHaveBeenNthCalledWith(1, ['abc', 'toutiao', 'lark']);
        expect(getTagTexts()).toEqual(['abc', 'toutiao', 'lark']);

        pressBackspace();
        expect(onRemove).toHaveBeenNthCalledWith(2, 'lark', 2);
        expect(onChange).toHaveBeenNthCalledWith(2, ['abc', 'toutiao']);

        await userEvent.hover(getRoot());
        await userEvent.click(getClearBtn());
        expect(onChange).toHaveBeenNthCalledWith(3, []);
        expect(onRemove).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledTimes(3);
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 的 onAdd 和 onChange', () => {
        const onAdd = vi.fn<NonNullable<TagInputProps['onAdd']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();

        const { unmount } = renderTagInput({ onChange, onAdd });
        pressEnter();
        expect(onAdd).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        unmount();

        renderTagInput({ inputValue: 'abc,toutiao,,,hotsoon', onChange, defaultValue: ['lark'], onAdd });
        pressEnter();
        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(['abc', 'toutiao', 'hotsoon']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['lark', 'abc', 'toutiao', 'hotsoon']);
    });

    it('TagInput 的 maxTagCount', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon'], maxTagCount: 2, inputValue: 'lark' });
        pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        expect(getRestCount()).toHaveTextContent('+1');
    });

    it('TagInput 的 maxLength', async () => {
        renderTagInput({ maxLength: 3 });
        await userEvent.type(getInput(), 'tik');
        expect(getInput()).toHaveValue('tik');
        await userEvent.type(getInput(), 't');
        expect(getInput()).toHaveValue('tik');
    });

    it('TagInput 的 onInputExceed', async () => {
        const onInputExceed = vi.fn<NonNullable<TagInputProps['onInputExceed']>>();
        renderTagInput({ maxLength: 2, onInputExceed });
        await userEvent.click(getInput());
        await userEvent.paste('hotsoon');
        expect(onInputExceed).toHaveBeenCalledTimes(1);
        expect(onInputExceed).toHaveBeenCalledWith('hotsoon');
        expect(getInput()).toHaveValue('');
    });

    it('TagInput 的 onBlur 和 onFocus', async () => {
        const onBlur = vi.fn<NonNullable<TagInputProps['onBlur']>>();
        const onFocus = vi.fn<NonNullable<TagInputProps['onFocus']>>();
        renderTagInput({ onBlur, onFocus });
        await userEvent.click(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
    });

    it('TagInput 的事件回调参数类型与实际事件一致', () => {
        type Props = Required<TagInputProps>;
        expectTypeOf<Parameters<Props['onBlur']>[0]['relatedTarget']>().toExtend<EventTarget | null>();
        expectTypeOf<Parameters<Props['onBlur']>[0]['currentTarget']>().toExtend<HTMLDivElement>();
        expectTypeOf<Parameters<Props['onFocus']>[0]['currentTarget']>().toExtend<HTMLDivElement>();
        expectTypeOf<InputEvent>().toExtend<Parameters<Props['onInputChange']>[1]>();
        expectTypeOf<KeyboardEvent>().toExtend<Parameters<Props['onInputChange']>[1]>();
        expectTypeOf<FocusEvent>().toExtend<Parameters<Props['onInputChange']>[1]>();
        expectTypeOf<MouseEvent>().toExtend<Parameters<Props['onInputChange']>[1]>();
    });

    it('TagInput 受控 value 模式', () => {
        const [value, setValue] = createSignal<string[]>(['abc']);
        render(() => <TagInput value={value()} />);
        expect(getTagTexts()).toEqual(['abc']);
        setValue(['hotsoon']);
        expect(getTagTexts()).toEqual(['hotsoon']);
    });

    it('TagInput 将 value 设为 null', () => {
        const [value, setValue] = createSignal<string[] | null>(['semi']);
        render(() => <TagInput value={value()} />);
        expect(getTagTexts()).toEqual(['semi']);
        setValue(null);
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 将 value 设为 undefined', () => {
        const [value, setValue] = createSignal<string[] | undefined>(['semi']);
        render(() => <TagInput value={value()} />);
        expect(getTagTexts()).toEqual(['semi']);
        setValue(undefined);
        expect(getTagTexts()).toEqual([]);
    });

    it('有 defaultValue 时受控 value 变回 undefined 也清空', () => {
        const [value, setValue] = createSignal<string[] | undefined>(['semi']);
        render(() => <TagInput defaultValue={['init']} value={value()} />);
        expect(getTagTexts()).toEqual(['semi']);
        setValue(undefined);
        expect(getTagTexts()).toEqual([]);
    });

    it('父组件挂载时就让 value 变回 undefined，有 defaultValue 也清空', () => {
        function Demo() {
            const [value, setValue] = createSignal<string[] | undefined>(['semi']);
            onMount(() => setValue(undefined));
            return <TagInput defaultValue={['init']} value={value()} />;
        }
        render(() => <Demo />);
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 受控 inputValue 模式', () => {
        const [inputValue, setInputValue] = createSignal('abc');
        render(() => <TagInput inputValue={inputValue()} />);
        expect(getInput()).toHaveValue('abc');
        setInputValue('hotsoon');
        expect(getInput()).toHaveValue('hotsoon');
    });

    it('TagInput 的 onKeyDown', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => string>((e) => e.key);
        renderTagInput({ onKeyDown });
        pressEnter();
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.results[0].value).toEqual('Enter');
    });

    it('TagInput 的 allowDuplicates', () => {
        renderTagInput({ allowDuplicates: true, defaultValue: ['abc'], inputValue: 'abc' });
        pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'abc']);
    });

    it('TagInput 的 renderTagItem', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon'], renderTagItem: (value) => <span class="custom-tag-item">{value}</span> });
        const items = document.querySelectorAll('.custom-tag-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(['abc', 'hotsoon']);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('TagInput 的 autofocus', () => {
        renderTagInput({ autofocus: true });
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('TagInput 的 aria-label', () => {
        renderTagInput({ 'aria-label': 'Tag input field' });
        expect(screen.getByLabelText('Tag input field')).toBe(getInput());
        expect(getRoot()).not.toHaveAttribute('aria-label');
    });

    it('TagInput 未传 name 时回退到语言包文案，名称交给 label 或 id 处理', () => {
        const { unmount } = renderTagInput({});
        expect(getInput()).toHaveAttribute('aria-label', zh_CN.TagInput.input);
        unmount();
        const { unmount: unmountLabelled } = renderTagInput({ 'aria-labelledby': 'someone' });
        expect(getInput()).not.toHaveAttribute('aria-label');
        unmountLabelled();
        renderTagInput({ id: 'form-id' });
        expect(getInput()).not.toHaveAttribute('aria-label');
    });

    it('ref 的 focus 带 preventScroll 聚焦输入框', () => {
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
        let root!: HTMLDivElement;
        render(() => <TagInput ref={(node) => (root = node)} preventScroll />);
        root.focus();
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).toHaveFocus();
    });

    it('TagInput 的 insetLabel', () => {
        renderTagInput({
            insetLabel: <span class="inset-label">Label</span>,
            insetLabelId: 'inset-label-id',
        });
        const label = document.querySelector('.inset-label') as HTMLElement;
        expect(label).toHaveTextContent('Label');
        expect(label.parentElement).toHaveAttribute('id', 'inset-label-id');
    });

    it('prefix、suffix 为 0 时照常渲染，数字按文字处理', () => {
        const { container } = renderTagInput({ prefix: 0, suffix: 0 });
        expect(container.querySelector(`.${tagInputCls}-prefix`)).toHaveClass(`${tagInputCls}-prefix-text`);
        expect(container.querySelector(`.${tagInputCls}-prefix`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${tagInputCls}-suffix`)).toHaveClass(`${tagInputCls}-suffix-text`);
        expect(container.querySelector(`.${tagInputCls}`)).toHaveClass(`${tagInputCls}-with-prefix`, `${tagInputCls}-with-suffix`);
    });

    it('TagInput 的 showRestTagsPopover 为 false', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon', 'lark'], maxTagCount: 1, showRestTagsPopover: false });
        expect(getRestCount()).toHaveTextContent('+2');
        expect(getTagTexts()).toEqual(['abc']);
    });

    it('TagInput 的 restTagsPopoverProps', async () => {
        renderTagInput({
            defaultValue: ['abc', 'hotsoon', 'lark'],
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { position: 'bottom' },
        });
        await hover(getRestCount() as Element);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).not.toBeNull());
        const popover = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(popover).toHaveAttribute('x-placement', 'bottom');
        expect(popover).toHaveTextContent('hotsoon');
        expect(popover).toHaveTextContent('lark');
    });

    it('+N 弹层打开时，受控 value 变化后弹层里的标签随之更新', () => {
        const [value, setValue] = createSignal(['abc', 'hotsoon']);
        render(() => <TagInput value={value()} maxTagCount={1} showRestTagsPopover restTagsPopoverProps={{ trigger: 'custom', visible: true, motion: false }} />);
        const popover = () => document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(popover()).toHaveTextContent('hotsoon');
        setValue(['abc', 'hotsoon', 'lark']);
        expect(popover()).toHaveTextContent('hotsoonlark');
    });

    it('TagInput 的 showContentTooltip', async () => {
        // jsdom has no text layout; make every tag text wider than its zero-width container so it counts as truncated
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20 } as DOMRect);
        renderTagInput({ defaultValue: ['abc'], showContentTooltip: true });
        await hover(screen.getByText('abc'));
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).not.toBeNull());
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent('abc');
    });

    it('TagInput 的 showContentTooltip 对象形式', async () => {
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20 } as DOMRect);
        renderTagInput({
            defaultValue: ['abc'],
            showContentTooltip: { type: 'popover', opts: { position: 'top' } },
        });
        await hover(screen.getByText('abc'));
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).not.toBeNull());
        const popover = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(popover).toHaveAttribute('x-placement', 'top');
        expect(popover).toHaveTextContent('abc');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull();
    });

    it('TagInput 的 expandRestTagsOnClick 为 false', async () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon', 'lark'], maxTagCount: 1, expandRestTagsOnClick: false });
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(getRestCount()).toHaveTextContent('+2');
        expect(getTagTexts()).toEqual(['abc']);
    });

    it('TagInput 的 clearIcon', () => {
        renderTagInput({
            showClear: true,
            defaultValue: ['abc'],
            clearIcon: <span class="custom-clear-icon">X</span>,
        });
        expect(getClearBtn().querySelector('.custom-clear-icon')).not.toBeNull();
        expect(getClearBtn().querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).toBeNull();
    });

    it('TagInput 的 split 函数', () => {
        const customSplit = vi.fn<NonNullable<TagInputProps['split']>>((str, sep) => str.split(sep as string).filter(Boolean));
        renderTagInput({ split: customSplit, inputValue: 'abc,def' });
        pressEnter();
        expect(customSplit).toHaveBeenCalledWith('abc,def', ',');
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('TagInput 的 focus 和 blur 方法', () => {
        let root!: HTMLDivElement;
        render(() => <TagInput ref={(node) => (root = node)} defaultValue={['abc']} />);
        root.focus();
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        root.blur();
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('TagInput 的输入法组合事件', () => {
        const onInputExceed = vi.fn<NonNullable<TagInputProps['onInputExceed']>>();
        renderTagInput({ defaultValue: ['abc'], maxLength: 3, onInputExceed });
        const input = getInput();
        fireEvent.compositionStart(input);
        fireEvent.input(input, { target: { value: 'zhongwen' } });
        expect(input).toHaveValue('zhongwen');
        expect(onInputExceed).not.toHaveBeenCalled();
        fireEvent.compositionEnd(input, { target: { value: 'zhongwen' } });
        expect(input).toHaveValue('zho');
        expect(onInputExceed).toHaveBeenCalledWith('zhongwen');
    });

    it('TagInput 的鼠标进入和离开不改变根元素类名（悬停样式由 CSS :hover 提供）', () => {
        renderTagInput({ defaultValue: ['abc'] });
        const className = getRoot().className;
        fireEvent.mouseEnter(getRoot());
        expect(getRoot().className).toBe(className);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
        fireEvent.mouseLeave(getRoot());
        expect(getRoot().className).toBe(className);
    });

    it('TagInput 禁用时不触发点击', () => {
        renderTagInput({ defaultValue: ['abc'], disabled: true });
        fireEvent.click(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('空输入时按 Backspace 无操作', () => {
        const onRemove = vi.fn<NonNullable<TagInputProps['onRemove']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ defaultValue: [], onRemove, onChange });
        pressBackspace();
        expect(onRemove).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('error 状态下输入框带 aria-invalid，无角色的根元素不带', () => {
        renderTagInput({ validateStatus: 'error' });
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        expect(getRoot()).not.toHaveAttribute('aria-invalid');
    });

    it('非 error 状态下输入框不带 aria-invalid，显式传入的 aria-invalid 优先', () => {
        const [status, setStatus] = createSignal<TagInputProps['validateStatus']>('warning');
        const [invalid, setInvalid] = createSignal<boolean | undefined>();
        render(() => <TagInput aria-invalid={invalid()} validateStatus={status()} />);
        expect(getInput()).not.toHaveAttribute('aria-invalid');
        setStatus('error');
        setInvalid(false);
        expect(getInput()).toHaveAttribute('aria-invalid', 'false');
    });

    it('根元素是 group，禁用时带 aria-disabled，输入框为原生 disabled', () => {
        const [disabled, setDisabled] = createSignal(false);
        render(() => <TagInput disabled={disabled()} />);
        expect(screen.getByRole('group')).toBe(getRoot());
        expect(getRoot()).not.toHaveAttribute('aria-disabled');
        setDisabled(true);
        expect(getInput()).toBeDisabled();
        expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
    });

    it('禁用时静态标签不带 aria-label，标签文字本身可见', () => {
        renderTagInput({ disabled: true, defaultValue: ['abc'] });
        const tag = document.querySelector(`.${BASE_CLASS_PREFIX}-tag`) as HTMLElement;
        expect(tag).toHaveTextContent('abc');
        expect(tag).not.toHaveAttribute('role');
        expect(tag).not.toHaveAttribute('aria-label');
    });

    it('下标与标签值拼接相同的标签各自渲染', () => {
        // index 1 with '1a' and index 11 with 'a' both concatenate to '11a'
        const value = ['x', '1a', ...Array.from({ length: 9 }, (_, i) => `t${i}`), 'a'];
        renderTagInput({ value });
        expect(getTagTexts()).toEqual(value);
    });

    it('addOnBlur 时未输入文字就失焦，不上报 onInputChange', async () => {
        const onInputChange = vi.fn<NonNullable<TagInputProps['onInputChange']>>();
        const onBlur = vi.fn<NonNullable<TagInputProps['onBlur']>>();
        renderTagInput({ addOnBlur: true, onInputChange, onBlur });
        await userEvent.click(getInput());
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onInputChange).not.toHaveBeenCalled();
    });

    it('点击清空按钮', async () => {
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ defaultValue: ['abc', 'def'], showClear: true, onChange });
        await userEvent.click(getClearBtn());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
        expect(getInput()).toHaveFocus();
    });

    it('点击 suffix 会聚焦输入框', async () => {
        renderTagInput({ defaultValue: ['abc'], suffix: <span class="test-suffix">Suffix</span> });
        await userEvent.click(document.querySelector('.test-suffix') as Element);
        expect(getInput()).toHaveFocus();
    });

    it('TagInput 的 allowDuplicates 为 false', async () => {
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ defaultValue: ['abc'], allowDuplicates: false, onChange });
        await userEvent.type(getInput(), 'abc,def,def');
        pressEnter();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['abc', 'def']);
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('TagInput 的 max', async () => {
        const onExceed = vi.fn<NonNullable<TagInputProps['onExceed']>>();
        renderTagInput({ defaultValue: ['a', 'b', 'c'], max: 3, onExceed });
        await userEvent.type(getInput(), 'd');
        pressEnter();
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('TagInput 超出 maxLength 的输入触发 onInputExceed', async () => {
        const onInputExceed = vi.fn<NonNullable<TagInputProps['onInputExceed']>>();
        renderTagInput({ maxLength: 5, onInputExceed });
        await userEvent.type(getInput(), 'abcdef');
        expect(onInputExceed).toHaveBeenCalledTimes(1);
        expect(onInputExceed).toHaveBeenCalledWith('abcdef');
        expect(getInput()).toHaveValue('abcde');
    });

    it('TagInput 受控 value', async () => {
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ value: ['controlled', 'tags'], onChange });
        expect(getTagTexts()).toEqual(['controlled', 'tags']);
        await userEvent.type(getInput(), 'new');
        pressEnter();
        expect(onChange).toHaveBeenCalledWith(['controlled', 'tags', 'new']);
        expect(getTagTexts()).toEqual(['controlled', 'tags']);
    });

    it('TagInput 的 onInputChange 回调', async () => {
        const onInputChange = vi.fn<NonNullable<TagInputProps['onInputChange']>>();
        renderTagInput({ onInputChange });
        await userEvent.type(getInput(), 'test');
        expect(onInputChange).toHaveBeenCalledTimes(4);
        expect(onInputChange.mock.calls[3][0]).toEqual('test');
    });

    it('TagInput 的 onKeyDown 回调', async () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => string>((e) => e.key);
        renderTagInput({ onKeyDown });
        await userEvent.type(getInput(), 'a');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.results[0].value).toEqual('a');
    });

    it('Enter 键添加标签', async () => {
        const onAdd = vi.fn<NonNullable<TagInputProps['onAdd']>>();
        renderTagInput({ defaultValue: [], onAdd });
        await userEvent.type(getInput(), 'newtag');
        pressEnter();
        expect(onAdd).toHaveBeenCalledWith(['newtag']);
        expect(getTagTexts()).toEqual(['newtag']);
        expect(getInput()).toHaveValue('');
    });

    it('字符串类型的 separator', async () => {
        renderTagInput({ separator: ',' });
        await userEvent.type(getInput(), 'a,b');
        pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
    });

    it('数组类型的 separator', async () => {
        renderTagInput({ separator: [',', ';'] });
        await userEvent.type(getInput(), 'a;b,c');
        pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('受控 inputValue 的更新', async () => {
        const [inputValue, setInputValue] = createSignal('initial');
        render(() => <TagInput inputValue={inputValue()} />);
        expect(getInput()).toHaveValue('initial');
        await userEvent.type(getInput(), 'x');
        expect(getInput()).toHaveValue('initial');
        setInputValue('updated');
        expect(getInput()).toHaveValue('updated');
    });

    it('字符串类型的 insetLabel', () => {
        renderTagInput({ insetLabel: 'Label:' });
        expect(document.querySelector(`.${tagInputCls}-inset-label`)).toHaveTextContent('Label:');
        expect(getRoot()).toHaveClass(`${tagInputCls}-with-prefix`);
    });

    it('字符串类型的 prefix 渲染文本类名', () => {
        renderTagInput({ prefix: 'Prefix:' });
        expect(document.querySelector(`.${tagInputCls}-prefix-text`)).toHaveTextContent('Prefix:');
    });

    it('字符串类型的 suffix 渲染文本类名', () => {
        renderTagInput({ suffix: 'Suffix' });
        expect(document.querySelector(`.${tagInputCls}-suffix-text`)).toHaveTextContent('Suffix');
        expect(getRoot()).toHaveClass(`${tagInputCls}-with-suffix`);
    });

    it('TagInput 的 small、large 与默认尺寸', () => {
        const { container: small } = renderTagInput({ size: 'small' });
        const { container: large } = renderTagInput({ size: 'large' });
        const { container: normal } = renderTagInput({ size: 'default' });
        expect(small.firstElementChild).toHaveClass(`${tagInputCls}-small`);
        expect(large.firstElementChild).toHaveClass(`${tagInputCls}-large`);
        expect(normal.firstElementChild).not.toHaveClass(`${tagInputCls}-small`);
        expect(normal.firstElementChild).not.toHaveClass(`${tagInputCls}-large`);
    });

    it('expandRestTagsOnClick 为 true 时点击展开剩余标签', async () => {
        renderTagInput({
            defaultValue: ['abc', 'hotsoon', 'lark', 'bytedance'],
            maxTagCount: 2,
            expandRestTagsOnClick: true,
        });
        expect(getRestCount()).toHaveTextContent('+2');
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(getRestCount()).toBeNull();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon', 'lark', 'bytedance']);
    });

    it('输入法组合事件 compositionEnd', () => {
        const onInputExceed = vi.fn<NonNullable<TagInputProps['onInputExceed']>>();
        renderTagInput({ defaultValue: ['abc'], maxLength: 2, separator: ',', onInputExceed });
        const input = getInput();

        fireEvent.compositionStart(input);
        fireEvent.compositionEnd(input, { target: { value: 'ab,cde' } });
        expect(input).toHaveValue('ab,cd');
        expect(onInputExceed).toHaveBeenCalledWith('ab,cde');
    });

    it('输入法提交超出 maxLength 的文本，separator 为数组时按首个分隔符拼接', () => {
        renderTagInput({ maxLength: 2, separator: ['-', ' '] });
        const input = getInput();

        fireEvent.compositionStart(input);
        fireEvent.compositionEnd(input, { target: { value: 'ab-cde' } });
        expect(input).toHaveValue('ab-cd');
        pressEnter();
        expect(getTagTexts()).toEqual(['ab', 'cd']);
    });

    it('受控 inputValue 下，输入法提交的超长文本被截断后经 onInputChange 通知', () => {
        const onInputChange = vi.fn<NonNullable<TagInputProps['onInputChange']>>();
        renderTagInput({ inputValue: '', maxLength: 2, separator: ',', onInputChange });
        const input = getInput();

        fireEvent.compositionStart(input);
        fireEvent.compositionEnd(input, { target: { value: 'ab,cde' } });
        expect(onInputChange).toHaveBeenLastCalledWith('ab,cd', expect.anything());
    });

    it('点击输入框后用 Tab 离开，激活状态随之结束', async () => {
        render(() => (
            <>
                <TagInput defaultValue={['abc']} />
                <button type="button">after</button>
            </>
        ));
        await userEvent.click(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('输入法组合流程', () => {
        renderTagInput({ defaultValue: ['abc'] });
        const input = getInput();

        fireEvent.compositionStart(input);
        fireEvent.input(input, { target: { value: '中文' } });
        fireEvent.compositionEnd(input, { target: { value: '中文' } });
        expect(input).toHaveValue('中文');
        pressEnter();
        expect(getTagTexts()).toEqual(['abc', '中文']);
    });

    it('禁用状态下的 showClear', async () => {
        renderTagInput({ showClear: true, disabled: true, defaultValue: ['abc'] });
        await userEvent.hover(getRoot());
        expect(getClearBtn()).toBeNull();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
    });

    it('无输入文字也无标签时的 showClear', async () => {
        renderTagInput({ showClear: true, defaultValue: [], inputValue: '' });
        await userEvent.hover(getRoot());
        expect(getClearBtn()).toBeNull();
    });

    it('使用 Sortable 组件的 draggable', async () => {
        renderTagInput({ draggable: true, defaultValue: ['abc', 'def', 'ghi'] });
        expect(document.querySelectorAll(`.${tagInputCls}-drag-handler`)).toHaveLength(0);
        expect(document.querySelector(`.${tagInputCls}-sortable-list`)).toBeNull();
        await userEvent.click(getRoot());
        const itemSelector = `.${tagInputCls}-sortable-list .${tagInputCls}-wrapper-tag-icon`;
        await waitFor(() => expect(document.querySelectorAll(itemSelector)).toHaveLength(3));
        expect(screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })).toHaveLength(3);
        const items = document.querySelectorAll(itemSelector);
        expect(Array.from(items).map((item) => item.textContent)).toEqual(['abc', 'def', 'ghi']);
        items.forEach((item) => expect(item.querySelector(`.${tagInputCls}-drag-handler`)).not.toBeNull());
    });

    it('悬停状态不影响根元素类名，清除按钮照常存在', async () => {
        renderTagInput({ showClear: true, defaultValue: ['abc'] });

        await userEvent.hover(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
        expect(getClearBtn()).not.toBeNull();

        await userEvent.unhover(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
    });

    it('组合输入结束时未超长则按提交的文本更新输入框', () => {
        const onInputExceed = vi.fn<NonNullable<TagInputProps['onInputExceed']>>();
        renderTagInput({ defaultValue: ['abc'], maxLength: 3, onInputExceed });
        const input = getInput();

        fireEvent.compositionStart(input);
        fireEvent.input(input, { target: { value: 'zhong' } });
        fireEvent.compositionEnd(input, { target: { value: '中' } });
        expect(input).toHaveValue('中');
        expect(onInputExceed).not.toHaveBeenCalled();
    });

    it('禁用状态下的 focus', () => {
        let root!: HTMLDivElement;
        render(() => <TagInput ref={(node) => (root = node)} defaultValue={['abc']} disabled />);

        root.focus();
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('清空按钮是输入框后的具名原生按钮，Enter 和 Space 可以触发', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
            const { unmount } = renderTagInput({ showClear: true, defaultValue: ['abc'], onChange });
            getInput().focus();
            await userEvent.tab();
            const clear = screen.getByRole('button', { name: zh_CN.TagInput.clear });
            expect(clear).toHaveFocus();
            expect(clear).toHaveAttribute('type', 'button');
            await userEvent.keyboard(key);
            expect(onChange).toHaveBeenCalledWith([]);
            expect(getTagTexts()).toEqual([]);
            expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull();
            expect(getInput()).toHaveFocus();
            unmount();
        }
    });

    it('点击 prefix 聚焦输入框并触发 onFocus', async () => {
        const onFocus = vi.fn<NonNullable<TagInputProps['onFocus']>>();
        renderTagInput({ defaultValue: ['abc'], prefix: <span>Prefix</span>, onFocus });

        await userEvent.click(screen.getByText('Prefix'));
        expect(getInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('prefix、suffix 的 mousedown 阻止默认行为，输入框的不阻止', () => {
        renderTagInput({ defaultValue: ['abc'], prefix: <span>Prefix</span>, suffix: <span>Suffix</span> });

        // mousedown on prefix/suffix is prevented so the input keeps its focus
        expect(fireEvent.mouseDown(screen.getByText('Prefix'))).toBe(false);
        expect(fireEvent.mouseDown(screen.getByText('Suffix'))).toBe(false);
        expect(fireEvent.mouseDown(getInput())).toBe(true);
    });

    it('renderTagItem 配合 draggable 的拖拽句柄', async () => {
        renderTagInput({ draggable: true, defaultValue: ['abc', 'def'], renderTagItem: (value) => <span class="custom-draggable-tag">{value}</span> });
        expect(document.querySelector(`.${tagInputCls}-drag-item`)).toBeNull();

        await userEvent.click(getRoot());

        await waitFor(() => expect(document.querySelectorAll(`.${tagInputCls}-drag-item`)).toHaveLength(2));
        const items = document.querySelectorAll(`.${tagInputCls}-drag-item`);
        items.forEach((item) => {
            expect(item.querySelector(`.${tagInputCls}-drag-handler`)).not.toBeNull();
            expect(item.querySelector('.custom-draggable-tag')).not.toBeNull();
        });
    });

    it('点击前缀聚焦输入框，点击外部后失焦', async () => {
        renderTagInput({ defaultValue: ['abc'], prefix: 'Prefix' });

        await userEvent.click(screen.getByText('Prefix'));
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);

        await userEvent.click(document.body);
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('组合输入中超长的文本在组合结束后被截断，之后超长的输入被拒绝', () => {
        renderTagInput({ defaultValue: ['abc'], maxLength: 2 });
        const input = getInput();

        fireEvent.compositionStart(input);
        fireEvent.input(input, { target: { value: 'abcd' } });
        expect(input).toHaveValue('abcd');

        fireEvent.compositionEnd(input, { target: { value: 'abcd' } });
        expect(input).toHaveValue('ab');
        fireEvent.input(input, { target: { value: 'abc' } });
        expect(input).toHaveValue('ab');
    });

    it('在内部反复点击只保持一个激活会话，点击外部才结束', async () => {
        renderTagInput({ defaultValue: ['abc'] });

        await userEvent.click(getRoot());
        expect(getInput()).not.toHaveFocus();
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);

        await userEvent.click(document.body);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);

        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('点击内部时不结束激活', async () => {
        renderTagInput({ defaultValue: ['abc'] });

        await userEvent.click(getRoot());
        await userEvent.click(screen.getByText('abc'));
        await userEvent.click(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('在内部按下、在外部松开时 TagInput 保持激活', async () => {
        renderTagInput({ defaultValue: ['abc'] });
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);

        // a browser targets the click at the common ancestor of the press and the release
        fireEvent.mouseDown(getInput());
        fireEvent.mouseUp(document.body);
        fireEvent.click(document.body);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('位于 suffix 内的弹层按下不结束激活', async () => {
        renderTagInput({
            defaultValue: ['abc'],
            suffix: (
                <Tooltip content={<button type="button">inside</button>} motion={false} trigger="click">
                    <button type="button">open</button>
                </Tooltip>
            ),
        });
        await userEvent.click(getRoot());
        await userEvent.click(screen.getByRole('button', { name: 'open' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inside' }));
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });
});

describe('TagInput 行为基线', () => {
    it('受控 value 始终渲染 prop，Backspace、关闭和清空时上报下一个值', async () => {
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        const onRemove = vi.fn<NonNullable<TagInputProps['onRemove']>>();
        renderTagInput({ value: ['abc', 'def'], onChange, onRemove, showClear: true });
        pressBackspace();
        expect(onRemove).toHaveBeenLastCalledWith('def', 1);
        expect(onChange).toHaveBeenLastCalledWith(['abc']);
        expect(getTagTexts()).toEqual(['abc', 'def']);

        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[0]);
        expect(onRemove).toHaveBeenLastCalledWith('abc', 0);
        expect(onChange).toHaveBeenLastCalledWith(['def']);
        expect(getTagTexts()).toEqual(['abc', 'def']);

        await userEvent.hover(getRoot());
        await userEvent.click(getClearBtn());
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('父组件修改后读取最新的受控值', () => {
        const onRemove = vi.fn<NonNullable<TagInputProps['onRemove']>>();
        const onAdd = vi.fn<NonNullable<TagInputProps['onAdd']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        const [value, setValue] = createSignal(['abc']);
        const [inputValue, setInputValue] = createSignal<string | undefined>();
        render(() => <TagInput value={value()} inputValue={inputValue()} onAdd={onAdd} onChange={onChange} onRemove={onRemove} />);
        setValue(['x', 'y']);
        pressBackspace();
        expect(onRemove).toHaveBeenCalledWith('y', 1);

        setInputValue('z');
        pressEnter();
        expect(onAdd).toHaveBeenCalledWith(['z']);
        expect(onChange).toHaveBeenLastCalledWith(['x', 'y', 'z']);
    });

    it('Enter 添加标签后，受控 inputValue 上报被清空的文本', () => {
        const onInputChange = vi.fn<NonNullable<TagInputProps['onInputChange']>>();
        renderTagInput({ inputValue: 'a,b', onInputChange });
        pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(onInputChange).toHaveBeenCalledTimes(1);
        expect(onInputChange.mock.calls[0][0]).toBe('');
        expect(getInput()).toHaveValue('a,b');
    });

    it('非受控输入、分隔符、重复项和 max 协同工作', async () => {
        const onAdd = vi.fn<NonNullable<TagInputProps['onAdd']>>();
        const onExceed = vi.fn<NonNullable<TagInputProps['onExceed']>>();
        renderTagInput({ defaultValue: ['a'], allowDuplicates: false, max: 3, onAdd, onExceed });
        await userEvent.type(getInput(), 'a,b,b,c,d');
        pressEnter();
        expect(onExceed).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
        expect(onAdd).toHaveBeenCalledWith(['b', 'c']);
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        expect(getInput()).toHaveValue('');
    });

    it('点击外部后超出 maxTagCount 的标签重新折叠，剩余数量随删除更新', async () => {
        renderTagInput({ defaultValue: ['a', 'b', 'c', 'd'], maxTagCount: 2, showRestTagsPopover: false });
        expect(getRestCount()).toHaveTextContent('+2');
        pressBackspace();
        expect(getRestCount()).toHaveTextContent('+1');
        await userEvent.click(getRoot());
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        await userEvent.click(document.body);
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(getRestCount()).toHaveTextContent('+1');
    });

    it('addOnBlur 只添加一次输入文本，然后上报 blur', async () => {
        const calls: unknown[][] = [];
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({
            addOnBlur: true,
            onAdd: (v) => calls.push(['add', v]),
            onBlur: () => calls.push(['blur']),
            onChange,
        });
        await userEvent.type(getInput(), 'x');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(calls).toEqual([['add', ['x']], ['blur']]);
        expect(onChange).toHaveBeenCalledWith(['x']);
        expect(getTagTexts()).toEqual(['x']);
        expect(getInput()).toHaveValue('');
    });

    it('renderTagItem 接收 value、index 和关闭回调，禁用时忽略点击', async () => {
        const renderTagItem = vi.fn<NonNullable<TagInputProps['renderTagItem']>>((value, index, onClose) => (
            <button type="button" onClick={onClose}>
                {`${index}:${value}`}
            </button>
        ));
        const onRemove = vi.fn<NonNullable<TagInputProps['onRemove']>>();
        const [disabled, setDisabled] = createSignal(true);
        render(() => <TagInput defaultValue={['a', 'b']} disabled={disabled()} renderTagItem={renderTagItem} onRemove={onRemove} />);
        expect(renderTagItem).toHaveBeenCalledWith('a', 0, expect.any(Function));
        await userEvent.click(screen.getByText('1:b'));
        expect(onRemove).not.toHaveBeenCalled();
        setDisabled(false);
        await userEvent.click(screen.getByText('1:b'));
        expect(onRemove).toHaveBeenCalledWith('b', 1);
        expect(screen.queryByText('1:b')).toBeNull();
    });

    it('删除前面的标签后，renderTagItem 拿到更新后的下标', async () => {
        renderTagInput({
            defaultValue: ['a', 'b', 'c'],
            renderTagItem: (value, index, onClose) => (
                <button type="button" onClick={onClose}>
                    {`${index}:${value}`}
                </button>
            ),
        });
        await userEvent.click(screen.getByText('0:a'));
        expect(['1:c', '0:b'].map((text) => screen.getByText(text))).toHaveLength(2);
        await userEvent.click(screen.getByText('1:c'));
        expect(getInput().closest(`.${tagInputCls}`)).toHaveTextContent('0:b');
        expect(screen.queryByText('1:c')).toBeNull();
    });

    it('禁用时忽略输入、Backspace 和点击', async () => {
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ defaultValue: ['a'], disabled: true, onChange });
        await userEvent.type(getInput(), 'x');
        expect(getInput()).toHaveValue('');
        await userEvent.click(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a']);
    });

    it('ref 的 focus 重复调用只保持一个激活会话，blur 后折叠', async () => {
        let root!: HTMLDivElement;
        render(() => <TagInput ref={(node) => (root = node)} defaultValue={['a', 'b', 'c']} maxTagCount={1} />);
        root.focus();
        root.focus();
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        root.blur();
        expect(getTagTexts()).toEqual(['a']);
        await userEvent.click(document.body);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('data-* 属性落在根元素上', () => {
        renderTagInput({ 'data-testid': 'tag-input', 'data-foo': 'bar' });
        expect(screen.getByTestId('tag-input')).toBe(getRoot());
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
    });
});

describe('TagInput 函数组件', () => {
    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { TagInput: { separator: '-', showClear: true } };
        const { unmount } = renderTagInput({ inputValue: 'a-b' });
        pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(getClearBtn()).not.toBeNull();
        unmount();
        renderTagInput({ inputValue: 'a-b', separator: null, showClear: false });
        pressEnter();
        expect(getTagTexts()).toEqual(['a-b']);
        expect(getClearBtn()).toBeNull();
    });

    it('全局 Input 默认值不给内部输入框加清除按钮与前后缀', () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = renderTagInput({ defaultValue: ['a'], inputValue: 'b' });
        expect(container.textContent).not.toMatch(/mark-/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('未声明属性透传到根元素', () => {
        renderTagInput({ title: 'tags', 'data-foo': 'bar' });
        expect(getRoot()).toHaveAttribute('title', 'tags');
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
    });

    it('FormTagInput 在 formApi.reset 后清空，并在 blur 时校验', async () => {
        let formApi: FormApi | undefined;
        const validate = vi.fn<() => string>(() => '');
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormTagInput field="tags" label="Tags" trigger="blur" validator={validate} />
                <button type="button">outside</button>
            </Form>
        ));
        await userEvent.type(getInput(), 'a');
        pressEnter();
        expect(formApi?.getValue('tags')).toEqual(['a']);
        expect(validate).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('outside'));
        expect(validate).toHaveBeenCalledTimes(1);
        formApi?.reset();
        expect(getTagTexts()).toEqual([]);
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
            expect(getRoot()).not.toHaveAttribute(attr);
        }
    });

    it('FormTagInput 的 Form 属性透传到文本输入框', () => {
        render(() => (
            <Form>
                <FormTagInput id="tags" field="tags" label="Tags" rules={[{ required: true, message: 'need tags' }]} />
            </Form>
        ));
        expect(getInput()).toHaveAttribute('id', 'tags');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'tags-label');
        expect(getInput()).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'Tags' })).toBe(getInput());
        for (const attr of ['id', 'aria-labelledby', 'aria-required']) {
            expect(getRoot()).not.toHaveAttribute(attr);
        }
    });

    it('id、name、aria-* 与 role 落在文本输入框，根元素不带', () => {
        renderTagInput({ id: 'tags', name: 'tags-name', 'aria-labelledby': 'tags-label', 'aria-required': true, 'aria-describedby': 'tip', role: 'combobox' });
        const input = getRoot().querySelector('input') as HTMLInputElement;
        expect(input).toHaveAttribute('id', 'tags');
        expect(input).toHaveAttribute('name', 'tags-name');
        expect(input).toHaveAttribute('aria-labelledby', 'tags-label');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'tip');
        expect(input).toHaveAttribute('role', 'combobox');
        for (const attr of ['id', 'name', 'aria-labelledby', 'aria-required', 'aria-describedby']) {
            expect(getRoot()).not.toHaveAttribute(attr);
        }
        expect(getRoot()).toHaveAttribute('role', 'group');
    });

    it('ref 是根元素', () => {
        let root!: HTMLDivElement;
        render(() => <TagInput ref={(node) => (root = node)} />);
        expect(root).toBe(getRoot());
    });

    it('点击已聚焦 TagInput 的 prefix 不会再次聚焦输入框', async () => {
        renderTagInput({ prefix: <span>Prefix</span> });
        await userEvent.click(getInput());
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        await userEvent.click(screen.getByText('Prefix'));
        expect(focus).not.toHaveBeenCalled();
        expect(getInput()).toHaveFocus();
    });

    it('使用方的 onClick 与内部的点击激活都执行', async () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        renderTagInput({ onClick, defaultValue: ['abc'] });
        await userEvent.click(getRoot());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('拖拽句柄不在可关闭的标签内，是 -drag-item 包装里标签的兄弟', async () => {
        renderTagInput({ draggable: true, defaultValue: ['abc', 'def'] });
        await userEvent.click(getRoot());
        const handles = await screen.findAllByRole('button', { name: zh_CN.TagInput.dragSort });
        expect(handles).toHaveLength(2);
        handles.forEach((handle) => {
            expect(handle.closest('[role="button"]')).toBeNull();
            expect(handle.parentElement).toHaveClass(`${tagInputCls}-drag-item`);
            expect(handle.parentElement?.querySelector(`.${BASE_CLASS_PREFIX}-tag`)).not.toBeNull();
        });
    });

    it('showContentTooltip 的溢出文字不在可关闭的标签内成为独立的 Tab 停靠点', async () => {
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20 } as DOMRect);
        renderTagInput({ defaultValue: ['abc'], showContentTooltip: true });
        const text = screen.getByText('abc').parentElement as HTMLElement;
        await hover(screen.getByText('abc'));
        await waitFor(() => expect(text).toHaveAccessibleDescription('abc'));
        expect(text).not.toHaveAttribute('tabindex');
    });

    it('已超过 max 时再添加，不删既有标签，onChange 与 onAdd 都不触发，onExceed 触发', async () => {
        const onExceed = vi.fn<NonNullable<TagInputProps['onExceed']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        const onAdd = vi.fn<NonNullable<TagInputProps['onAdd']>>();
        renderTagInput({ defaultValue: ['a', 'b', 'c', 'd', 'e'], max: 3, onExceed, onChange, onAdd });
        await userEvent.type(getInput(), 'x,y,z');
        pressEnter();
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(onAdd).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('未满 max 时按剩余名额截取新增的标签', async () => {
        const onAdd = vi.fn<NonNullable<TagInputProps['onAdd']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ defaultValue: ['a', 'b'], max: 3, onAdd, onChange });
        await userEvent.type(getInput(), 'x,y');
        pressEnter();
        expect(onAdd).toHaveBeenCalledWith(['x']);
        expect(onChange).toHaveBeenCalledWith(['a', 'b', 'x']);
    });

    it('draggable 时重复的标签关闭第二个只删它自己', async () => {
        const onRemove = vi.fn<NonNullable<TagInputProps['onRemove']>>();
        const onChange = vi.fn<NonNullable<TagInputProps['onChange']>>();
        renderTagInput({ draggable: true, defaultValue: ['a', 'b', 'a'], onRemove, onChange });
        await userEvent.click(getRoot());
        await waitFor(() => expect(screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })).toHaveLength(3));
        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[2]);
        expect(onRemove).toHaveBeenCalledWith('a', 2);
        expect(onChange).toHaveBeenCalledWith(['a', 'b']);
    });

    it('blur 方法让焦点在清除按钮上时也失焦并触发 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<TagInputProps['onBlur']>>();
        let root!: HTMLDivElement;
        render(() => <TagInput ref={(node) => (root = node)} defaultValue={['abc']} showClear onBlur={onBlur} />);
        getInput().focus();
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: zh_CN.TagInput.clear });
        expect(clear).toHaveFocus();
        root.blur();
        expect(clear).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('value 的类型含 null', () => {
        expectTypeOf<TagInputProps['value']>().toEqualTypeOf<string[] | null | undefined>();
    });

    it('卸载激活中的 TagInput 时移除 window 的 mousedown 监听', async () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const { unmount } = renderTagInput({ defaultValue: ['abc'] });
        await userEvent.click(getRoot());
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
        unmount();
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
    });
});

describe('TagInput 焦点落点、命名与受控输入', () => {
    it('Tooltip 注入的 tabIndex 落在输入框上，根元素不成为 Tab 停靠点', async () => {
        render(() => <Tooltip content="tip">{(getTriggerProps) => <TagInput {...getTriggerProps()} />}</Tooltip>);
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '0');
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
    });

    it('显式 tabIndex 交给输入框', () => {
        renderTagInput({ tabIndex: -1 });
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
    });

    it('渲染出的 insetLabel 为输入框命名，显式名称优先', () => {
        const { unmount } = renderTagInput({ insetLabel: 'Tags' });
        expect(screen.getByRole('textbox', { name: 'Tags' })).toBe(getInput());
        unmount();
        const { unmount: unmountWithId } = renderTagInput({ insetLabel: 'Tags', insetLabelId: 'inset-id' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'inset-id');
        unmountWithId();
        renderTagInput({ insetLabel: 'Tags', 'aria-label': 'Own name' });
        expect(screen.getByRole('textbox', { name: 'Own name' })).toBe(getInput());
    });

    it('带 id（Form 的 label）时渲染出的 insetLabel 仍为输入框命名，与 Select 一致', () => {
        const label = Object.assign(document.createElement('label'), { htmlFor: 'form-id', textContent: 'Form label' });
        document.body.append(label);
        onTestFinished(() => label.remove());
        renderTagInput({ id: 'form-id', insetLabel: 'Tags' });
        expect(getInput()).toHaveAccessibleName('Tags');
        expect(getInput()).not.toHaveAttribute('aria-label');
    });

    it('受控 inputValue 变回 undefined 时清空输入框', () => {
        const [inputValue, setInputValue] = createSignal<string | undefined>('abc');
        render(() => <TagInput inputValue={inputValue()} />);
        fireEvent.input(getInput(), { target: { value: 'abcd' } });
        setInputValue(undefined);
        expect(getInput()).toHaveValue('');
    });
});
