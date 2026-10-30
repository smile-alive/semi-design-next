/** @jsxImportSource vue */
import { KeepAlive, nextTick, shallowRef, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSearch } from '@fibrae/semi-icons-vue';
import { countLiveListeners, render } from '@test/utils/vue';
import TagInput, { type TagInputEmits, type TagInputHandle, type TagInputSlots, type TagInputTagSlotProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Popover from '../../popover';
import Tooltip from '../../tooltip';
import TagItem from '../tag-item.vue';
import ModelTrim from './fixtures/model-trim.vue';
import Model from './fixtures/model.vue';

type Handler<K extends keyof TagInputEmits> = (...args: TagInputEmits[K]) => void;
type Slots = { [K in keyof TagInputSlots]: (props: never) => VNode | VNode[] | string };

const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
const tagSelector = `.${tagInputCls}-wrapper .${BASE_CLASS_PREFIX}-tag-content`;

const getRoot = () => document.querySelector(`.${tagInputCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('textbox');
const getTagTexts = () => [...document.querySelectorAll(tagSelector)].map((node) => node.textContent);
const getClearBtn = () => document.querySelector<HTMLElement>(`.${tagInputCls}-clearBtn`);
const getRestCount = () => document.querySelector(`.${tagInputCls}-wrapper-n`);
const getHandles = () => document.querySelectorAll(`.${tagInputCls}-drag-handler`);
const pressEnter = () => fireEvent.keyDown(getInput(), { key: 'Enter' });
const pressBackspace = () => fireEvent.keyDown(getInput(), { key: 'Backspace' });
const renderTagInput = (props: Record<string, unknown> = {}, slots: Slots = {}) => render(TagInput, { props, slots });
// Testing Library's Vue fireEvent resolves to nothing, so read defaultPrevented from a dispatched event
function dispatch(el: Element, event: Event) {
    el.dispatchEvent(event);
    return event;
}
// jsdom keeps no hover state; Tooltip re-checks `:hover` on its trigger right after opening and closes otherwise.
// Spying on a spied method returns the same spy, so the spy is set once per test and reads the latest target.
const nativeMatches = Object.getOwnPropertyDescriptor(Element.prototype, 'matches')?.value as Element['matches'];
let hovered: Element | null = null;
async function hover(target: Element) {
    if (!hovered) {
        vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
            return selector === ':hover' ? Boolean(hovered && this.contains(hovered)) : nativeMatches.call(this, selector);
        });
    }
    hovered = target;
    await userEvent.hover(target);
}
// The ellipsis measurement that enables the tooltip settles asynchronously; on a loaded CI runner it outlasts waitFor's 1s default
const hoverUntil = (target: Element, popupSelector: string) =>
    waitFor(
        async () => {
            await hover(target);
            expect(document.querySelector(popupSelector)).not.toBeNull();
        },
        { timeout: 5000 }
    );
const mouseDown = (el: Element) => dispatch(el, new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

function renderWithHandle(props: Record<string, unknown> = {}) {
    const refFn = vi.fn<(handle: TagInputHandle | null) => void>();
    const Host = (hostProps: Record<string, unknown>) => <TagInput {...hostProps} ref={(value) => refFn(value as TagInputHandle | null)} />;
    const view = render(Host, { props });
    const handle = () => refFn.mock.calls[0]?.[0] as TagInputHandle;
    return { ...view, handle };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    hovered = null;
});

describe('TagInput', () => {
    it('TagInput 带 prefix / suffix', () => {
        renderTagInput({}, { suffix: () => <div class="suffix">suffix</div> });
        renderTagInput({}, { prefix: () => <div class="prefix">prefix</div> });
        expect(document.querySelector(`.${tagInputCls}-suffix .suffix`)).toHaveTextContent('suffix');
        expect(document.querySelector(`.${tagInputCls}-prefix .prefix`)).toHaveTextContent('prefix');
    });

    it('TagInput 的 validateStatus', () => {
        const { container: warning } = renderTagInput({ validateStatus: 'warning' });
        const { container: error } = renderTagInput({ validateStatus: 'error' });
        const { container: normal } = renderTagInput();
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
        render(TagInput, { attrs: { class: 'test', style: { color: 'red' } } });
        const root = document.querySelector('div.test');
        expect(root).toHaveClass(tagInputCls);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getInput()).not.toHaveClass('test');
    });

    it('TagInput 的 size', () => {
        const { container: large } = renderTagInput({ size: 'large' });
        const { container: small } = renderTagInput({ size: 'small' });
        expect(large.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-large`)).toHaveLength(1);
        expect(small.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-small`)).toHaveLength(1);
    });

    it('TagInput 的 showClear', () => {
        const empty = renderTagInput({ showClear: true });
        expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull();
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`)).not.toBeNull();
        empty.unmount();

        const off = renderTagInput({ showClear: false });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).toBeNull();
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`)).toBeNull();
        off.unmount();

        renderTagInput({ showClear: true, inputValue: 'semi' });
        expect(screen.getByRole('button', { name: zh_CN.TagInput.clear })).toBe(getClearBtn());
    });

    it('TagInput 的 defaultValue', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon'] });
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
    });

    it('modelValue 为 undefined 时按非受控处理，显示 defaultValue', () => {
        renderTagInput({ defaultValue: ['semi', 'hotsoon'], modelValue: undefined });
        expect(getTagTexts()).toEqual(['semi', 'hotsoon']);
    });

    it('TagInput 的 defaultValue 且 modelValue 为 null', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ defaultValue: ['semi', 'hotsoon'], modelValue: null, onChange });
        expect(getTagTexts()).toEqual([]);
        await userEvent.type(getInput(), 'x{Enter}');
        expect(onChange).toHaveBeenCalledWith(['x']);
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 的 disabled', () => {
        const view = renderTagInput({ disabled: true });
        expect(getRoot()).toHaveClass(`${tagInputCls}-disabled`);
        expect(getInput()).toBeDisabled();
        view.unmount();
        renderTagInput();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-disabled`);
    });

    it('TagInput 的 separator', async () => {
        const view = renderTagInput({ separator: '-', inputValue: 'abc-hotsoon' });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        view.unmount();

        renderTagInput({ separator: null, inputValue: 'semi-hotsoon' });
        await pressEnter();
        expect(getTagTexts()).toEqual(['semi-hotsoon']);
    });

    it('TagInput 的数组类型 separator', async () => {
        renderTagInput({ separator: ['-', '/', '*'], inputValue: 'abc-hotsoon/pipixi*qingyan' });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon', 'pipixi', 'qingyan']);
    });

    it('TagInput 的 remove 和 change', async () => {
        const onRemove = vi.fn<Handler<'remove'>>();
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ defaultValue: ['abc', 'hotsoon', 'toutiao', 'lark'], onRemove, onChange, showClear: true });
        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[1]);
        expect(onRemove).toHaveBeenNthCalledWith(1, 'hotsoon', 1);
        expect(onChange).toHaveBeenNthCalledWith(1, ['abc', 'toutiao', 'lark']);
        expect(getTagTexts()).toEqual(['abc', 'toutiao', 'lark']);

        await pressBackspace();
        expect(onRemove).toHaveBeenNthCalledWith(2, 'lark', 2);
        expect(onChange).toHaveBeenNthCalledWith(2, ['abc', 'toutiao']);

        await userEvent.hover(getRoot());
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenNthCalledWith(3, []);
        expect(onRemove).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledTimes(3);
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 的 add 和 change', async () => {
        const onAdd = vi.fn<Handler<'add'>>();
        const onChange = vi.fn<Handler<'change'>>();
        const view = renderTagInput({ onChange, onAdd });
        await pressEnter();
        expect(onAdd).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        view.unmount();

        renderTagInput({ inputValue: 'abc,toutiao,,,hotsoon', onChange, defaultValue: ['lark'], onAdd });
        await pressEnter();
        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(['abc', 'toutiao', 'hotsoon']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['lark', 'abc', 'toutiao', 'hotsoon']);
    });

    it('TagInput 的 maxTagCount', async () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon'], maxTagCount: 2, inputValue: 'lark' });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon']);
        expect(getRestCount()).toHaveTextContent('+1');
    });

    it('TagInput 的 maxLength', async () => {
        renderTagInput({ maxLength: 3 });
        await userEvent.type(getInput(), 'tik');
        expect(getInput()).toHaveValue('tik');
        await userEvent.type(getInput(), 't');
        await nextTick();
        expect(getInput()).toHaveValue('tik');
    });

    it('TagInput 的 inputExceed', async () => {
        const onInputExceed = vi.fn<Handler<'inputExceed'>>();
        renderTagInput({ maxLength: 2, onInputExceed });
        await userEvent.click(getInput());
        await userEvent.paste('hotsoon');
        await nextTick();
        expect(onInputExceed).toHaveBeenCalledTimes(1);
        expect(onInputExceed).toHaveBeenCalledWith('hotsoon');
        expect(getInput()).toHaveValue('');
    });

    it('TagInput 的 blur 和 focus 载荷是根元素的 focusout、focusin', async () => {
        const onBlur = vi.fn<Handler<'blur'>>();
        const onFocus = vi.fn<Handler<'focus'>>();
        renderTagInput({ onBlur, onFocus });
        await userEvent.click(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
    });

    it('事件载荷的类型与实际事件一致', () => {
        expectTypeOf<TagInputEmits['focus'][0]>().toEqualTypeOf<FocusEvent>();
        expectTypeOf<TagInputEmits['blur'][0]>().toEqualTypeOf<FocusEvent>();
        expectTypeOf<TagInputEmits['keydown'][0]>().toEqualTypeOf<KeyboardEvent>();
        expectTypeOf<TagInputEmits['change']>().toEqualTypeOf<[value: string[]]>();
        expectTypeOf<KeyboardEvent>().toExtend<TagInputEmits['inputChange'][1]>();
        expectTypeOf<FocusEvent>().toExtend<TagInputEmits['inputChange'][1]>();
        expectTypeOf<MouseEvent>().toExtend<TagInputEmits['inputChange'][1]>();
        expectTypeOf<CompositionEvent>().toExtend<TagInputEmits['inputChange'][1]>();
        expectTypeOf<TagInputTagSlotProps['onClose']>().toEqualTypeOf<(event?: Event) => void>();
    });

    it('TagInput 受控 modelValue 模式', async () => {
        const view = renderTagInput({ modelValue: ['abc'] });
        expect(getTagTexts()).toEqual(['abc']);
        await view.rerender({ modelValue: ['hotsoon'] });
        expect(getTagTexts()).toEqual(['hotsoon']);
    });

    it('TagInput 将 modelValue 设为 null', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const view = renderTagInput({ modelValue: ['semi'], onChange });
        expect(getTagTexts()).toEqual(['semi']);
        await view.rerender({ modelValue: null });
        expect(getTagTexts()).toEqual([]);
        await userEvent.type(getInput(), 'x{Enter}');
        expect(onChange).toHaveBeenCalledWith(['x']);
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 将 modelValue 设为 undefined', async () => {
        const view = renderTagInput({ modelValue: ['semi'] });
        expect(getTagTexts()).toEqual(['semi']);
        await view.rerender({ modelValue: undefined });
        expect(getTagTexts()).toEqual([]);
    });

    it('有 defaultValue 时受控 modelValue 变回 undefined 也清空', async () => {
        const view = renderTagInput({ defaultValue: ['init'], modelValue: ['semi'] });
        expect(getTagTexts()).toEqual(['semi']);
        await view.rerender({ defaultValue: ['init'], modelValue: undefined });
        expect(getTagTexts()).toEqual([]);
    });

    it('TagInput 受控 inputValue 模式', async () => {
        const view = renderTagInput({ inputValue: 'abc' });
        expect(getInput()).toHaveValue('abc');
        await view.rerender({ inputValue: 'hotsoon' });
        expect(getInput()).toHaveValue('hotsoon');
    });

    it('TagInput 的 keydown', async () => {
        const onKeydown = vi.fn<Handler<'keydown'>>();
        renderTagInput({ onKeydown });
        await pressEnter();
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onKeydown.mock.calls[0][0].key).toBe('Enter');
    });

    it('TagInput 的 allowDuplicates', async () => {
        renderTagInput({ allowDuplicates: true, defaultValue: ['abc'], inputValue: 'abc' });
        await pressEnter();
        expect(getTagTexts()).toEqual(['abc', 'abc']);
    });

    it('#tag 插槽整体替换标签', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon'] }, { tag: ({ value }: TagInputTagSlotProps) => <span class="custom-tag-item">{value}</span> });
        const items = document.querySelectorAll('.custom-tag-item');
        expect([...items].map((item) => item.textContent)).toEqual(['abc', 'hotsoon']);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('TagInput 的 autofocus', async () => {
        // Testing Library moves the mounted nodes, which drops a mount-time focus, so the call itself is checked
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        renderTagInput({ autofocus: true });
        await nextTick();
        expect(focus.mock.contexts).toContain(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('autofocus 在挂载后让输入框获得焦点，禁用时不聚焦', async () => {
        // inserted after the first render, where Testing Library no longer moves the nodes
        const shown = shallowRef(false);
        const disabled = shallowRef(false);
        render(() => (shown.value ? <TagInput autofocus disabled={disabled.value} /> : null));
        shown.value = true;
        await nextTick();
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        getInput().blur();
        shown.value = false;
        disabled.value = true;
        await nextTick();
        shown.value = true;
        await nextTick();
        expect(getInput()).not.toHaveFocus();
    });

    it('TagInput 的 aria-label', () => {
        renderTagInput({ 'aria-label': 'Tag input field' });
        expect(screen.getByLabelText('Tag input field')).toBe(getInput());
        expect(getRoot()).not.toHaveAttribute('aria-label');
    });

    it('TagInput 未传名称时回退到语言包文案，名称交给 label 或 id 处理', () => {
        const unnamed = renderTagInput();
        expect(getInput()).toHaveAttribute('aria-label', zh_CN.TagInput.input);
        unnamed.unmount();
        const labelled = renderTagInput({ 'aria-labelledby': 'someone' });
        expect(getInput()).not.toHaveAttribute('aria-label');
        labelled.unmount();
        renderTagInput({ id: 'form-id' });
        expect(getInput()).not.toHaveAttribute('aria-label');
    });

    it('可访问名称与内置文案随语言包切换', () => {
        render(() => <ConfigProvider locale={en_US}>{() => <TagInput defaultValue={['abc']} showClear draggable={false} />}</ConfigProvider>);
        expect(getInput()).toHaveAttribute('aria-label', en_US.TagInput.input);
        expect(screen.getByRole('button', { name: en_US.TagInput.clear })).toBe(getClearBtn());
        expect(screen.getByRole('button', { name: en_US.Tag.closableTag.replace('${tag}', 'abc') })).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
    });

    it('标签值里的 $&、$$ 按原文写入关闭按钮名称，不当作替换模式', () => {
        render(TagInput, { props: { defaultValue: ['$&-$$'], draggable: false } });
        expect(screen.getByRole('button', { name: zh_CN.Tag.closableTag.split('${tag}').join('$&-$$') })).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
    });

    it('TagInput 的 preventScroll', () => {
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
        const { handle } = renderWithHandle({ preventScroll: true });
        handle().focus();
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).toHaveFocus();
    });

    it('TagInput 的 insetLabel', () => {
        renderTagInput({ insetLabelId: 'inset-label-id' }, { insetLabel: () => <span class="inset-label">Label</span> });
        const label = document.querySelector('.inset-label');
        expect(label).toHaveTextContent('Label');
        expect(label?.parentElement).toHaveAttribute('id', 'inset-label-id');
        expect(label?.parentElement).toHaveClass(`${tagInputCls}-inset-label`);
    });

    it('TagInput 的 showRestTagsPopover 为 false', () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon', 'lark'], maxTagCount: 1, showRestTagsPopover: false });
        expect(getRestCount()).toHaveTextContent('+2');
        expect(getRestCount()).not.toHaveAttribute('tabindex');
        expect(getTagTexts()).toEqual(['abc']);
    });

    it('TagInput 的 restTagsPopoverProps', async () => {
        renderTagInput({
            defaultValue: ['abc', 'hotsoon', 'lark'],
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { position: 'bottom' },
        });
        await userEvent.hover(getRestCount() as Element);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).not.toBeNull());
        const popover = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(popover).toHaveAttribute('x-placement', 'bottom');
        expect(popover).toHaveTextContent('hotsoon');
        expect(popover).toHaveTextContent('lark');
    });

    it('TagInput 的 showContentTooltip', async () => {
        // jsdom has no text layout; make tag text wider than its zero-width container
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20 } as DOMRect);
        renderTagInput({ defaultValue: ['abc'], showContentTooltip: true });
        await hoverUntil(screen.getByText('abc').parentElement as HTMLElement, `.${BASE_CLASS_PREFIX}-tooltip-wrapper`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent('abc');
    });

    it('TagInput 的 showContentTooltip 对象形式', async () => {
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20 } as DOMRect);
        renderTagInput({ defaultValue: ['abc'], showContentTooltip: { type: 'popover', opts: { position: 'top' } } });
        await hoverUntil(screen.getByText('abc').parentElement as HTMLElement, `.${BASE_CLASS_PREFIX}-popover-wrapper`);
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
        renderTagInput({ showClear: true, defaultValue: ['abc'] }, { clearIcon: () => <span class="custom-clear-icon">X</span> });
        expect(getClearBtn()?.querySelector('.custom-clear-icon')).not.toBeNull();
        expect(getClearBtn()?.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).toBeNull();
    });

    it('TagInput 的 split 函数', async () => {
        const customSplit = vi.fn<(str: string, sep: string | string[] | null) => string[]>((str, sep) => str.split(sep as string).filter(Boolean));
        renderTagInput({ split: customSplit, inputValue: 'abc,def' });
        await pressEnter();
        expect(customSplit).toHaveBeenCalledWith('abc,def', ',');
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('TagInput 的 focus 和 blur 方法', async () => {
        const { handle } = renderWithHandle({ defaultValue: ['abc'] });
        handle().focus();
        await nextTick();
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        handle().blur();
        await nextTick();
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('blur 方法在焦点位于标签或清空按钮时同样移出焦点', async () => {
        const onBlur = vi.fn<Handler<'blur'>>();
        const { handle } = renderWithHandle({ defaultValue: ['abc'], showClear: true, onBlur });
        const tag = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tag`) as HTMLElement;
        tag.focus();
        handle().blur();
        await nextTick();
        expect(tag).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
        (getClearBtn() as HTMLElement).focus();
        handle().blur();
        await nextTick();
        expect(document.activeElement).toBe(document.body);
        expect(onBlur).toHaveBeenCalledTimes(2);
    });

    it('TagInput 的输入法组合事件', async () => {
        const onInputExceed = vi.fn<Handler<'inputExceed'>>();
        renderTagInput({ defaultValue: ['abc'], maxLength: 3, onInputExceed });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.update(input, 'zhongwen');
        expect(input).toHaveValue('zhongwen');
        expect(onInputExceed).not.toHaveBeenCalled();
        await fireEvent.compositionEnd(input, { target: { value: 'zhongwen' } });
        await nextTick();
        expect(input).toHaveValue('zho');
        expect(onInputExceed).toHaveBeenCalledWith('zhongwen');
    });

    it('TagInput 的鼠标进入和离开不改变根元素类名（悬停样式由 CSS :hover 提供）', async () => {
        renderTagInput({ defaultValue: ['abc'] });
        const { className } = getRoot();
        await fireEvent.mouseEnter(getRoot());
        expect(getRoot().className).toBe(className);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
        await fireEvent.mouseLeave(getRoot());
        expect(getRoot().className).toBe(className);
    });

    it('TagInput 禁用时不触发点击', async () => {
        renderTagInput({ defaultValue: ['abc'], disabled: true });
        await fireEvent.click(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('空输入时按 Backspace 无操作', async () => {
        const onRemove = vi.fn<Handler<'remove'>>();
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ defaultValue: [], onRemove, onChange });
        await pressBackspace();
        expect(onRemove).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('error 状态下输入框带 aria-invalid，无角色的根元素不带', () => {
        renderTagInput({ validateStatus: 'error' });
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        expect(getRoot()).not.toHaveAttribute('aria-invalid');
    });

    it('非 error 状态下输入框不带 aria-invalid，显式传入的 aria-invalid 优先', async () => {
        const view = renderTagInput({ validateStatus: 'warning' });
        expect(getInput()).not.toHaveAttribute('aria-invalid');
        await view.rerender({ 'aria-invalid': false, validateStatus: 'error' });
        expect(getInput()).toHaveAttribute('aria-invalid', 'false');
    });

    it('根元素是 group，禁用时带 aria-disabled，输入框为原生 disabled', async () => {
        const view = renderTagInput();
        expect(screen.getByRole('group')).toBe(getRoot());
        expect(getRoot()).not.toHaveAttribute('aria-disabled');
        await view.rerender({ disabled: true });
        expect(getInput()).toBeDisabled();
        expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
    });

    it('禁用时静态标签不带 aria-label，标签文字本身可见', () => {
        renderTagInput({ disabled: true, defaultValue: ['abc'] });
        const tag = document.querySelector(`.${BASE_CLASS_PREFIX}-tag`);
        expect(tag).toHaveTextContent('abc');
        expect(tag).not.toHaveAttribute('role');
        expect(tag).not.toHaveAttribute('aria-label');
    });

    it('下标与标签值拼接相同的标签不产生重复 key', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const value = ['x', '1a', ...Array.from({ length: 9 }, (_, i) => `t${i}`), 'a'];
        renderTagInput({ modelValue: value });
        expect(getTagTexts()).toEqual(value);
        expect(warn.mock.calls.flat().join('\n')).not.toContain('Duplicate keys');
    });

    it('addOnBlur 时未输入文字就失焦，不上报 inputChange', async () => {
        const onInputChange = vi.fn<Handler<'inputChange'>>();
        const onBlur = vi.fn<Handler<'blur'>>();
        renderTagInput({ addOnBlur: true, onInputChange, onBlur });
        await userEvent.click(getInput());
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onInputChange).not.toHaveBeenCalled();
    });

    it('TagInput 的 warning validateStatus', () => {
        renderTagInput({ validateStatus: 'warning' });
        expect(getRoot()).toHaveClass(`${tagInputCls}-warning`);
    });

    it('TagInput 的 large 尺寸', () => {
        renderTagInput({ size: 'large' });
        expect(getRoot()).toHaveClass(`${tagInputCls}-large`);
    });

    it('点击清空按钮', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ defaultValue: ['abc', 'def'], showClear: true, onChange });
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
        expect(getInput()).toHaveFocus();
    });

    it('点击 suffix 会聚焦输入框', async () => {
        renderTagInput({ defaultValue: ['abc'] }, { suffix: () => <span class="test-suffix">Suffix</span> });
        await userEvent.click(document.querySelector('.test-suffix') as Element);
        expect(getInput()).toHaveFocus();
    });

    it('TagInput 的 allowDuplicates 为 false', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ defaultValue: ['abc'], allowDuplicates: false, onChange });
        await userEvent.type(getInput(), 'abc,def,def');
        await pressEnter();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['abc', 'def']);
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('TagInput 的 max', async () => {
        const onExceed = vi.fn<Handler<'exceed'>>();
        renderTagInput({ defaultValue: ['a', 'b', 'c'], max: 3, onExceed });
        await userEvent.type(getInput(), 'd');
        await pressEnter();
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('已超过 max 时再添加，不删既有标签，change 与 add 都不触发，exceed 触发', async () => {
        const onExceed = vi.fn<Handler<'exceed'>>();
        const onChange = vi.fn<Handler<'change'>>();
        const onAdd = vi.fn<Handler<'add'>>();
        renderTagInput({ defaultValue: ['a', 'b', 'c', 'd', 'e'], max: 3, onExceed, onChange, onAdd });
        await userEvent.type(getInput(), 'x,y,z');
        await pressEnter();
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(onAdd).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('TagInput 的 inputExceed（键入）', async () => {
        const onInputExceed = vi.fn<Handler<'inputExceed'>>();
        renderTagInput({ maxLength: 5, onInputExceed });
        await userEvent.type(getInput(), 'abcdef');
        await nextTick();
        expect(onInputExceed).toHaveBeenCalledTimes(1);
        expect(onInputExceed).toHaveBeenCalledWith('abcdef');
        expect(getInput()).toHaveValue('abcde');
    });

    it('TagInput 受控 modelValue', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ modelValue: ['controlled', 'tags'], onChange });
        expect(getTagTexts()).toEqual(['controlled', 'tags']);
        await userEvent.type(getInput(), 'new');
        await pressEnter();
        expect(onChange).toHaveBeenCalledWith(['controlled', 'tags', 'new']);
        expect(getTagTexts()).toEqual(['controlled', 'tags']);
    });

    it('TagInput 的 inputChange', async () => {
        const onInputChange = vi.fn<Handler<'inputChange'>>();
        renderTagInput({ onInputChange });
        await userEvent.type(getInput(), 'test');
        expect(onInputChange).toHaveBeenCalledTimes(4);
        expect(onInputChange.mock.calls[3][0]).toBe('test');
    });

    it('TagInput 的 keydown 只来自输入框', async () => {
        const onKeydown = vi.fn<Handler<'keydown'>>();
        renderTagInput({ onKeydown });
        await userEvent.type(getInput(), 'a');
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onKeydown.mock.calls[0][0].key).toBe('a');
    });

    it('Enter 键添加标签', async () => {
        const onAdd = vi.fn<Handler<'add'>>();
        renderTagInput({ defaultValue: [], onAdd });
        await userEvent.type(getInput(), 'newtag');
        await pressEnter();
        expect(onAdd).toHaveBeenCalledWith(['newtag']);
        expect(getTagTexts()).toEqual(['newtag']);
        expect(getInput()).toHaveValue('');
    });

    it('字符串类型的 separator', async () => {
        renderTagInput({ separator: ',' });
        await userEvent.type(getInput(), 'a,b');
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
    });

    it('数组类型的 separator', async () => {
        renderTagInput({ separator: [',', ';'] });
        await userEvent.type(getInput(), 'a;b,c');
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('受控 inputValue 的更新', async () => {
        const view = renderTagInput({ inputValue: 'initial' });
        expect(getInput()).toHaveValue('initial');
        await userEvent.type(getInput(), 'x');
        await nextTick();
        expect(getInput()).toHaveValue('initial');
        await view.rerender({ inputValue: 'updated' });
        expect(getInput()).toHaveValue('updated');
    });

    it('文本内容的 insetLabel', () => {
        renderTagInput({}, { insetLabel: () => 'Label:' });
        expect(document.querySelector(`.${tagInputCls}-inset-label`)).toHaveTextContent('Label:');
        expect(document.querySelector(`.${tagInputCls}-inset-label`)).toHaveClass(`${tagInputCls}-prefix-text`);
        expect(getRoot()).toHaveClass(`${tagInputCls}-with-prefix`);
    });

    it('文本内容的 prefix 渲染文本类名', () => {
        renderTagInput({}, { prefix: () => 'Prefix:' });
        expect(document.querySelector(`.${tagInputCls}-prefix-text`)).toHaveTextContent('Prefix:');
    });

    it('文本内容的 suffix 渲染文本类名', () => {
        renderTagInput({}, { suffix: () => 'Suffix' });
        expect(document.querySelector(`.${tagInputCls}-suffix-text`)).toHaveTextContent('Suffix');
        expect(getRoot()).toHaveClass(`${tagInputCls}-with-suffix`);
    });

    it('TagInput 的 small 尺寸', () => {
        renderTagInput({ size: 'small' });
        expect(getRoot()).toHaveClass(`${tagInputCls}-small`);
    });

    it('TagInput 的默认尺寸', () => {
        renderTagInput({ size: 'default' });
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-small`);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-large`);
    });

    it('expandRestTagsOnClick 为 true 时点击展开剩余标签', async () => {
        renderTagInput({ defaultValue: ['abc', 'hotsoon', 'lark', 'bytedance'], maxTagCount: 2 });
        expect(getRestCount()).toHaveTextContent('+2');
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(getRestCount()).toBeNull();
        expect(getTagTexts()).toEqual(['abc', 'hotsoon', 'lark', 'bytedance']);
    });

    it('输入法组合事件 compositionend', async () => {
        const onInputExceed = vi.fn<Handler<'inputExceed'>>();
        renderTagInput({ defaultValue: ['abc'], maxLength: 2, separator: ',', onInputExceed });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.compositionEnd(input, { target: { value: 'ab,cde' } });
        await nextTick();
        expect(input).toHaveValue('ab,cd');
        expect(onInputExceed).toHaveBeenCalledWith('ab,cde');
    });

    it('输入法提交超出 maxLength 的文本，separator 为数组时按首个分隔符拼接', async () => {
        renderTagInput({ maxLength: 2, separator: ['-', ' '] });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.compositionEnd(input, { target: { value: 'ab-cde' } });
        await nextTick();
        expect(input).toHaveValue('ab-cd');
        await pressEnter();
        expect(getTagTexts()).toEqual(['ab', 'cd']);
    });

    it('受控 inputValue 下，输入法提交的超长文本被截断后经 inputChange 通知', async () => {
        const onInputChange = vi.fn<Handler<'inputChange'>>();
        renderTagInput({ inputValue: '', maxLength: 2, separator: ',', onInputChange });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.compositionEnd(input, { target: { value: 'ab,cde' } });
        expect(onInputChange).toHaveBeenLastCalledWith('ab,cd', expect.objectContaining({ type: 'compositionend' }));
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

    it('输入法组合流程', async () => {
        renderTagInput({ defaultValue: ['abc'] });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.update(input, '中文');
        await fireEvent.compositionEnd(input, { target: { value: '中文' } });
        await nextTick();
        expect(input).toHaveValue('中文');
        await pressEnter();
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
        expect(getHandles()).toHaveLength(0);
        expect(document.querySelector(`.${tagInputCls}-sortable-list`)).toBeNull();
        await userEvent.click(getRoot());
        const itemSelector = `.${tagInputCls}-sortable-list .${tagInputCls}-drag-item`;
        await waitFor(() => expect(document.querySelectorAll(itemSelector)).toHaveLength(3));
        expect(screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })).toHaveLength(3);
        const items = document.querySelectorAll(itemSelector);
        expect([...items].map((item) => item.textContent)).toEqual(['abc', 'def', 'ghi']);
        for (const item of items) {
            expect(item).toHaveClass(`${tagInputCls}-wrapper-tag-icon`);
            expect(item.querySelector(`.${tagInputCls}-drag-handler`)).not.toBeNull();
        }
    });

    it('拖拽句柄是标签的兄弟，不在可关闭标签内部', async () => {
        renderTagInput({ draggable: true, defaultValue: ['abc'] });
        await userEvent.click(getRoot());
        const handle = await screen.findByRole('button', { name: zh_CN.TagInput.dragSort });
        const tag = screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', 'abc') });
        expect(tag.contains(handle)).toBe(false);
        expect(handle.parentElement).toBe(tag.parentElement);
        expect(handle.parentElement).toHaveClass(`${tagInputCls}-drag-item`);
        expect(tag).not.toHaveClass(`${tagInputCls}-wrapper-tag-icon`);
    });

    it('draggable 时重复标签各有自己的句柄，关闭第二个只删除第二个', async () => {
        const onRemove = vi.fn<Handler<'remove'>>();
        renderTagInput({ draggable: true, defaultValue: ['a', 'b', 'a'], onRemove });
        await userEvent.click(getRoot());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        expect(getTagTexts()).toEqual(['a', 'b', 'a']);
        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[2]);
        expect(onRemove).toHaveBeenCalledWith('a', 2);
        expect(getTagTexts()).toEqual(['a', 'b']);
    });

    it('悬停状态不经过组件状态，根元素不带 -hover 类', async () => {
        renderTagInput({ showClear: true, defaultValue: ['abc'] });
        await userEvent.hover(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
        expect(getClearBtn()).not.toBeNull();
        await userEvent.unhover(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-hover`);
    });

    it('组合结束时未超长的文本原样保留', async () => {
        const onInputExceed = vi.fn<Handler<'inputExceed'>>();
        renderTagInput({ defaultValue: ['abc'], maxLength: 3, onInputExceed });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.update(input, 'zhong');
        await fireEvent.compositionEnd(input, { target: { value: '中' } });
        await nextTick();
        expect(input).toHaveValue('中');
        expect(onInputExceed).not.toHaveBeenCalled();
    });

    it('禁用状态下的 focus 方法', async () => {
        const { handle } = renderWithHandle({ defaultValue: ['abc'], disabled: true });
        handle().focus();
        await nextTick();
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('清空按钮是输入框后的具名原生按钮，Enter 和 Space 可以触发', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onChange = vi.fn<Handler<'change'>>();
            const view = renderTagInput({ showClear: true, defaultValue: ['abc'], onChange });
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
            view.unmount();
        }
    });

    it('点击 prefix 聚焦输入框并进入聚焦态', async () => {
        const onFocus = vi.fn<Handler<'focus'>>();
        renderTagInput({ defaultValue: ['abc'], onFocus }, { prefix: () => <span>Prefix</span> });
        await userEvent.click(screen.getByText('Prefix'));
        expect(getInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('prefix、suffix 的 mousedown 阻止默认行为，输入框的不阻止', () => {
        renderTagInput({ defaultValue: ['abc'] }, { prefix: () => <span>Prefix</span>, suffix: () => <span>Suffix</span> });
        expect(mouseDown(screen.getByText('Prefix')).defaultPrevented).toBe(true);
        expect(mouseDown(screen.getByText('Suffix')).defaultPrevented).toBe(true);
        expect(mouseDown(getInput()).defaultPrevented).toBe(false);
    });

    it('#tag 插槽配合 draggable 时句柄与自定义节点同在 -drag-item 中', async () => {
        renderTagInput({ draggable: true, defaultValue: ['abc', 'def'] }, { tag: ({ value }: TagInputTagSlotProps) => <span class="custom-draggable-tag">{value}</span> });
        expect(document.querySelector(`.${tagInputCls}-drag-item`)).toBeNull();
        await userEvent.click(getRoot());
        await waitFor(() => expect(document.querySelectorAll(`.${tagInputCls}-drag-item`)).toHaveLength(2));
        for (const item of document.querySelectorAll(`.${tagInputCls}-drag-item`)) {
            expect(item.querySelector(`.${tagInputCls}-drag-handler`)).not.toBeNull();
            expect(item.querySelector('.custom-draggable-tag')).not.toBeNull();
        }
    });

    it('点击文本 prefix 后聚焦，点击外部后失焦', async () => {
        renderTagInput({ defaultValue: ['abc'] }, { prefix: () => 'Prefix' });
        await userEvent.click(screen.getByText('Prefix'));
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await userEvent.click(document.body);
        expect(getInput()).not.toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('组合期间不校验 maxLength，组合结束后恢复校验', async () => {
        renderTagInput({ defaultValue: ['abc'], maxLength: 2 });
        const input = getInput();
        await fireEvent.compositionStart(input);
        await fireEvent.update(input, 'abcd');
        expect(input).toHaveValue('abcd');
        await fireEvent.compositionEnd(input, { target: { value: 'abcd' } });
        await nextTick();
        expect(input).toHaveValue('ab');
        await fireEvent.update(input, 'abc');
        await nextTick();
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
        await fireEvent.mouseDown(getInput());
        await fireEvent.mouseUp(document.body);
        await fireEvent.click(document.body);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('在 suffix 内已打开的嵌套 Popover 里按下鼠标保持激活，在外部按下才结束', async () => {
        renderTagInput(
            { defaultValue: ['abc'] },
            {
                suffix: () => (
                    <Popover ariaLabel="Nested" motion={false} trigger="custom" visible>
                        {{
                            default: () => <span>nested trigger</span>,
                            content: () => <button type="button">inside nested</button>,
                        }}
                    </Popover>
                ),
            }
        );
        await userEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await fireEvent.mouseDown(document.body);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });
});

describe('TagInput 行为基线', () => {
    it('受控 modelValue 始终渲染 prop，Backspace、关闭和清空时上报下一个值', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onRemove = vi.fn<Handler<'remove'>>();
        renderTagInput({ modelValue: ['abc', 'def'], onChange, onRemove, showClear: true });
        await pressBackspace();
        expect(onRemove).toHaveBeenLastCalledWith('def', 1);
        expect(onChange).toHaveBeenLastCalledWith(['abc']);
        expect(getTagTexts()).toEqual(['abc', 'def']);

        await userEvent.click(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[0]);
        expect(onRemove).toHaveBeenLastCalledWith('abc', 0);
        expect(onChange).toHaveBeenLastCalledWith(['def']);
        expect(getTagTexts()).toEqual(['abc', 'def']);

        await userEvent.hover(getRoot());
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(getTagTexts()).toEqual(['abc', 'def']);
    });

    it('父组件修改后读取最新的受控值', async () => {
        const onRemove = vi.fn<Handler<'remove'>>();
        const onAdd = vi.fn<Handler<'add'>>();
        const onChange = vi.fn<Handler<'change'>>();
        const view = renderTagInput({ modelValue: ['abc'], onRemove, onAdd, onChange });
        await view.rerender({ modelValue: ['x', 'y'] });
        await pressBackspace();
        expect(onRemove).toHaveBeenCalledWith('y', 1);

        await view.rerender({ modelValue: ['x', 'y'], inputValue: 'z' });
        await pressEnter();
        expect(onAdd).toHaveBeenCalledWith(['z']);
        expect(onChange).toHaveBeenLastCalledWith(['x', 'y', 'z']);
    });

    it('Enter 添加标签后，受控 inputValue 上报被清空的文本', async () => {
        const onInputChange = vi.fn<Handler<'inputChange'>>();
        renderTagInput({ inputValue: 'a,b', onInputChange });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(onInputChange).toHaveBeenCalledTimes(1);
        expect(onInputChange.mock.calls[0][0]).toBe('');
        expect(getInput()).toHaveValue('a,b');
    });

    it('非受控输入、分隔符、重复项和 max 协同工作', async () => {
        const onAdd = vi.fn<Handler<'add'>>();
        const onExceed = vi.fn<Handler<'exceed'>>();
        renderTagInput({ defaultValue: ['a'], allowDuplicates: false, max: 3, onAdd, onExceed });
        await userEvent.type(getInput(), 'a,b,b,c,d');
        await pressEnter();
        expect(onExceed).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
        expect(onAdd).toHaveBeenCalledWith(['b', 'c']);
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        expect(getInput()).toHaveValue('');
    });

    it('点击外部后超出 maxTagCount 的标签重新折叠，剩余数量随删除更新', async () => {
        renderTagInput({ defaultValue: ['a', 'b', 'c', 'd'], maxTagCount: 2, showRestTagsPopover: false });
        expect(getRestCount()).toHaveTextContent('+2');
        await pressBackspace();
        expect(getRestCount()).toHaveTextContent('+1');
        await userEvent.click(getRoot());
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        await userEvent.click(document.body);
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(getRestCount()).toHaveTextContent('+1');
    });

    it('addOnBlur 只添加一次输入文本，然后上报 blur', async () => {
        const calls: unknown[] = [];
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({
            addOnBlur: true,
            onAdd: (value: string[]) => calls.push(['add', value]),
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

    it('#tag 接收 value、index 和 onClose，禁用时忽略关闭', async () => {
        const tag = vi.fn<(props: TagInputTagSlotProps) => VNode>(({ value, index, onClose }) => <button type="button" onClick={onClose}>{`${index}:${value}`}</button>);
        const onRemove = vi.fn<Handler<'remove'>>();
        const view = renderTagInput({ defaultValue: ['a', 'b'], onRemove }, { tag });
        expect(tag).toHaveBeenCalledWith(expect.objectContaining({ value: 'a', index: 0, onClose: expect.any(Function) }));
        await view.rerender({ defaultValue: ['a', 'b'], disabled: true });
        await userEvent.click(screen.getByText('1:b'));
        expect(onRemove).not.toHaveBeenCalled();
        await view.rerender({ defaultValue: ['a', 'b'], disabled: false });
        await userEvent.click(screen.getByText('1:b'));
        expect(onRemove).toHaveBeenCalledWith('b', 1);
        expect(screen.queryByText('1:b')).toBeNull();
    });

    it('禁用时忽略输入、Backspace 和点击', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ defaultValue: ['a'], disabled: true, onChange });
        await userEvent.type(getInput(), 'x');
        expect(getInput()).toHaveValue('');
        await userEvent.click(getRoot());
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a']);
    });

    it('ref 的 focus 只注册一次外部点击监听，blur 时移除', async () => {
        const { handle } = renderWithHandle({ defaultValue: ['a', 'b', 'c'], maxTagCount: 1 });
        handle().focus();
        handle().focus();
        await nextTick();
        expect(getTagTexts()).toEqual(['a', 'b', 'c']);
        handle().blur();
        await nextTick();
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

describe('TagInput 全局默认值与属性落点', () => {
    it('读取 semiGlobal overrideDefaultProps 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { TagInput: { separator: '-', showClear: true } };
        const view = renderTagInput({ inputValue: 'a-b' });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a', 'b']);
        expect(getClearBtn()).not.toBeNull();
        view.unmount();
        renderTagInput({ inputValue: 'a-b', separator: null, showClear: false });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a-b']);
        expect(getClearBtn()).toBeNull();
    });

    it('全局默认值里的 insetLabelId 不影响 TagInput', () => {
        // the global type omits per-instance ids; cast for an untyped app that sets one
        semiGlobal.config.overrideDefaultProps = { TagInput: { insetLabelId: 'label-global' } } as object;
        renderTagInput({}, { insetLabel: () => 'Label' });
        expect(document.getElementById('label-global')).toBeNull();
    });

    it('全局默认值覆盖 size、allowDuplicates，传入 undefined 视为未设置，split 每次读取', async () => {
        const split = vi.fn<(value: string) => string[]>((value) => value.split('|'));
        semiGlobal.config.overrideDefaultProps = { TagInput: { size: 'large', allowDuplicates: false, split } };
        renderTagInput({ defaultValue: ['a'], inputValue: 'a|b', size: undefined });
        expect(getRoot()).toHaveClass(`${tagInputCls}-large`);
        await pressEnter();
        expect(split).toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['a', 'b']);
    });

    it('未声明属性落在根元素，控制属性落在文本输入框', async () => {
        let keyupTarget: EventTarget | null = null;
        // currentTarget only holds during dispatch
        const onKeyup = vi.fn<(event: KeyboardEvent) => void>((event) => {
            keyupTarget = event.currentTarget;
        });
        renderTagInput({
            id: 'tags',
            name: 'tags',
            role: 'combobox',
            'aria-describedby': 'desc',
            'aria-label': 'Tags',
            'aria-required': true,
            'data-testid': 'root',
            title: 'tags title',
            'aria-hidden': 'false',
            onKeyup,
        });
        expect(document.querySelector('input')).toBe(screen.getByRole('combobox', { name: 'Tags' }));
        const native = document.querySelector('input') as HTMLInputElement;
        for (const [attr, value] of [
            ['id', 'tags'],
            ['name', 'tags'],
            ['aria-describedby', 'desc'],
            ['aria-required', 'true'],
        ]) {
            expect(native).toHaveAttribute(attr, value);
            expect(getRoot()).not.toHaveAttribute(attr);
        }
        expect(getRoot()).toHaveAttribute('role', 'group');
        expect(getRoot()).toHaveAttribute('title', 'tags title');
        expect(getRoot()).toHaveAttribute('aria-hidden', 'false');
        expect(screen.getByTestId('root')).toBe(getRoot());
        expect(native).not.toHaveAttribute('title');
        await fireEvent.keyUp(native);
        expect(onKeyup).toHaveBeenCalledTimes(1);
        expect(keyupTarget).toBe(getRoot());
    });

    it('ref 是带 focus 和 blur 的句柄', () => {
        const { handle } = renderWithHandle();
        expect(Object.keys(handle()).sort()).toEqual(['blur', 'focus']);
    });

    it('点击已聚焦 TagInput 的 prefix 不会再次聚焦输入框', async () => {
        renderTagInput({}, { prefix: () => <span>Prefix</span> });
        await userEvent.click(getInput());
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        await userEvent.click(screen.getByText('Prefix'));
        expect(focus).not.toHaveBeenCalled();
        expect(getInput()).toHaveFocus();
    });

    it('卸载激活中的 TagInput 时移除 document 的 mousedown 监听', async () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const view = renderTagInput({ defaultValue: ['abc'] });
        await userEvent.click(getRoot());
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
        view.unmount();
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
    });

    it('split 的默认值为 undefined，TagInput 与内部 TagItem 的可选 Boolean prop 都有默认值', () => {
        type Options = Record<string, { type?: unknown; default?: unknown; required?: boolean }>;
        const optionsOf = (component: unknown) => (component as { props: Options }).props;
        expect(optionsOf(TagInput).split.default).toBeUndefined();
        for (const component of [TagInput, TagItem]) {
            const withoutDefault = Object.entries(optionsOf(component))
                .filter(([, option]) => [option.type].flat().includes(Boolean) && !option.required && !('default' in option))
                .map(([key]) => key);
            expect(withoutDefault).toEqual([]);
        }
    });
});

describe('TagInput（Vue）', () => {
    it('v-model:inputValue.trim 能输入词间空格，且修饰符不落到 DOM', async () => {
        render(ModelTrim);
        await userEvent.type(getInput(), 'a b');
        expect(getInput()).toHaveValue('a b');
        expect(screen.getByTestId('trim-value')).toHaveTextContent('"a b"');
        expect(document.querySelector('[inputvaluemodifiers]')).toBeNull();
    });

    it('v-model 与 v-model:inputValue 双向同步，宿主改回 undefined 时清空', async () => {
        render(Model);
        expect(getTagTexts()).toEqual(['a']);
        await userEvent.type(getInput(), 'b');
        expect(screen.getByTestId('text')).toHaveTextContent('b');
        await pressEnter();
        expect(screen.getByTestId('tags')).toHaveTextContent('["a","b"]');
        expect(screen.getByTestId('text')).toHaveTextContent('');
        expect(getTagTexts()).toEqual(['a', 'b']);
        await pressBackspace();
        expect(screen.getByTestId('tags')).toHaveTextContent('["a"]');
        await userEvent.click(screen.getByRole('button', { name: 'set' }));
        expect(getTagTexts()).toEqual(['x', 'y']);
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(screen.getByTestId('tags')).toHaveTextContent('[]');
        await userEvent.click(screen.getByRole('button', { name: 'set' }));
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(getTagTexts()).toEqual([]);
        await userEvent.type(getInput(), 'c{Enter}');
        expect(getTagTexts()).toEqual(['c']);
    });

    it('单向绑定 modelValue 时只通知不自改', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTagInput({ modelValue: ['a'], onChange });
        await userEvent.type(getInput(), 'b');
        await pressEnter();
        expect(onChange).toHaveBeenCalledWith(['a', 'b']);
        expect(getTagTexts()).toEqual(['a']);
    });

    it('单向绑定 inputValue 时键入的文字恢复为传入值', async () => {
        const onInputChange = vi.fn<Handler<'inputChange'>>();
        renderTagInput({ inputValue: 'fixed', onInputChange });
        await userEvent.type(getInput(), 'x');
        await nextTick();
        expect(onInputChange).toHaveBeenCalledWith('fixedx', expect.objectContaining({ type: 'input' }));
        expect(getInput()).toHaveValue('fixed');
    });

    it('inputChange 的事件覆盖 input、keydown、focusout、click 与 compositionend', async () => {
        const onInputChange = vi.fn<Handler<'inputChange'>>();
        render(() => (
            <>
                <TagInput addOnBlur maxLength={2} showClear defaultValue={['t']} onInputChange={onInputChange} />
                <button type="button">after</button>
            </>
        ));
        const types = () => onInputChange.mock.calls.map(([, event]) => event.type);
        await userEvent.type(getInput(), 'a');
        await pressEnter();
        await userEvent.type(getInput(), 'b');
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.type(getInput(), 'c');
        await userEvent.click(getClearBtn() as HTMLElement);
        await fireEvent.compositionStart(getInput());
        await fireEvent.compositionEnd(getInput(), { target: { value: 'abc' } });
        expect(types()).toEqual(['input', 'keydown', 'input', 'focusout', 'input', 'click', 'compositionend']);
    });

    it('根元素的 @click 与内部的激活处理都执行', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderTagInput({ defaultValue: ['a'], onClick });
        await userEvent.click(getRoot());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });

    it('change、focus、blur、keydown 只收到组件事件，不收到冒泡的原生事件', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const onFocus = vi.fn<(...args: unknown[]) => void>();
        const onBlur = vi.fn<(...args: unknown[]) => void>();
        const onKeydown = vi.fn<(...args: unknown[]) => void>();
        renderTagInput({ onChange, onFocus, onBlur, onKeydown, defaultValue: ['t'] });
        await userEvent.click(getInput());
        await userEvent.type(getInput(), 'a');
        await fireEvent.change(getInput());
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag`) as HTMLElement);
        await userEvent.click(document.body);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('keydown 在组件处理之后发出，使用方 preventDefault 不阻止 Enter 添加标签', async () => {
        const onKeydown = vi.fn<Handler<'keydown'>>((event) => event.preventDefault());
        renderTagInput({ inputValue: 'a', onKeydown });
        await pressEnter();
        expect(getTagTexts()).toEqual(['a']);
        expect(onKeydown).toHaveBeenCalledTimes(1);
    });

    it('插槽内容决定前后缀类名，空插槽不留空壳，#clearIcon 为空时回落默认图标', () => {
        renderTagInput({ defaultValue: ['a'], showClear: true }, { prefix: () => <IconSearch />, suffix: () => [], clearIcon: () => [] });
        expect(document.querySelector(`.${tagInputCls}-prefix`)).toHaveClass(`${tagInputCls}-prefix-icon`);
        expect(document.querySelector(`.${tagInputCls}-suffix`)).toBeNull();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-with-suffix`);
        expect(getClearBtn()?.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).not.toBeNull();
    });

    it('prefix 与 insetLabel 同时提供时渲染 prefix，并带 -inset-label 类', () => {
        renderTagInput({}, { prefix: () => 'P', insetLabel: () => 'L' });
        const node = document.querySelector(`.${tagInputCls}-prefix`);
        expect(node).toHaveTextContent('P');
        expect(node).toHaveClass(`${tagInputCls}-inset-label`);
        expect(node).toHaveAttribute('x-semi-prop', 'prefix');
    });

    it('#tag 的 onClose 带事件时阻止默认行为，渲染为空时不渲染默认标签', async () => {
        const onRemove = vi.fn<Handler<'remove'>>();
        let closeOf: TagInputTagSlotProps['onClose'] = () => {};
        renderTagInput(
            { modelValue: ['a', 'b'], onRemove },
            {
                tag: ({ onClose, index }: TagInputTagSlotProps) => {
                    if (index === 0) closeOf = onClose;
                    return [];
                },
            }
        );
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
        const event = new Event('close', { cancelable: true });
        closeOf(event);
        expect(event.defaultPrevented).toBe(true);
        expect(onRemove).toHaveBeenLastCalledWith('a', 0);
        closeOf();
        expect(onRemove).toHaveBeenCalledTimes(2);
    });

    it('SSR 输出标签与输入框，不访问 document，不含拖拽句柄', async () => {
        vi.stubGlobal('document', undefined);
        const html = await renderToString(<TagInput defaultValue={['ssr-tag']} draggable />).finally(() => vi.unstubAllGlobals());
        expect(html).toContain('ssr-tag');
        expect(html).toContain('role="group"');
        expect(html).not.toContain(`${tagInputCls}-drag-handler`);
    });

    it('KeepAlive 切走再切回后保留标签', async () => {
        const cached = shallowRef(true);
        render(() => (
            <KeepAlive>
                {{
                    default: () => [cached.value ? <TagInput defaultValue={['a']} /> : <p>other</p>],
                }}
            </KeepAlive>
        ));
        await userEvent.type(getInput(), 'b{Enter}');
        expect(getTagTexts()).toEqual(['a', 'b']);
        cached.value = false;
        await nextTick();
        expect(screen.queryByRole('group')).toBeNull();
        cached.value = true;
        await nextTick();
        expect(getTagTexts()).toEqual(['a', 'b']);
    });
});

describe('TagInput 焦点落点、命名与受控输入', () => {
    it('Tooltip 注入的 tabindex 落在输入框上，根元素不成为 Tab 停靠点', async () => {
        render(() => <Tooltip>{{ default: () => <TagInput />, content: () => 'tip' }}</Tooltip>);
        await nextTick();
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '0');
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
    });

    it('显式 tabindex 交给输入框', () => {
        renderTagInput({ tabindex: -1 });
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getInput()).toHaveAttribute('tabindex', '-1');
    });

    it('渲染出的 insetLabel 为输入框命名，显式名称优先', () => {
        const first = renderTagInput({}, { insetLabel: () => 'Tags' });
        expect(screen.getByRole('textbox', { name: 'Tags' })).toBe(getInput());
        first.unmount();
        const second = renderTagInput({ insetLabelId: 'inset-id' }, { insetLabel: () => 'Tags' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'inset-id');
        second.unmount();
        renderTagInput({ 'aria-label': 'Own name' }, { insetLabel: () => 'Tags' });
        expect(screen.getByRole('textbox', { name: 'Own name' })).toBe(getInput());
    });

    it('受控 inputValue 变回 undefined 时清空输入框', async () => {
        const view = renderTagInput({ inputValue: 'abc' });
        await fireEvent.update(getInput(), 'abcd');
        await view.rerender({ inputValue: undefined });
        expect(getInput()).toHaveValue('');
    });
});
