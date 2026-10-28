/** @jsxImportSource vue */
import { nextTick, reactive, ref } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { endLeaveAnimations, render } from '@test/utils/vue';
import Rating, { type RatingHandle } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import RatingItem from '../item.vue';
import Character from './fixtures/character.vue';
import InTooltip from './fixtures/in-tooltip.vue';
import Model from './fixtures/model.vue';

type Props = Record<string, unknown>;
type OnValue = (value: number) => void;
type OnHover = (value: number | undefined) => void;
type OnClick = (event: MouseEvent | KeyboardEvent, index: number) => void;
type OnFocus = (event: FocusEvent) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-rating`;
const tooltips = ['terrible', 'bad', 'normal', 'good', 'wonderful'];

const getList = () => document.querySelector<HTMLUListElement>(`ul.${prefixCls}`) as HTMLUListElement;
const getRadios = () => screen.getAllByRole('radio');
const getRadio = (name: string) => screen.getByRole('radio', { name });
const getFullStars = () => document.querySelectorAll(`.${prefixCls}-star-full`);
const getHalfStars = () => document.querySelectorAll(`.${prefixCls}-star-half`);
const expectValue = (value: number, count = 5) => expect(getList()).toHaveAttribute('aria-label', `Rating: ${value} of ${count} star${value === 1 ? '' : 's'},`);

const renderRating = (props: Props = {}, provider: Props = {}) => {
    const state = reactive({ ...props });
    const handle = ref<RatingHandle>();
    const view = render({
        render: () => (
            <ConfigProvider locale={en_US} {...provider}>
                {() => <Rating {...state} ref={handle} />}
            </ConfigProvider>
        ),
    });
    return { ...view, state, handle: () => handle.value as RatingHandle };
};
const keyOnList = (key: string) => fireEvent.keyDown(getList(), { key });

describe('Rating 审计修复', () => {
    it('空星上按 Enter 不产生越界值', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ onChange: change });
        getRadio('0 stars').focus();
        await userEvent.keyboard('{Enter}');
        expect(change.mock.calls.every(([value]) => value <= 5)).toBe(true);
        expectValue(0);
    });

    it('allowHalf 时在半星上按 Enter 选中半星', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 1, allowHalf: true, onChange: change });
        getRadio('2.5 stars').focus();
        await userEvent.keyboard('{Enter}');
        expect(change).toHaveBeenLastCalledWith(2.5);
        expectValue(2.5);
    });

    it('allowHalf 时在已选半星上按 Enter 清除', async () => {
        renderRating({ defaultValue: 2.5, allowHalf: true });
        getRadio('2.5 stars').focus();
        await userEvent.keyboard('{Enter}');
        expectValue(0);
    });

    it('悬停不改变 aria-checked 与 Tab 停靠点', async () => {
        renderRating({ defaultValue: 2 });
        await fireEvent.mouseMove(getRadios()[3] as HTMLElement);
        expect(getRadio('2 stars')).toHaveAttribute('aria-checked', 'true');
        expect(getRadio('4 stars')).toHaveAttribute('aria-checked', 'false');
        expect(getRadios().filter((radio) => radio.getAttribute('tabindex') === '0')).toHaveLength(1);
        expect(getRadio('2 stars')).toHaveAttribute('tabindex', '0');
        expect(getFullStars()).toHaveLength(4);
    });

    it('纯文本 #character 作单位，在其他语言下不追加英文复数 s', () => {
        render(Character, { props: { text: '心', defaultValue: 3 } });
        expect(getList()).toHaveAttribute('aria-label', '评分：3 / 5 心，');
        expect(getRadio('3 心')).toBeInTheDocument();
    });

    it('单位里的 $& 按原文写入名称，不当作替换模式', () => {
        render(Character, { props: { text: '$&', defaultValue: 3 } });
        expect(getList()).toHaveAttribute('aria-label', '评分：3 / 5 $&，');
        expect(getRadio('3 $&')).toBeInTheDocument();
    });
});

describe('Rating', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('自定义 class 与 style', () => {
        render(Rating, { attrs: { class: 'test', style: { color: 'red' } } });
        const list = document.querySelector(`.${prefixCls}.test`);
        expect(list).not.toBeNull();
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('自定义 count', () => {
        renderRating({ count: 10 });
        expect(getList().children).toHaveLength(11);
        expect(getRadios()).toHaveLength(11);
    });

    it('不同尺寸', () => {
        const view = renderRating({ size: 'small' });
        expect(document.querySelector(`.${prefixCls}-star-small`)).not.toBeNull();
        view.unmount();

        renderRating();
        expect(document.querySelector(`.${prefixCls}-star-default`)).not.toBeNull();
    });

    it('defaultValue', () => {
        renderRating({ defaultValue: 4 });
        expectValue(4);
        expect(getFullStars()).toHaveLength(4);
        expect(getRadio('4 stars')).toHaveAttribute('aria-checked', 'true');
    });

    it('disabled', () => {
        renderRating({ defaultValue: 3, disabled: true });
        expect(getList()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('allowHalf', () => {
        renderRating({ defaultValue: 3.5, allowHalf: true });
        expectValue(3.5);
        expect(getFullStars()).toHaveLength(3);
        expect(getHalfStars()).toHaveLength(1);
        expect(getRadio('3.5 stars')).toHaveAttribute('aria-checked', 'true');
    });

    it('#character 自定义字符', () => {
        render(Character);
        expect(document.querySelector(`.${prefixCls}-star-second`)).toHaveTextContent(/^赞$/);
    });

    it('change 回调', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 3, onChange: change });
        await userEvent.click(getRadios()[0] as HTMLElement);
        expectValue(1);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledWith(1);
    });

    it('受控 modelValue', async () => {
        const { state } = renderRating({ modelValue: 2 });
        expectValue(2);
        expect(getFullStars()).toHaveLength(2);

        state.modelValue = 5;
        await nextTick();
        expectValue(5);
        expect(getFullStars()).toHaveLength(5);
    });

    it('hoverChange', async () => {
        const hoverChange = vi.fn<OnHover>();
        renderRating({ onHoverChange: hoverChange });
        await fireEvent.mouseMove(getRadios()[1] as HTMLElement);
        expect(hoverChange).toHaveBeenLastCalledWith(2);
        expect(getFullStars()).toHaveLength(2);

        await fireEvent.mouseLeave(getList());
        expect(hoverChange).toHaveBeenCalledTimes(2);
        expect(hoverChange).toHaveBeenLastCalledWith(undefined);
        expect(getFullStars()).toHaveLength(0);
    });

    it('hoverChange + allowHalf', async () => {
        const hoverChange = vi.fn<OnHover>();
        const { container } = renderRating({ allowHalf: true, onHoverChange: hoverChange });
        await fireEvent.mouseMove(container.querySelectorAll(`.${prefixCls}-star-wrapper`)[1] as HTMLElement);
        expect(hoverChange).toHaveBeenLastCalledWith(2);

        await fireEvent.mouseLeave(getList());
        expect(hoverChange).toHaveBeenCalledTimes(2);
        expect(hoverChange).toHaveBeenLastCalledWith(undefined);
    });

    it('allowClear', async () => {
        renderRating({ defaultValue: 2, allowClear: true });
        expectValue(2);
        await userEvent.click(getRadios()[1] as HTMLElement);
        expectValue(0);
        expect(getFullStars()).toHaveLength(0);
    });

    it('tooltips', async () => {
        renderRating({ tooltips });
        expect(screen.queryByText('bad')).toBeNull();
        await fireEvent.mouseMove(getRadios()[1] as HTMLElement);
        expect(await screen.findByText('bad')).toBeInTheDocument();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(/^bad$/);
    });

    it('tooltips 在悬停移动时保持星星挂载', async () => {
        renderRating({ tooltips });
        const stars = getRadios();
        await fireEvent.mouseMove(stars[1] as HTMLElement);
        expect(await screen.findByText('bad')).toBeInTheDocument();
        await fireEvent.mouseMove(stars[2] as HTMLElement);
        expect(await screen.findByText('normal')).toBeInTheDocument();
        getRadios().forEach((radio, index) => expect(radio).toBe(stars[index]));
    });

    it('focus 与 blur 在焦点进入与离开列表时触发', () => {
        const focus = vi.fn<OnFocus>();
        const blur = vi.fn<OnFocus>();
        renderRating({ defaultValue: 2, onBlur: blur, onFocus: focus });
        getRadio('2 stars').focus();
        expect(focus).toHaveBeenCalledTimes(1);
        expect(focus.mock.calls[0]?.[0]).toBeInstanceOf(FocusEvent);
        getRadio('2 stars').blur();
        expect(blur).toHaveBeenCalledTimes(1);
    });

    it('方向键在星之间移动焦点时不触发 focus 与 blur，Tab 离开后才触发 blur', async () => {
        const focus = vi.fn<OnFocus>();
        const blur = vi.fn<OnFocus>();
        render({
            render: () => (
                <ConfigProvider locale={en_US}>
                    {() => (
                        <>
                            <Rating defaultValue={2} onBlur={blur} onFocus={focus} />
                            <button type="button">after</button>
                        </>
                    )}
                </ConfigProvider>
            ),
        });
        await userEvent.tab();
        expect(getRadios()[1]).toHaveFocus();
        expect(focus).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(getRadios()[3]).toHaveFocus();
        expect(focus).toHaveBeenCalledTimes(1);
        expect(blur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(screen.getByRole('button')).toHaveFocus();
        expect(blur).toHaveBeenCalledTimes(1);
    });

    it('keydown 只在方向键时触发', async () => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        const view = renderRating({ defaultValue: 2, onKeydown: keydown });
        await keyOnList('ArrowLeft');
        expectValue(1);
        expect(getRadio('1 star')).toHaveFocus();
        await keyOnList('ArrowRight');
        expectValue(2);
        expect(getRadio('2 stars')).toHaveFocus();
        await keyOnList('a');
        expect(keydown).toHaveBeenCalledTimes(2);
        expect(keydown.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
        view.unmount();

        renderRating({ defaultValue: 2.5, allowHalf: true });
        await keyOnList('ArrowLeft');
        expectValue(2);
        await keyOnList('ArrowRight');
        await keyOnList('ArrowRight');
        expectValue(3);
        expect(getRadio('3 stars')).toHaveFocus();
    });

    it('rtl 模式', async () => {
        const view = renderRating({ defaultValue: 2 }, { direction: 'rtl' });
        await keyOnList('ArrowLeft');
        expectValue(3);
        await keyOnList('ArrowRight');
        expectValue(2);
        view.unmount();

        renderRating({ defaultValue: 2.5, allowHalf: true }, { direction: 'rtl' });
        await keyOnList('ArrowLeft');
        expectValue(3);
        await keyOnList('ArrowRight');
        await keyOnList('ArrowRight');
        expectValue(2);
    });

    it('值落在两个 radio 之间时，方向键选中相邻的 radio', async () => {
        const between = renderRating({ defaultValue: 2.5 });
        await keyOnList('ArrowRight');
        expectValue(3);
        expect(getRadio('3 stars')).toHaveFocus();
        between.unmount();

        const below = renderRating({ defaultValue: 2.5 });
        await keyOnList('ArrowLeft');
        expectValue(2);
        expect(getRadio('2 stars')).toHaveFocus();
        below.unmount();

        renderRating({ defaultValue: 3.65, allowHalf: true });
        await keyOnList('ArrowDown');
        expectValue(4);
        await keyOnList('ArrowUp');
        expectValue(3.5);
        expect(getRadio('3.5 stars')).toHaveFocus();
    });

    it('Down 选中下一个、Up 选中上一个，RTL 下上下方向不镜像', async () => {
        const view = renderRating({ defaultValue: 2 });
        await keyOnList('ArrowDown');
        expectValue(3);
        expect(getRadio('3 stars')).toHaveFocus();
        await keyOnList('ArrowUp');
        expectValue(2);
        view.unmount();

        renderRating({ defaultValue: 2 }, { direction: 'rtl' });
        await keyOnList('ArrowDown');
        expectValue(3);
        await keyOnList('ArrowUp');
        expectValue(2);
    });

    it('受控 modelValue 变回 undefined 时回到 defaultValue', async () => {
        const { state } = renderRating({ modelValue: 3, defaultValue: 1 });
        expectValue(3);
        state.modelValue = undefined;
        await nextTick();
        expectValue(1);
        expect(getRadio('1 star')).toBeChecked();
    });

    it('多次点击', async () => {
        renderRating();
        await userEvent.click(getRadios()[1] as HTMLElement);
        expect(getFullStars()).toHaveLength(2);
        await userEvent.click(getRadios()[1] as HTMLElement);
        expect(getFullStars()).toHaveLength(0);
        await userEvent.click(getRadios()[1] as HTMLElement);
        expect(getFullStars()).toHaveLength(2);
    });

    // Testing Library re-inserts the mounted nodes, which drops jsdom focus; the browser test checks real focus
    it('autofocus 属性', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        renderRating({ autofocus: true });
        expect(focus.mock.contexts).toEqual([getRadio('0 stars')]);
    });

    it('ariaLabel 属性', () => {
        renderRating({ 'aria-label': '评分' });
        expect(screen.getByRole('radiogroup', { name: '评分' })).toBe(getList());
        expect(getRadio('1 star')).toBeInTheDocument();
        expect(getRadio('2 stars')).toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: /评分/ })).not.toBeInTheDocument();
    });

    it('ariaLabel 与纯文本 #character 同时传入时，单位取 #character', () => {
        render(Character, { props: { text: '心', ariaLabel: '评分' } });
        expect(screen.getByRole('radiogroup', { name: '评分' })).toBe(getList());
        expect(getRadio('1 心')).toBeInTheDocument();
    });

    it('aria-labelledby 属性', () => {
        renderRating({ 'aria-labelledby': 'rating-label' });
        expect(getList()).toHaveAttribute('aria-labelledby', 'rating-label');
    });

    it('preventScroll 属性', () => {
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
        const { handle } = renderRating({ preventScroll: true });
        handle().focus();
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(getRadio('0 stars')).toHaveFocus();
    });

    it('tabindex 被丢弃，列表保持 -1，只有选中的 radio 是 Tab 停靠点', () => {
        renderRating({ tabindex: 0, defaultValue: 2 });
        expect(getList()).toHaveAttribute('tabindex', '-1');
        expect(getRadios().filter((radio) => radio.getAttribute('tabindex') === '0')).toEqual([getRadio('2 stars')]);
    });

    it('id 属性', () => {
        renderRating({ id: 'my-rating' });
        expect(document.getElementById('my-rating')).toBe(getList());
    });

    it('focus 与 blur 方法：focus 落到 Tab 停靠的 radio', () => {
        const focus = vi.fn<OnFocus>();
        const blur = vi.fn<OnFocus>();
        const { handle } = renderRating({ defaultValue: 3, onBlur: blur, onFocus: focus });
        handle().focus();
        expect(getRadio('3 stars')).toHaveFocus();
        expect(focus).toHaveBeenCalledTimes(1);

        handle().blur();
        expect(getList()).not.toContainElement(document.activeElement as HTMLElement);
        expect(blur).toHaveBeenCalledTimes(1);
    });

    it('禁用时的 focus 方法', () => {
        const { handle } = renderRating({ disabled: true });
        handle().focus();
        expect(document.body).toHaveFocus();
    });

    it('数字形式的自定义 size', () => {
        renderRating({ size: 24 });
        const star = document.querySelector(`li.${prefixCls}-star`);
        expect(star).toHaveStyle({ width: '24px', height: '24px', fontSize: '24px' });
        expect(document.querySelector(`.${prefixCls}-star-default`)).toBeNull();
    });

    it('纯文本 #character 作为 aria 标签的单位', () => {
        render({
            render: () => <ConfigProvider locale={en_US}>{() => <Character text="心" defaultValue={3} />}</ConfigProvider>,
        });
        expect(getList()).toHaveAttribute('aria-label', 'Rating: 3 of 5 心,');
        expect(getRadio('3 心')).toHaveAttribute('aria-checked', 'true');
    });

    it('aria-describedby 属性', () => {
        renderRating({ 'aria-describedby': 'rating-desc' });
        expect(getList()).toHaveAttribute('aria-describedby', 'rating-desc');
    });

    it('列表是带有表单字段 aria 属性的 radiogroup', () => {
        renderRating({ 'aria-errormessage': 'error-msg', 'aria-invalid': true, 'aria-required': true });
        expect(screen.getByRole('radiogroup')).toBe(getList());
        expect(getList()).toHaveAttribute('aria-required', 'true');
        expect(getList()).toHaveAttribute('aria-invalid', 'true');
        expect(getList()).toHaveAttribute('aria-errormessage', 'error-msg');
    });

    it('click 回调带星的序号，且 change 照常触发', async () => {
        const click = vi.fn<OnClick>();
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 2, onChange: change, onClick: click });
        await userEvent.click(getRadios()[0] as HTMLElement);
        expect(click).toHaveBeenCalledTimes(1);
        expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
        expect(click.mock.calls[0]?.[1]).toBe(0);
        expect(change).toHaveBeenCalledWith(1);
    });

    it('Enter 选中时 click 收到 KeyboardEvent 与序号', async () => {
        const click = vi.fn<OnClick>();
        renderRating({ defaultValue: 2, onClick: click });
        await fireEvent.keyDown(getRadio('4 stars'), { key: 'Enter' });
        expect(click).toHaveBeenCalledTimes(1);
        expect(click.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
        expect(click.mock.calls[0]?.[1]).toBe(3);
    });

    it('禁用状态阻止交互', async () => {
        const change = vi.fn<OnValue>();
        const hoverChange = vi.fn<OnHover>();
        renderRating({ defaultValue: 2, disabled: true, onChange: change, onHoverChange: hoverChange });
        await userEvent.click(getRadios()[0] as HTMLElement);
        await fireEvent.keyDown(getRadios()[0] as HTMLElement, { key: 'Enter' });
        await keyOnList('ArrowRight');
        expect(change).not.toHaveBeenCalled();
        expect(hoverChange).not.toHaveBeenCalled();
        expectValue(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('star item 按 Enter 选中', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 2, onChange: change });
        await fireEvent.keyDown(getRadios()[0] as HTMLElement, { key: 'Enter' });
        expectValue(1);
        expect(change).toHaveBeenCalledWith(1);
    });

    it('Space 选中未选中的星，在已选中的星上不清除', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 2, onChange: change });
        await fireEvent.keyDown(getRadio('4 stars'), { key: ' ' });
        expectValue(4);
        expect(change).toHaveBeenCalledWith(4);
        await fireEvent.keyDown(getRadio('4 stars'), { key: ' ' });
        expectValue(4);
        expect(change).toHaveBeenCalledTimes(1);
    });

    it('star item 悬停触发 hoverChange', async () => {
        const hoverChange = vi.fn<OnHover>();
        renderRating({ onHoverChange: hoverChange });
        await fireEvent.mouseMove(getRadios()[2] as HTMLElement);
        expect(hoverChange).toHaveBeenCalledWith(3);
        expect(getFullStars()).toHaveLength(3);
        expectValue(0);
    });

    it('allowClear 为 false 时，第二次点击不清空', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 2, allowClear: false, onChange: change });
        await userEvent.click(getRadios()[1] as HTMLElement);
        expectValue(2);
        expect(change).toHaveBeenCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('value 为 0 时显示空星', () => {
        renderRating({ defaultValue: 0 });
        expectValue(0);
        expect(getFullStars()).toHaveLength(0);
        expect(getRadio('0 stars')).toHaveAttribute('aria-checked', 'true');
    });

    it('value 为 1 时列表名称用单数单位', () => {
        renderRating({ defaultValue: 1 });
        expect(getList().getAttribute('aria-label')).toContain('1 of 5 star,');
    });

    it('Tab 进入与离开空星', async () => {
        renderRating({ defaultValue: 0 });
        await userEvent.tab();
        expect(getRadio('0 stars')).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('allowHalf 下半星值的 Tab 停靠点', () => {
        renderRating({ defaultValue: 2.5, allowHalf: true });
        expectValue(2.5);
        expect(getHalfStars()).toHaveLength(1);
        expect(getRadio('2.5 stars')).toHaveAttribute('tabindex', '0');
    });

    it('边界处的键盘导航', async () => {
        renderRating({ defaultValue: 5 });
        await keyOnList('ArrowRight');
        expectValue(0);
        expect(getRadio('0 stars')).toHaveFocus();
    });

    it('0 边界处的键盘导航', async () => {
        renderRating({ defaultValue: 1 });
        await keyOnList('ArrowLeft');
        expectValue(0);
        await keyOnList('ArrowLeft');
        expectValue(5);
        expect(getRadio('5 stars')).toHaveFocus();
    });

    it('tooltips 为空数组', async () => {
        const hoverChange = vi.fn<OnHover>();
        renderRating({ tooltips: [], onHoverChange: hoverChange });
        expect(getList().querySelectorAll(`:scope > li.${prefixCls}-star`)).toHaveLength(6);
        await fireEvent.mouseMove(getRadios()[1] as HTMLElement);
        expect(hoverChange).toHaveBeenCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('清除后指针停在原星上不再预览', async () => {
        const hoverChange = vi.fn<OnHover>();
        renderRating({ defaultValue: 2, allowClear: true, onHoverChange: hoverChange });
        await fireEvent.click(getRadios()[1] as HTMLElement);
        expectValue(0);
        expect(hoverChange).toHaveBeenCalledTimes(1);
        expect(hoverChange).toHaveBeenLastCalledWith(undefined);

        await fireEvent.mouseMove(getRadios()[1] as HTMLElement);
        expect(hoverChange).toHaveBeenCalledTimes(1);
        expect(getFullStars()).toHaveLength(0);

        await fireEvent.mouseMove(getRadios()[2] as HTMLElement);
        expect(hoverChange).toHaveBeenLastCalledWith(3);
    });

    it('allowHalf 时 Tab 聚焦选中星的左半边', async () => {
        renderRating({ defaultValue: 2.5, allowHalf: true });
        const firstHalf = getRadio('2.5 stars');
        expect(firstHalf).toHaveClass(`${prefixCls}-star-first`);
        await userEvent.tab();
        expect(firstHalf).toHaveFocus();
    });

    it('allowHalf 时 Tab 聚焦选中星的右半边', async () => {
        renderRating({ defaultValue: 3, allowHalf: true });
        const secondHalf = getRadio('3 stars');
        expect(secondHalf).toHaveClass(`${prefixCls}-star-second`);
        await userEvent.tab();
        expect(secondHalf).toHaveFocus();
    });

    it('第一个星的 focus', () => {
        const focus = vi.fn<OnFocus>();
        renderRating({ defaultValue: 2.5, allowHalf: true, onFocus: focus });
        getRadio('2.5 stars').focus();
        expect(focus).toHaveBeenCalledTimes(1);
    });

    it('第一个星的 blur', () => {
        const blur = vi.fn<OnFocus>();
        renderRating({ defaultValue: 2.5, allowHalf: true, onBlur: blur });
        const firstHalf = getRadio('2.5 stars');
        firstHalf.focus();
        expect(blur).not.toHaveBeenCalled();
        firstHalf.blur();
        expect(blur).toHaveBeenCalledTimes(1);
    });

    it('autofocus 时半星值聚焦左半边，整星值聚焦右半边', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = renderRating({ autofocus: true, defaultValue: 2.5, allowHalf: true });
        expect(focus.mock.contexts).toEqual([getRadio('2.5 stars')]);
        view.unmount();

        focus.mockClear();
        renderRating({ autofocus: true, defaultValue: 3, allowHalf: true });
        expect(focus.mock.contexts).toEqual([getRadio('3 stars')]);
    });

    it('方向键移到半星值时聚焦该星的左半边', async () => {
        renderRating({ defaultValue: 2, allowHalf: true });
        await keyOnList('ArrowRight');
        const firstHalf = getRadio('2.5 stars');
        expect(firstHalf).toHaveFocus();
        expect(firstHalf).toHaveClass(`${prefixCls}-star-first`);
        expect(firstHalf).toHaveAttribute('aria-checked', 'true');
    });

    it('方向键移到整星值时聚焦该星的右半边', async () => {
        renderRating({ defaultValue: 2.5, allowHalf: true });
        await keyOnList('ArrowRight');
        const secondHalf = getRadio('3 stars');
        expect(secondHalf).toHaveFocus();
        expect(secondHalf).toHaveClass(`${prefixCls}-star-second`);
        expect(secondHalf).toHaveAttribute('aria-checked', 'true');
    });

    it('半星 radio 的名称、位置与选中状态', () => {
        renderRating({ defaultValue: 2.5, allowHalf: true });
        const firstHalves = getRadios().filter((radio) => radio.classList.contains(`${prefixCls}-star-first`));
        expect(firstHalves).toHaveLength(5);
        firstHalves.forEach((radio, index) => {
            expect(radio).toHaveAttribute('aria-label', `${index + 0.5} stars`);
            expect(radio).toHaveAttribute('aria-posinset', String(2 * index + 1));
            expect(radio).toHaveAttribute('aria-setsize', '11');
            expect(radio).toHaveAttribute('aria-checked', String(index === 2));
        });
    });

    it('整星 radio 的名称、位置与选中状态，空星是最后一个 radio', () => {
        renderRating({ defaultValue: 3, allowHalf: true });
        const secondHalves = getRadios().filter((radio) => radio.classList.contains(`${prefixCls}-star-second`));
        secondHalves.slice(0, 5).forEach((radio, index) => {
            expect(radio).toHaveAttribute('aria-label', `${index + 1} star${index === 0 ? '' : 's'}`);
            expect(radio).toHaveAttribute('aria-posinset', String(2 * (index + 1)));
            expect(radio).toHaveAttribute('aria-setsize', '11');
            expect(radio).toHaveAttribute('aria-checked', String(index === 2));
        });
        const empty = getRadio('0 stars');
        expect(empty).toBe(secondHalves[5]);
        expect(empty).toHaveAttribute('aria-posinset', '11');
        expect(empty).toHaveAttribute('aria-setsize', '11');
    });

    it('star item 设置 preventScroll 属性', async () => {
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
        renderRating({ defaultValue: 2.5, allowHalf: true, preventScroll: true });
        await keyOnList('ArrowRight');
        expect(getRadio('3 stars')).toHaveFocus();
        expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });
    });

    it('只有选中的 radio 是 Tab 停靠点', () => {
        renderRating({ defaultValue: 2.5, allowHalf: true });
        const tabbable = getRadios().filter((radio) => radio.getAttribute('tabindex') === '0');
        expect(tabbable).toEqual([getRadio('2.5 stars')]);
    });

    it('值不落在任何 radio 上时，第一个 radio 是 Tab 停靠点', async () => {
        const view = renderRating({ defaultValue: 2.5 });
        const tabbable = () => getRadios().filter((radio) => radio.getAttribute('tabindex') === '0');
        expect(tabbable()).toEqual([getRadio('1 star')]);
        await userEvent.tab();
        expect(getRadio('1 star')).toHaveFocus();
        view.unmount();

        renderRating({ defaultValue: 3.65, allowHalf: true });
        expect(tabbable()).toEqual([getRadio('0.5 stars')]);
    });

    it('禁用的 star item tabindex 为 -1', () => {
        renderRating({ defaultValue: 3, disabled: true });
        const radios = getRadios();
        expect(radios).toHaveLength(6);
        radios.forEach((radio) => {
            expect(radio).toHaveAttribute('tabindex', '-1');
            expect(radio).toHaveAttribute('aria-disabled', 'true');
        });
    });

    it('未声明的属性透传到根元素，click 只由 foundation 带序号触发一次', async () => {
        const click = vi.fn<OnClick>();
        renderRating({ 'data-x': '1', title: 'score', onClick: click });
        expect(getList()).toHaveAttribute('title', 'score');
        expect(getList()).toHaveAttribute('data-x', '1');
        await userEvent.click(getRadios()[2] as HTMLElement);
        expect(click).toHaveBeenCalledTimes(1);
        expect(click.mock.calls[0]?.[1]).toBe(2);
    });

    it('位于 Tooltip 中的 rating 由 tooltip 描述，列表不成为 Tab 停靠点', async () => {
        render(InTooltip);
        expect(getList()).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(getRadio('0 星')).toHaveFocus();
        await waitFor(() => expect(getList()).toHaveAccessibleDescription());
    });
});

describe('Rating 的 Tab 停靠点', () => {
    it('tooltips: radiogroup 只在选中的 radio 上保留一个 Tab 停靠点', async () => {
        renderRating({ defaultValue: 2, tooltips });
        await userEvent.tab();
        expect(document.activeElement).toHaveAttribute('role', 'radio');
        expect(document.activeElement).toBeChecked();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('tooltips: tooltip 描述获得焦点的 radio，该 radio 保留自己的名称', async () => {
        renderRating({ defaultValue: 2, tooltips });
        await userEvent.tab();
        const radio = document.activeElement as HTMLElement;
        await fireEvent.mouseMove(radio);
        await waitFor(() => expect(radio).toHaveAccessibleDescription('bad'));
        expect(radio).toHaveAccessibleName('2 stars');
    });

    it('tooltips: 键盘焦点显示所聚焦星星的 tooltip，方向键随之移动', async () => {
        renderRating({ defaultValue: 2, tooltips });
        await userEvent.tab();
        const radio = document.activeElement;
        await waitFor(() => expect(radio).toHaveAccessibleDescription('bad'));
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(document.activeElement).toHaveAccessibleDescription('normal'));
        await waitFor(() => {
            endLeaveAnimations();
            expect(document.body).not.toHaveTextContent('bad');
        });
        await userEvent.tab();
        await waitFor(() => {
            endLeaveAnimations();
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull();
        });
    });
});

describe('Rating（Vue）', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('v-model 跟随点击、Enter 与方向键', async () => {
        const change = vi.fn<OnValue>();
        render(Model, { props: { onChange: change } });
        const output = () => screen.getByRole('status');
        await userEvent.click(getRadios()[3] as HTMLElement);
        expect(output()).toHaveTextContent('4');
        await fireEvent.keyDown(getRadios()[1] as HTMLElement, { key: 'Enter' });
        expect(output()).toHaveTextContent('2');
        await keyOnList('ArrowRight');
        expect(output()).toHaveTextContent('3');
        expect(getRadios()[2]).toHaveAttribute('aria-checked', 'true');
        expect(change.mock.calls).toEqual([[4], [2], [3]]);
    });

    it('单向绑定时点击只报告新值，选中项与 Tab 停靠点不变', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ modelValue: 2, onChange: change });
        await userEvent.click(getRadios()[3] as HTMLElement);
        expect(change).toHaveBeenCalledWith(4);
        expectValue(2);
        expect(getRadio('2 stars')).toHaveAttribute('aria-checked', 'true');
        expect(getRadio('2 stars')).toHaveAttribute('tabindex', '0');
        expect(getRadio('4 stars')).toHaveAttribute('tabindex', '-1');
    });

    it('读取 semiGlobal.config.overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Rating: { count: 3, allowHalf: true, size: 'small' } };
        const view = renderRating();
        expect(getRadios()).toHaveLength(7);
        expect(document.querySelector(`.${prefixCls}-star-small`)).not.toBeNull();
        view.unmount();

        renderRating({ count: 4, allowHalf: false });
        expect(getRadios()).toHaveLength(5);
    });

    it('读取 app 注入的全局默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Rating: { count: 2, defaultValue: 1 } };
        render(Rating, { global: { provide: { [semiGlobalKey]: semi } } });
        expect(getRadios()).toHaveLength(3);
        expect(getRadios()[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('data-*、aria-labelledby 与 id 落在列表上，name 被丢弃', () => {
        renderRating({ 'data-kind': 'score', 'aria-labelledby': 'label', id: 'score', name: 'score' });
        expect(getList()).toHaveAttribute('data-kind', 'score');
        expect(getList()).toHaveAttribute('aria-labelledby', 'label');
        expect(getList()).toHaveAttribute('id', 'score');
        expect(document.querySelector('[name]')).toBeNull();
    });

    it('禁用时 Item 的 radio 获得焦点不上报 radioFocus', async () => {
        const props = {
            value: 2,
            displayValue: 2,
            index: 2,
            prefixCls: 'p',
            allowHalf: false,
            count: 5,
            size: 'default' as const,
        };
        const disabled = render(RatingItem, { props: { ...props, disabled: true } });
        await fireEvent.focus(screen.getByRole('radio'));
        expect(disabled.emitted()).not.toHaveProperty('radioFocus');
        disabled.unmount();

        const enabled = render(RatingItem, { props: { ...props, disabled: false } });
        await fireEvent.focus(screen.getByRole('radio'));
        expect(enabled.emitted()).toHaveProperty('radioFocus');
    });

    it('值不落在任何 radio 上时 autofocus 与 focus() 聚焦同一个 radio', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const first = renderRating({ autofocus: true, defaultValue: 2.5 });
        const autofocused = focus.mock.contexts.at(-1);
        expect(autofocused).toHaveAttribute('tabindex', '0');
        focus.mockClear();
        first.handle().focus();
        expect(focus.mock.contexts.at(-1)).toBe(autofocused);
    });

    it('节点 #character 渲染在每颗星的半星与整星两处，名称用语言包单位', () => {
        render({
            render: () => <ConfigProvider locale={en_US}>{() => <Character node allowHalf defaultValue={3} />}</ConfigProvider>,
        });
        expect(document.querySelectorAll('.custom-char')).toHaveLength(11);
        expect(getRadio('3 stars')).toHaveAttribute('aria-checked', 'true');
        expect(getList()).toHaveAttribute('aria-label', 'Rating: 3 of 5 stars,');
    });
});

describe('Rating 的 ul 事件、非指针激活与修饰键', () => {
    it('使用方传入的 mouseleave 监听在指针离开时调用，禁用时也一样', async () => {
        const onMouseleave = vi.fn<(event: MouseEvent) => void>();
        const { state } = renderRating({ onMouseleave });
        await fireEvent.mouseLeave(getList());
        expect(onMouseleave).toHaveBeenCalledTimes(1);
        state.disabled = true;
        await nextTick();
        await fireEvent.mouseLeave(getList());
        expect(onMouseleave).toHaveBeenCalledTimes(2);
    });

    it('悬停中途被禁用后指针离开仍复位悬停，重新启用时不残留', async () => {
        const hoverChange = vi.fn<OnHover>();
        const { state } = renderRating({ defaultValue: 1, onHoverChange: hoverChange });
        await fireEvent.mouseMove(getRadios()[3] as HTMLElement);
        expect(getFullStars()).toHaveLength(4);
        state.disabled = true;
        await nextTick();
        await fireEvent.mouseLeave(getList());
        expect(hoverChange).toHaveBeenLastCalledWith(undefined);
        state.disabled = false;
        await nextTick();
        expect(getFullStars()).toHaveLength(1);
    });

    it('键盘聚焦中被禁用后焦点离开仍清除聚焦星，重新启用时 tooltip 不残留', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        const state = reactive<Props>({ count: 3, defaultValue: 1, tooltips: ['差', '中', '好'], onBlur: blur });
        render({
            render: () => (
                <ConfigProvider locale={en_US}>
                    {() => (
                        <>
                            <Rating {...state} />
                            <button>after</button>
                        </>
                    )}
                </ConfigProvider>
            ),
        });
        await userEvent.tab();
        expect(await screen.findByText('差')).toBeInTheDocument();
        state.disabled = true;
        await nextTick();
        screen.getByRole('button', { name: 'after' }).focus();
        await nextTick();
        expect(blur).toHaveBeenCalledTimes(1);
        state.disabled = false;
        await nextTick();
        expect(screen.queryByText('差')).toBeNull();
    });

    it('tooltips 短于 count 时悬停没有文案的星不显示空气泡', async () => {
        renderRating({ tooltips: ['差', '中', '好'] });
        await fireEvent.mouseMove(getRadios()[3] as HTMLElement);
        await nextTick();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull();
        expect(getRadios()[3]).not.toHaveAttribute('aria-describedby');
    });

    it('allowHalf 时悬停在左半星上显示该星的 tooltip', async () => {
        renderRating({ allowHalf: true, tooltips: ['差', '中', '好'] });
        // jsdom stars have no width, so a pointer left of the star's origin is its left half
        await fireEvent.mouseMove(getRadios()[1] as HTMLElement, { clientX: -1 });
        expect(await screen.findByText('差')).toBeInTheDocument();
    });

    it('非指针激活空星得到 0 而不是 count + 1', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ defaultValue: 3, onChange: change });
        await fireEvent.click(getRadio('0 stars'));
        expect(change).toHaveBeenLastCalledWith(0);
        expectValue(0);
    });

    it('allowHalf 时非指针激活半星 radio 得到该 radio 的值', async () => {
        const change = vi.fn<OnValue>();
        renderRating({ allowHalf: true, defaultValue: 1, onChange: change });
        await fireEvent.click(getRadio('2.5 stars'));
        expect(change).toHaveBeenLastCalledWith(2.5);
        expectValue(2.5);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不改值、不移焦、不触发 keydown', async (modifier) => {
        const change = vi.fn<OnValue>();
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        renderRating({ defaultValue: 3, onChange: change, onKeydown: keydown });
        const radio = getRadio('3 stars');
        radio.focus();
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', [modifier]: true, bubbles: true, cancelable: true });
        radio.dispatchEvent(event);
        await nextTick();
        expect(event.defaultPrevented).toBe(false);
        expect(change).not.toHaveBeenCalled();
        expect(keydown).not.toHaveBeenCalled();
        expect(radio).toHaveFocus();
        expectValue(3);
    });
});
