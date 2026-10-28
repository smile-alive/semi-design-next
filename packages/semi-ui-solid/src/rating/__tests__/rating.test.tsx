import { type JSX, createSignal, onMount } from 'solid-js';
import { fireEvent, render as renderWithLibrary, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { endLeaveAnimations } from '@test/utils/solid';
import Rating, { type RatingProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import Tooltip from '../../tooltip';

type RatingCallback<K extends keyof RatingProps> = NonNullable<RatingProps[K]>;

// the assertions below spell the English names the en_US pack gives the stars
const render = (ui: () => JSX.Element) => renderWithLibrary(() => <LocaleProvider locale={en_US}>{ui()}</LocaleProvider>);

const prefixCls = `${BASE_CLASS_PREFIX}-rating`;

const getList = () => document.querySelector<HTMLUListElement>(`ul.${prefixCls}`) as HTMLUListElement;
const getRadios = () => screen.getAllByRole('radio');
const getFullStars = () => document.querySelectorAll(`.${prefixCls}-star-full`);
const getHalfStars = () => document.querySelectorAll(`.${prefixCls}-star-half`);
const tabStops = () => getRadios().filter((radio) => radio.getAttribute('tabindex') === '0');
// the list's aria-label summarizes the committed value in text
const expectValue = (value: number, count = 5) => expect(getList()).toHaveAttribute('aria-label', `Rating: ${value} of ${count} star${value === 1 ? '' : 's'},`);

describe('Rating', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style 落在根 ul', () => {
        render(() => <Rating class="test" style={{ color: 'red' }} />);
        const list = document.querySelector(`.${prefixCls}.test`);
        expect(list).toBe(getList());
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('count 决定星数，另有一颗空星', () => {
        render(() => <Rating count={10} />);
        expect(getList().children).toHaveLength(11);
        expect(getRadios()).toHaveLength(11);
    });

    it('count 变化时增减星', () => {
        const [count, setCount] = createSignal(3);
        render(() => <Rating count={count()} defaultValue={2} />);
        expect(getRadios()).toHaveLength(4);
        setCount(5);
        expect(getRadios()).toHaveLength(6);
        expect(screen.getByRole('radio', { name: '0 stars' })).toBe(getRadios()[5]);
        expect(screen.getByRole('radio', { name: '4 stars' })).toBeInTheDocument();
    });

    it('不同尺寸与数字尺寸', () => {
        const { unmount } = render(() => <Rating size="small" />);
        expect(document.querySelector(`.${prefixCls}-star-small`)).not.toBeNull();
        unmount();

        const second = render(() => <Rating />);
        expect(document.querySelector(`.${prefixCls}-star-default`)).not.toBeNull();
        second.unmount();

        render(() => <Rating size={24} />);
        expect(document.querySelector(`li.${prefixCls}-star`)).toHaveStyle({ width: '24px', height: '24px', fontSize: '24px' });
        expect(document.querySelector(`.${prefixCls}-star-default`)).toBeNull();
    });

    it('defaultValue 决定初始星数与选中的 radio', () => {
        render(() => <Rating defaultValue={4} />);
        expectValue(4);
        expect(getFullStars()).toHaveLength(4);
        expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'true');
    });

    it('disabled 加类名，radio 退出 Tab 顺序并标记 aria-disabled', () => {
        render(() => <Rating defaultValue={3} disabled />);
        expect(getList()).toHaveClass(`${prefixCls}-disabled`);
        getRadios().forEach((radio) => {
            expect(radio).toHaveAttribute('tabindex', '-1');
            expect(radio).toHaveAttribute('aria-disabled', 'true');
        });
    });

    it('allowHalf 显示半星', () => {
        render(() => <Rating defaultValue={3.5} allowHalf />);
        expectValue(3.5);
        expect(getFullStars()).toHaveLength(3);
        expect(getHalfStars()).toHaveLength(1);
        expect(screen.getByRole('radio', { name: '3.5 stars' })).toHaveAttribute('aria-checked', 'true');
    });

    it('自定义字符，两个半边各有一份', () => {
        render(() => <Rating character={<b>赞</b>} allowHalf />);
        const star = document.querySelector(`li.${prefixCls}-star`) as HTMLElement;
        expect(star.querySelectorAll('b')).toHaveLength(2);
        expect(star.querySelector(`.${prefixCls}-star-second`)).toHaveTextContent(/^赞$/);
    });

    it('字符串 character 作为单位写入名称', () => {
        render(() => <Rating defaultValue={3} character="心" />);
        expect(getList()).toHaveAttribute('aria-label', 'Rating: 3 of 5 心,');
        expect(screen.getByRole('radio', { name: '3 心' })).toHaveAttribute('aria-checked', 'true');
    });

    it('自定义单位在其他语言下不追加英文复数 s', () => {
        renderWithLibrary(() => (
            <LocaleProvider locale={zh_CN}>
                <Rating defaultValue={3} character="心" />
            </LocaleProvider>
        ));
        expect(getList()).toHaveAttribute('aria-label', '评分：3 / 5 心，');
        expect(screen.getByRole('radio', { name: '3 心' })).toBeInTheDocument();
    });

    it('单位里的 $& 按原文写入名称，不当作替换模式', () => {
        renderWithLibrary(() => (
            <LocaleProvider locale={zh_CN}>
                <Rating defaultValue={3} character="$&" />
            </LocaleProvider>
        ));
        expect(getList()).toHaveAttribute('aria-label', '评分：3 / 5 $&，');
        expect(screen.getByRole('radio', { name: '3 $&' })).toBeInTheDocument();
    });

    it('点击选中并报告 onChange 与 onClick', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        const onClick = vi.fn<RatingCallback<'onClick'>>();
        render(() => <Rating defaultValue={3} onChange={onChange} onClick={onClick} />);
        await userEvent.click(getRadios()[0]);
        expectValue(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.anything(), 0);
    });

    it('受控 value：单向绑定，不随点击移动', async () => {
        const [value, setValue] = createSignal<number | undefined>(2);
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating value={value()} onChange={onChange} />);
        expectValue(2);
        expect(getFullStars()).toHaveLength(2);
        setValue(5);
        expectValue(5);
        expect(getFullStars()).toHaveLength(5);
        await userEvent.click(getRadios()[0]);
        expect(onChange).toHaveBeenLastCalledWith(1);
        expectValue(5);
    });

    it('受控 value 变回 undefined 时回到 defaultValue，之后非受控', async () => {
        const [value, setValue] = createSignal<number | undefined>(3);
        render(() => <Rating defaultValue={1} value={value()} />);
        expectValue(3);
        setValue(undefined);
        expectValue(1);
        expect(screen.getByRole('radio', { name: '1 star' })).toBeChecked();
        await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
        expectValue(4);
    });

    it('父组件挂载时就把 value 改为 undefined，回到 defaultValue', () => {
        function Demo() {
            const [value, setValue] = createSignal<number | undefined>(3);
            onMount(() => setValue(undefined));
            return <Rating defaultValue={1} value={value()} />;
        }
        render(() => <Demo />);
        expectValue(1);
    });

    it('onHoverChange 随指针移动与离开', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(() => <Rating onHoverChange={onHoverChange} />);
        fireEvent.mouseMove(getRadios()[1]);
        expect(onHoverChange).toHaveBeenLastCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
        expectValue(0);

        fireEvent.mouseLeave(getList());
        expect(onHoverChange).toHaveBeenCalledTimes(2);
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
        expect(getFullStars()).toHaveLength(0);
    });

    it('allowHalf 时悬停在星的左半边得到半星值', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(() => <Rating allowHalf onHoverChange={onHoverChange} />);
        // jsdom stars have no width, so a pointer left of the star's origin is its left half
        const firstHalf = screen.getByRole('radio', { name: '1.5 stars' });
        fireEvent.mouseMove(firstHalf, { clientX: -1 });
        expect(onHoverChange).toHaveBeenLastCalledWith(1.5);
        fireEvent.mouseMove(firstHalf, { clientX: 1 });
        expect(onHoverChange).toHaveBeenLastCalledWith(2);
    });

    it('悬停不改变 aria-checked 与 Tab 停靠点', () => {
        render(() => <Rating defaultValue={2} />);
        fireEvent.mouseMove(getRadios()[3]);
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'false');
        expect(tabStops()).toEqual([screen.getByRole('radio', { name: '2 stars' })]);
        expect(getFullStars()).toHaveLength(4);
    });

    it('allowClear：再次点击当前值清空，之后停留的星不再预览', async () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(() => <Rating defaultValue={2} onHoverChange={onHoverChange} />);
        fireEvent.click(getRadios()[1]);
        expectValue(0);
        expect(onHoverChange).toHaveBeenCalledTimes(1);
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);

        // the just-cleared value is not previewed again while the pointer stays on it
        fireEvent.mouseMove(getRadios()[1]);
        expect(onHoverChange).toHaveBeenCalledTimes(1);
        expect(getFullStars()).toHaveLength(0);

        fireEvent.mouseMove(getRadios()[2]);
        expect(onHoverChange).toHaveBeenLastCalledWith(3);
    });

    it('allowClear 为 false 时再次点击不清空', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating defaultValue={2} allowClear={false} onChange={onChange} />);
        await userEvent.click(getRadios()[1]);
        expectValue(2);
        expect(onChange).toHaveBeenCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('多次点击在选中与清空之间切换', async () => {
        render(() => <Rating />);
        await userEvent.click(getRadios()[1]);
        expect(getFullStars()).toHaveLength(2);
        await userEvent.click(getRadios()[1]);
        expect(getFullStars()).toHaveLength(0);
        await userEvent.click(getRadios()[1]);
        expect(getFullStars()).toHaveLength(2);
    });

    it('禁用时不响应点击与悬停', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(() => <Rating defaultValue={2} disabled onChange={onChange} onHoverChange={onHoverChange} />);
        await userEvent.click(getRadios()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onHoverChange).not.toHaveBeenCalled();
        expectValue(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('指针离开时用户的 onMouseLeave 也被调用，禁用时也一样', () => {
        const onMouseLeave = vi.fn<() => void>();
        const [disabled, setDisabled] = createSignal(false);
        render(() => <Rating disabled={disabled()} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseLeave(getList());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        setDisabled(true);
        fireEvent.mouseLeave(getList());
        expect(onMouseLeave).toHaveBeenCalledTimes(2);
    });

    it('悬停中途被禁用后指针离开仍复位悬停，重新启用时不残留', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        const [disabled, setDisabled] = createSignal(false);
        render(() => <Rating defaultValue={1} disabled={disabled()} onHoverChange={onHoverChange} />);
        fireEvent.mouseMove(getRadios()[3]);
        expect(getFullStars()).toHaveLength(4);
        setDisabled(true);
        fireEvent.mouseLeave(getList());
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
        setDisabled(false);
        expect(getFullStars()).toHaveLength(1);
    });

    it('onFocus 与 onBlur 只在焦点进入或离开整个控件时触发', async () => {
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(() => (
            <>
                <Rating defaultValue={2} onBlur={onBlur} onFocus={onFocus} />
                <button type="button">after</button>
            </>
        ));
        await userEvent.tab();
        expect(getRadios()[1]).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(getRadios()[3]).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(screen.getByRole('button')).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('allowHalf 时第一个半边的 focus 与 blur 各触发一次', () => {
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(() => <Rating defaultValue={2.5} allowHalf onBlur={onBlur} onFocus={onFocus} />);
        const firstHalf = screen.getByRole('radio', { name: '2.5 stars' });
        firstHalf.focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        firstHalf.blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('方向键移动值与焦点，并报告 onKeyDown', () => {
        const onKeyDown = vi.fn<RatingCallback<'onKeyDown'>>();
        const { unmount } = render(() => <Rating defaultValue={2} onKeyDown={onKeyDown} />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(1);
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(2);
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
        expect(onKeyDown).toHaveBeenCalledTimes(2);
        unmount();

        render(() => <Rating defaultValue={2.5} allowHalf />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(2);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(3);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
    });

    it('Down 选中下一个、Up 选中上一个，RTL 下上下方向不镜像', () => {
        const { unmount } = render(() => <Rating defaultValue={2} />);
        fireEvent.keyDown(getList(), { key: 'ArrowDown' });
        expectValue(3);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        fireEvent.keyDown(getList(), { key: 'ArrowUp' });
        expectValue(2);
        unmount();

        render(() => (
            <ConfigProvider direction="rtl">
                <Rating defaultValue={2} />
            </ConfigProvider>
        ));
        fireEvent.keyDown(getList(), { key: 'ArrowDown' });
        expectValue(3);
        fireEvent.keyDown(getList(), { key: 'ArrowUp' });
        expectValue(2);
    });

    it('rtl 模式左右方向键镜像', () => {
        const { unmount } = render(() => (
            <ConfigProvider direction="rtl">
                <Rating defaultValue={2} />
            </ConfigProvider>
        ));
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(3);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(2);
        unmount();

        render(() => (
            <ConfigProvider direction="rtl">
                <Rating defaultValue={2.5} allowHalf />
            </ConfigProvider>
        ));
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(3);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(2);
    });

    it('边界处的键盘导航绕回', () => {
        const { unmount } = render(() => <Rating defaultValue={5} />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(0);
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveFocus();
        unmount();

        render(() => <Rating defaultValue={1} />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(0);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(5);
        expect(screen.getByRole('radio', { name: '5 stars' })).toHaveFocus();
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不改值、不移焦、不触发 onKeyDown', (modifier) => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        const onKeyDown = vi.fn<RatingCallback<'onKeyDown'>>();
        render(() => <Rating defaultValue={3} onChange={onChange} onKeyDown={onKeyDown} />);
        const radio = screen.getByRole('radio', { name: '3 stars' });
        radio.focus();
        expect(fireEvent.keyDown(radio, { key: 'ArrowLeft', [modifier]: true })).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
        expect(onKeyDown).not.toHaveBeenCalled();
        expect(radio).toHaveFocus();
        expectValue(3);
    });

    it('Enter 选中被按下的 radio，空星上得到 0', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating onChange={onChange} />);
        screen.getByRole('radio', { name: '0 stars' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange.mock.calls.every(([value]) => value <= 5)).toBe(true);
        expectValue(0);

        fireEvent.keyDown(getRadios()[0], { key: 'Enter' });
        expectValue(1);
        expect(onChange).toHaveBeenLastCalledWith(1);
    });

    it('allowHalf 时 Enter 选中半星，在已选半星上清除', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating defaultValue={1} allowHalf onChange={onChange} />);
        screen.getByRole('radio', { name: '2.5 stars' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(2.5);
        expectValue(2.5);
        await userEvent.keyboard('{Enter}');
        expectValue(0);
    });

    it('Space 选中获得焦点且未选中的星，在已选中的星上不清除', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating defaultValue={2} onChange={onChange} />);
        screen.getByRole('radio', { name: '4 stars' }).focus();
        await userEvent.keyboard(' ');
        expectValue(4);
        expect(onChange).toHaveBeenLastCalledWith(4);
        await userEvent.keyboard(' ');
        expectValue(4);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('非指针激活空星得到 0 而不是 count + 1', () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating defaultValue={3} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '0 stars' }));
        expect(onChange).toHaveBeenLastCalledWith(0);
        expectValue(0);
    });

    it('allowHalf 时非指针激活半星 radio 得到该 radio 的值', () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(() => <Rating defaultValue={1} allowHalf onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '2.5 stars' }));
        expect(onChange).toHaveBeenLastCalledWith(2.5);
        expectValue(2.5);
    });

    it('autofocus 聚焦选中的 radio，半星值聚焦左半边', () => {
        const { unmount } = render(() => <Rating autofocus />);
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveFocus();
        unmount();

        const second = render(() => <Rating autofocus defaultValue={2.5} allowHalf />);
        expect(screen.getByRole('radio', { name: '2.5 stars' })).toHaveFocus();
        second.unmount();

        render(() => <Rating autofocus defaultValue={3} allowHalf />);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
    });

    it('值不落在任何 radio 上时 Tab 停靠第一个 radio，autofocus 聚焦它', async () => {
        const { unmount } = render(() => <Rating defaultValue={2.5} />);
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
        expect(tabStops()).toHaveLength(1);
        unmount();

        const second = render(() => <Rating defaultValue={3.65} allowHalf />);
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '0.5 stars' })).toHaveFocus();
        second.unmount();

        render(() => <Rating autofocus defaultValue={2.5} />);
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
    });

    it('值落在两个 radio 之间时，方向键选中相邻的 radio', () => {
        const between = render(() => <Rating defaultValue={2.5} />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(3);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        between.unmount();

        const below = render(() => <Rating defaultValue={2.5} />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(2);
        below.unmount();

        render(() => <Rating defaultValue={3.65} allowHalf />);
        fireEvent.keyDown(getList(), { key: 'ArrowDown' });
        expectValue(4);
        fireEvent.keyDown(getList(), { key: 'ArrowUp' });
        expectValue(3.5);
        expect(screen.getByRole('radio', { name: '3.5 stars' })).toHaveFocus();
    });

    it('preventScroll 传给 focus', () => {
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
        render(() => <Rating defaultValue={2.5} allowHalf preventScroll />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });
        focusSpy.mockRestore();
    });

    it('Tab 进入与离开空星', async () => {
        render(() => <Rating defaultValue={0} />);
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('allowHalf 时 Tab 聚焦选中星对应的半边', async () => {
        const { unmount } = render(() => <Rating defaultValue={2.5} allowHalf />);
        const firstHalf = screen.getByRole('radio', { name: '2.5 stars' });
        expect(firstHalf).toHaveClass(`${prefixCls}-star-first`);
        await userEvent.tab();
        expect(firstHalf).toHaveFocus();
        unmount();

        render(() => <Rating defaultValue={3} allowHalf />);
        const secondHalf = screen.getByRole('radio', { name: '3 stars' });
        expect(secondHalf).toHaveClass(`${prefixCls}-star-second`);
        await userEvent.tab();
        expect(secondHalf).toHaveFocus();
    });

    it('allowHalf 的 radio 位置与集合大小', () => {
        render(() => <Rating defaultValue={2.5} allowHalf />);
        const firstHalves = getRadios().filter((radio) => radio.classList.contains(`${prefixCls}-star-first`));
        expect(firstHalves).toHaveLength(5);
        firstHalves.forEach((radio, index) => {
            expect(radio).toHaveAttribute('aria-label', `${index + 0.5} stars`);
            expect(radio).toHaveAttribute('aria-posinset', String(2 * index + 1));
            expect(radio).toHaveAttribute('aria-setsize', '11');
            expect(radio).toHaveAttribute('aria-checked', String(index === 2));
        });
        const empty = screen.getByRole('radio', { name: '0 stars' });
        expect(empty).toHaveAttribute('aria-setsize', '11');
        expect(empty).toHaveAttribute('aria-posinset', '11');
    });

    it('radiogroup 的名称、id 与表单字段 aria 属性', () => {
        render(() => <Rating id="my-rating" aria-label="评分" aria-describedby="desc" aria-errormessage="err" aria-invalid aria-required />);
        const group = screen.getByRole('radiogroup', { name: '评分' });
        expect(group).toBe(getList());
        expect(group).toHaveAttribute('id', 'my-rating');
        expect(group).toHaveAttribute('aria-describedby', 'desc');
        expect(group).toHaveAttribute('aria-errormessage', 'err');
        expect(group).toHaveAttribute('aria-invalid', 'true');
        expect(group).toHaveAttribute('aria-required', 'true');
        // the label names the radiogroup only; the items keep the locale unit
        expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: /评分/ })).not.toBeInTheDocument();
    });

    it('aria-labelledby 命名 radiogroup', () => {
        render(() => <Rating aria-labelledby="rating-label" />);
        expect(getList()).toHaveAttribute('aria-labelledby', 'rating-label');
    });

    it('tabIndex 被丢弃，列表保持 -1，只有选中的 radio 是 Tab 停靠点', () => {
        render(() => <Rating tabIndex={0} defaultValue={2} />);
        expect(getList()).toHaveAttribute('tabindex', '-1');
        expect(tabStops()).toEqual([screen.getByRole('radio', { name: '2 stars' })]);
    });

    it('未声明的属性落在根 ul，Form 注入的属性与 name 不落到 DOM', () => {
        const onClick = vi.fn<RatingCallback<'onClick'>>();
        const injected = { validateStatus: 'error', insetLabel: 'label', insetLabelId: 'label-id', name: 'score' };
        render(() => <Rating data-x="1" title="score" onClick={onClick} {...injected} />);
        expect(getList()).toHaveAttribute('title', 'score');
        expect(getList()).toHaveAttribute('data-x', '1');
        expect(getList()).not.toHaveAttribute('validatestatus');
        expect(getList()).not.toHaveAttribute('insetlabel');
        expect(getList()).not.toHaveAttribute('name');
    });

    it('ref 是根 ul', () => {
        let ref: HTMLUListElement | undefined;
        render(() => <Rating ref={(node) => (ref = node)} />);
        expect(ref).toBe(getList());
    });

    it('ref 的 focus 与 blur：focus 落到 Tab 停靠的 radio', () => {
        let ref!: HTMLUListElement;
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(() => <Rating ref={(node) => (ref = node)} defaultValue={3} onBlur={onBlur} onFocus={onFocus} />);
        ref.focus();
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);

        ref.blur();
        expect(document.body).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('禁用时 ref 的 focus 不聚焦任何元素', () => {
        let ref!: HTMLUListElement;
        render(() => <Rating ref={(node) => (ref = node)} disabled />);
        ref.focus();
        expect(getList()).not.toHaveFocus();
        expect(document.body).toHaveFocus();
    });

    it('值不落在任何 radio 上时 autofocus 与 ref 的 focus 都聚焦 Tab 停靠的 radio', () => {
        let ref!: HTMLUListElement;
        render(() => <Rating ref={(node) => (ref = node)} autofocus defaultValue={2.5} />);
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
        ref.blur();
        expect(document.body).toHaveFocus();
        ref.focus();
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
    });

    it('ref 的 focus 把 preventScroll 传给 radio', () => {
        let ref!: HTMLUListElement;
        render(() => <Rating ref={(node) => (ref = node)} preventScroll />);
        const empty = screen.getByRole('radio', { name: '0 stars' });
        const focusSpy = vi.spyOn(empty, 'focus');
        ref.focus();
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(empty).toHaveFocus();
    });

    it('使用方的 onFocusIn 与 onFocusOut 与组件自己的焦点处理同时生效', () => {
        const onFocusIn = vi.fn<(event: FocusEvent) => void>();
        const onFocusOut = vi.fn<(event: FocusEvent) => void>();
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(() => <Rating defaultValue={2} onFocusIn={onFocusIn} onFocusOut={onFocusOut} onFocus={onFocus} onBlur={onBlur} />);
        const radio = screen.getByRole('radio', { name: '2 stars' });
        radio.focus();
        expect(onFocusIn).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        radio.blur();
        expect(onFocusOut).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('读取全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Rating: { count: 3, allowHalf: true } };
        render(() => <Rating />);
        expect(getRadios()).toHaveLength(7);
    });
});

describe('Rating tooltips', () => {
    const tooltips = ['terrible', 'bad', 'normal', 'good', 'wonderful'];

    it('悬停显示该星的 tooltip，移动时星星保持挂载', async () => {
        render(() => <Rating tooltips={tooltips} />);
        expect(screen.queryByText('bad')).toBeNull();
        const stars = getRadios();
        fireEvent.mouseMove(stars[1]);
        expect(await screen.findByText('bad')).toBeInTheDocument();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(/^bad$/);
        fireEvent.mouseMove(stars[2]);
        expect(await screen.findByText('normal')).toBeInTheDocument();
        getRadios().forEach((radio, index) => expect(radio).toBe(stars[index]));
    });

    it('tooltips 为空数组时不显示气泡，星距结构不变', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(() => <Rating tooltips={[]} onHoverChange={onHoverChange} />);
        expect(getList().querySelectorAll(`:scope > li.${prefixCls}-star`)).toHaveLength(6);
        fireEvent.mouseMove(getRadios()[1]);
        expect(onHoverChange).toHaveBeenCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('tooltips 短于 count 时悬停没有文案的星不显示空气泡', async () => {
        render(() => <Rating tooltips={['差', '中', '好']} />);
        fireEvent.mouseMove(getRadios()[3]);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull());
        expect(getRadios()[3]).not.toHaveAttribute('aria-describedby');
    });

    it('allowHalf 时悬停在左半星上显示该星的 tooltip', async () => {
        render(() => <Rating allowHalf tooltips={['差', '中', '好']} />);
        fireEvent.mouseMove(screen.getByRole('radio', { name: '1.5 stars' }), { clientX: -1 });
        expect(await screen.findByText('中')).toBeInTheDocument();
        expect(screen.queryByText('差')).toBeNull();
    });

    it('radiogroup 只在选中的 radio 上保留一个 Tab 停靠点', async () => {
        render(() => <Rating defaultValue={2} tooltips={tooltips} />);
        await userEvent.tab();
        expect(document.activeElement).toHaveAttribute('role', 'radio');
        expect(document.activeElement).toBeChecked();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('tooltip 描述获得焦点的 radio，该 radio 保留自己的名称', async () => {
        render(() => <Rating defaultValue={2} tooltips={tooltips} />);
        await userEvent.tab();
        const radio = document.activeElement as HTMLElement;
        fireEvent.mouseMove(radio);
        await waitFor(() => expect(radio).toHaveAccessibleDescription('bad'));
        expect(radio).toHaveAccessibleName('2 stars');
    });

    it('键盘焦点显示所聚焦星星的 tooltip，方向键随之移动', async () => {
        render(() => <Rating defaultValue={2} tooltips={tooltips} />);
        await userEvent.tab();
        const radio = document.activeElement as HTMLElement;
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

    it('键盘聚焦中被禁用后焦点离开仍清除聚焦星，重新启用时 tooltip 不残留', async () => {
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        const [disabled, setDisabled] = createSignal(false);
        render(() => (
            <>
                <Rating defaultValue={1} disabled={disabled()} count={3} tooltips={['差', '中', '好']} onBlur={onBlur} />
                <button type="button">after</button>
            </>
        ));
        await userEvent.tab();
        expect(await screen.findByText('差')).toBeInTheDocument();
        setDisabled(true);
        screen.getByRole('button', { name: 'after' }).focus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        setDisabled(false);
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByText('差')).toBeNull();
        });
    });
});

describe('Rating 作为 Tooltip 触发器', () => {
    it('展开触发器属性后由 tooltip 描述，列表不是 Tab 停靠点', async () => {
        render(() => <Tooltip content="tip">{(getTriggerProps) => <Rating defaultValue={2} {...getTriggerProps()} />}</Tooltip>);
        expect(getList()).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
        await waitFor(() => expect(getList()).toHaveAccessibleDescription('tip'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('禁用的 Rating 被 Tooltip 的包裹元素接管', () => {
        render(() => (
            <Tooltip content="tip" trigger="click">
                <Rating defaultValue={2} disabled />
            </Tooltip>
        ));
        const wrapper = getList().closest(`.${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`) as HTMLElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('展开信号对象时，无关属性变化不重置非受控的值', async () => {
        const [props, setProps] = createSignal<RatingProps>({});
        render(() => <Rating {...props()} />);
        await userEvent.click(getRadios()[2]);
        await userEvent.unhover(getRadios()[2]);
        expect(getRadios()[2]).toBeChecked();
        setProps({ class: 'other' });
        expect(getList()).toHaveClass('other');
        expect(getRadios()[2]).toBeChecked();
    });
});
