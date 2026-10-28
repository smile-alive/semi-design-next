import { StrictMode, createRef, type ReactElement, type ReactNode } from 'react';
import { render as renderWithLibrary, screen, fireEvent, act, waitFor, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';

// the assertions below spell the English names the en_US pack gives the stars
function English({ children }: { children: ReactNode }) {
    return <LocaleProvider locale={en_US}>{children}</LocaleProvider>;
}
const render = (ui: ReactElement, options?: RenderOptions) => renderWithLibrary(ui, { wrapper: English, ...options });
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { ConfigProvider, Form, Tooltip } from '@fibrae/semi-ui-react';
import { endLeaveAnimations } from '@test/utils/react';
import Rating, { type RatingHandle, type RatingProps } from '../index';

type RatingCallback<K extends keyof RatingProps> = NonNullable<RatingProps[K]>;

const prefixCls = `${BASE_CLASS_PREFIX}-rating`;

const getList = () => document.querySelector<HTMLUListElement>(`ul.${prefixCls}`);
const getRadios = () => screen.getAllByRole('radio');
const getFullStars = () => document.querySelectorAll(`.${prefixCls}-star-full`);
const getHalfStars = () => document.querySelectorAll(`.${prefixCls}-star-half`);
// the list's aria-label summarizes the committed value in text
const expectValue = (value, count = 5) => expect(getList()).toHaveAttribute('aria-label', `Rating: ${value} of ${count} star${value === 1 ? '' : 's'},`);

describe('Rating 审计修复', () => {
    it('空星上按 Enter 不产生越界值', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating onChange={onChange} />);
        const empty = screen.getByRole('radio', { name: '0 stars' });
        empty.focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange.mock.calls.every(([value]) => value <= 5)).toBe(true);
        expectValue(0);
    });

    it('allowHalf 时在半星上按 Enter 选中半星', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={1} allowHalf onChange={onChange} />);
        screen.getByRole('radio', { name: '2.5 stars' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(2.5);
        expectValue(2.5);
    });

    it('allowHalf 时在已选半星上按 Enter 清除', async () => {
        render(<Rating defaultValue={2.5} allowHalf />);
        screen.getByRole('radio', { name: '2.5 stars' }).focus();
        await userEvent.keyboard('{Enter}');
        expectValue(0);
    });

    it('悬停不改变 aria-checked 与 Tab 停靠点', () => {
        render(<Rating defaultValue={2} />);
        fireEvent.mouseMove(getRadios()[3]);
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'false');
        expect(getRadios().filter((radio) => radio.getAttribute('tabindex') === '0')).toHaveLength(1);
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('tabindex', '0');
        expect(getFullStars()).toHaveLength(4);
    });

    it('自定义单位在其他语言下不追加英文复数 s', () => {
        renderWithLibrary(
            <LocaleProvider locale={zh_CN}>
                <Rating defaultValue={3} character="心" />
            </LocaleProvider>
        );
        expect(getList()).toHaveAttribute('aria-label', '评分：3 / 5 心，');
        expect(screen.getByRole('radio', { name: '3 心' })).toBeInTheDocument();
    });

    it('单位里的 $& 按原文写入名称，不当作替换模式', () => {
        renderWithLibrary(
            <LocaleProvider locale={zh_CN}>
                <Rating defaultValue={3} character="$&" />
            </LocaleProvider>
        );
        expect(getList()).toHaveAttribute('aria-label', '评分：3 / 5 $&，');
        expect(screen.getByRole('radio', { name: '3 $&' })).toBeInTheDocument();
    });
});

describe('Rating', () => {
    it('自定义 className 与 style', () => {
        render(<Rating className="test" style={{ color: 'red' }} />);
        const list = document.querySelector(`.${prefixCls}.test`);
        expect(list).not.toBeNull();
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('自定义 count', () => {
        render(<Rating count={10} />);
        expect(getList().children).toHaveLength(11);
        expect(getRadios()).toHaveLength(11);
    });

    it('不同尺寸', () => {
        const { unmount } = render(<Rating size="small" />);
        expect(document.querySelector(`.${prefixCls}-star-small`)).not.toBeNull();
        unmount();

        render(<Rating />);
        expect(document.querySelector(`.${prefixCls}-star-default`)).not.toBeNull();
    });

    it('defaultValue', () => {
        render(<Rating defaultValue={4} />);
        expectValue(4);
        expect(getFullStars()).toHaveLength(4);
        expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'true');
    });

    it('disabled', () => {
        render(<Rating defaultValue={3} disabled />);
        expect(getList()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('allowHalf', () => {
        render(<Rating defaultValue={3.5} allowHalf />);
        expectValue(3.5);
        expect(getFullStars()).toHaveLength(3);
        expect(getHalfStars()).toHaveLength(1);
        expect(screen.getByRole('radio', { name: '3.5 stars' })).toHaveAttribute('aria-checked', 'true');
    });

    it('自定义字符', () => {
        render(<Rating character="赞" />);
        expect(document.querySelector(`.${prefixCls}-star-second`)).toHaveTextContent(/^赞$/);
    });

    it('onChange 回调', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={3} onChange={onChange} />);
        await userEvent.click(getRadios()[0]);
        expectValue(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(1);
    });

    it('受控 value', () => {
        const { rerender } = render(<Rating value={2} />);
        expectValue(2);
        expect(getFullStars()).toHaveLength(2);

        rerender(<Rating value={5} />);
        expectValue(5);
        expect(getFullStars()).toHaveLength(5);
    });

    it('onHoverChange', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(<Rating onHoverChange={onHoverChange} />);
        fireEvent.mouseMove(getRadios()[1]);
        expect(onHoverChange).toHaveBeenLastCalledWith(2);
        expect(getFullStars()).toHaveLength(2);

        fireEvent.mouseLeave(getList());
        expect(onHoverChange).toHaveBeenCalledTimes(2);
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
        expect(getFullStars()).toHaveLength(0);
    });

    it('onHoverChange + allowHalf', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        const { container } = render(<Rating allowHalf onHoverChange={onHoverChange} />);
        fireEvent.mouseMove(container.querySelectorAll(`.${prefixCls}-star-wrapper`)[1]);
        expect(onHoverChange).toHaveBeenLastCalledWith(2);

        fireEvent.mouseLeave(getList());
        expect(onHoverChange).toHaveBeenCalledTimes(2);
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
    });

    it('allowClear', async () => {
        render(<Rating defaultValue={2} allowClear />);
        expectValue(2);
        await userEvent.click(getRadios()[1]);
        expectValue(0);
        expect(getFullStars()).toHaveLength(0);
    });

    it('tooltips', async () => {
        const tooltips = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
        render(<Rating tooltips={tooltips} />);
        expect(screen.queryByText('bad')).toBeNull();
        fireEvent.mouseMove(getRadios()[1]);
        expect(await screen.findByText('bad')).toBeInTheDocument();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(/^bad$/);
    });

    it('tooltips 在悬停移动时保持星星挂载', async () => {
        render(<Rating tooltips={['terrible', 'bad', 'normal', 'good', 'wonderful']} />);
        const stars = getRadios();
        fireEvent.mouseMove(stars[1]);
        expect(await screen.findByText('bad')).toBeInTheDocument();
        fireEvent.mouseMove(stars[2]);
        expect(await screen.findByText('normal')).toBeInTheDocument();
        // the same DOM nodes: a key that changed with the tooltip visibility remounted the hovered star
        getRadios().forEach((radio, index) => expect(radio).toBe(stars[index]));
    });

    it('onFocus 与 onBlur', () => {
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(<Rating defaultValue={2} onBlur={onBlur} onFocus={onFocus} />);
        fireEvent.focus(getList());
        expect(onFocus).toHaveBeenCalledTimes(1);
        fireEvent.blur(getList());
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('方向键在星之间移动焦点时不触发 onFocus 与 onBlur，Tab 离开后才触发 onBlur', async () => {
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(
            <>
                <Rating defaultValue={2} onBlur={onBlur} onFocus={onFocus} />
                <button type="button">after</button>
            </>
        );
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

    it('onKeyDown', () => {
        const onKeyDown = vi.fn<RatingCallback<'onKeyDown'>>();
        const { unmount } = render(<Rating defaultValue={2} onKeyDown={onKeyDown} />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(1);
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(2);
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
        expect(onKeyDown).toHaveBeenCalledTimes(2);
        unmount();

        render(<Rating defaultValue={2.5} allowHalf />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(2);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(3);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
    });

    it('rtl 模式', () => {
        const { unmount } = render(
            <ConfigProvider direction="rtl">
                <Rating className="test" defaultValue={2} />
            </ConfigProvider>
        );
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(3);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(2);
        unmount();

        render(
            <ConfigProvider direction="rtl">
                <Rating defaultValue={2.5} allowHalf />
            </ConfigProvider>
        );
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(3);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(2);
    });

    it('多次点击', async () => {
        render(<Rating />);
        await userEvent.click(getRadios()[1]);
        expect(getFullStars()).toHaveLength(2);
        await userEvent.click(getRadios()[1]);
        expect(getFullStars()).toHaveLength(0);
        await userEvent.click(getRadios()[1]);
        expect(getFullStars()).toHaveLength(2);
    });

    it('autoFocus 属性', () => {
        render(<Rating autoFocus />);
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveFocus();
    });

    it('aria-label 属性', () => {
        render(<Rating aria-label="评分" />);
        // the label names the radiogroup only; the items keep the locale unit
        expect(screen.getByRole('radiogroup', { name: '评分' })).toBe(getList());
        expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: '2 stars' })).toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: /评分/ })).not.toBeInTheDocument();
    });

    it('aria-label 与字符串 character 同时传入时，单位取 character', () => {
        render(<Rating aria-label="评分" character="心" />);
        expect(screen.getByRole('radiogroup', { name: '评分' })).toBe(getList());
        expect(screen.getByRole('radio', { name: '1 心' })).toBeInTheDocument();
    });

    it('aria-labelledby 属性', () => {
        render(<Rating aria-labelledby="rating-label" />);
        expect(getList()).toHaveAttribute('aria-labelledby', 'rating-label');
    });

    it('preventScroll 属性', () => {
        const ref = createRef<RatingHandle>();
        render(<Rating ref={ref} preventScroll />);
        const empty = screen.getByRole('radio', { name: '0 stars' });
        const focusSpy = vi.spyOn(empty, 'focus');
        act(() => ref.current?.focus());
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(empty).toHaveFocus();
    });

    it('tabIndex 被丢弃，列表保持 -1，只有选中的 radio 是 Tab 停靠点', () => {
        render(<Rating tabIndex={0} defaultValue={2} />);
        expect(getList()).toHaveAttribute('tabindex', '-1');
        expect(getRadios().filter((radio) => radio.getAttribute('tabindex') === '0')).toEqual([screen.getByRole('radio', { name: '2 stars' })]);
    });

    it('id 属性', () => {
        render(<Rating id="my-rating" />);
        expect(document.getElementById('my-rating')).toBe(getList());
    });

    it('focus 与 blur 方法：focus 落到 Tab 停靠的 radio', () => {
        const ref = createRef<RatingHandle>();
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(<Rating ref={ref} defaultValue={3} onBlur={onBlur} onFocus={onFocus} />);
        act(() => ref.current?.focus());
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);

        act(() => ref.current?.blur());
        expect(document.body).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('禁用时的 focus 方法', () => {
        const ref = createRef<RatingHandle>();
        render(<Rating ref={ref} disabled />);
        act(() => ref.current?.focus());
        expect(getList()).not.toHaveFocus();
        expect(document.body).toHaveFocus();
    });

    it('数字形式的自定义 size', () => {
        render(<Rating size={24} />);
        const star = document.querySelector(`li.${prefixCls}-star`);
        expect(star).toHaveStyle({ width: '24px', height: '24px', fontSize: '24px' });
        expect(document.querySelector(`.${prefixCls}-star-default`)).toBeNull();
    });

    it('字符串形式的 character 作为 aria 标签', () => {
        render(<Rating defaultValue={3} character="心" />);
        expect(getList()).toHaveAttribute('aria-label', 'Rating: 3 of 5 心,');
        expect(screen.getByRole('radio', { name: '3 心' })).toHaveAttribute('aria-checked', 'true');
    });

    it('aria-describedby 属性', () => {
        render(<Rating aria-describedby="rating-desc" />);
        expect(getList()).toHaveAttribute('aria-describedby', 'rating-desc');
    });

    it('列表是带有表单字段 aria 属性的 radiogroup', () => {
        render(<Rating aria-errormessage="error-msg" aria-invalid aria-required />);
        expect(screen.getByRole('radiogroup')).toBe(getList());
        expect(getList()).toHaveAttribute('aria-required', 'true');
        expect(getList()).toHaveAttribute('aria-invalid', 'true');
        expect(getList()).toHaveAttribute('aria-errormessage', 'error-msg');
    });

    it('StrictMode 下 autoFocus、点击与键盘操作正常', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(
            <StrictMode>
                <Rating autoFocus defaultValue={2} onChange={onChange} />
            </StrictMode>
        );
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
        await userEvent.click(getRadios()[3]);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expect(onChange.mock.calls.map(([value]) => value)).toEqual([4, 3]);
        expectValue(3);
    });

    it('onClick 回调', async () => {
        const onClick = vi.fn<RatingCallback<'onClick'>>();
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={2} onChange={onChange} onClick={onClick} />);
        await userEvent.click(getRadios()[0]);
        expect(onClick).toHaveBeenCalledWith(expect.anything(), 0);
        // the user's handler is called in addition to Rating's own click handling
        expect(onChange).toHaveBeenCalledWith(1);
    });

    it('禁用状态阻止交互', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(<Rating defaultValue={2} disabled onChange={onChange} onHoverChange={onHoverChange} />);
        await userEvent.click(getRadios()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onHoverChange).not.toHaveBeenCalled();
        expectValue(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('star item 按 Enter 触发 keyDown', () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={2} onChange={onChange} />);
        fireEvent.keyDown(getRadios()[0], { key: 'Enter' });
        expectValue(1);
        expect(onChange).toHaveBeenCalledWith(1);
    });

    it('star item 悬停触发 onHover', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(<Rating onHoverChange={onHoverChange} />);
        fireEvent.mouseMove(getRadios()[2]);
        expect(onHoverChange).toHaveBeenCalledWith(3);
        expect(getFullStars()).toHaveLength(3);
        expectValue(0);
    });

    it('allowClear 为 false 时，第二次点击不清空', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={2} allowClear={false} onChange={onChange} />);
        await userEvent.click(getRadios()[1]);
        expectValue(2);
        expect(onChange).toHaveBeenCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('value 为 0 时显示空星', () => {
        render(<Rating defaultValue={0} />);
        expectValue(0);
        expect(getFullStars()).toHaveLength(0);
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveAttribute('aria-checked', 'true');
    });

    it('value 为 1 且带 aria-label', () => {
        render(<Rating defaultValue={1} />);
        expect(getList().getAttribute('aria-label')).toContain('1 of 5 star,');
    });

    // the focus ring is CSS on :focus-visible, asserted in rating.browser.test.tsx
    it('Tab 进入与离开空星', async () => {
        render(<Rating defaultValue={0} />);
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('allowHalf 下半星值的 star focus', () => {
        render(<Rating defaultValue={2.5} allowHalf />);
        expectValue(2.5);
        expect(getHalfStars()).toHaveLength(1);
        expect(screen.getByRole('radio', { name: '2.5 stars' })).toHaveAttribute('tabindex', '0');
    });

    it('边界处的键盘导航', () => {
        render(<Rating defaultValue={5} />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(0);
        expect(screen.getByRole('radio', { name: '0 stars' })).toHaveFocus();
    });

    it('0 边界处的键盘导航', () => {
        render(<Rating defaultValue={1} />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(0);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(5);
        expect(screen.getByRole('radio', { name: '5 stars' })).toHaveFocus();
    });

    it('tooltips 为空数组', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(<Rating tooltips={[]} onHoverChange={onHoverChange} />);
        expect(getList().querySelectorAll(`:scope > li.${prefixCls}-star`)).toHaveLength(6);
        fireEvent.mouseMove(getRadios()[1]);
        expect(onHoverChange).toHaveBeenCalledWith(2);
        expect(getFullStars()).toHaveLength(2);
    });

    it('getDomNode 返回元素', () => {
        render(<Rating defaultValue={3} />);
        const items = getList().querySelectorAll(`:scope > li.${prefixCls}-star`);
        expect(items).toHaveLength(6);
        items.forEach((item) => expect(item.querySelector('[role="radio"]')).not.toBeNull());
    });

    it('clearedValue 状态', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        render(<Rating defaultValue={2} allowClear onHoverChange={onHoverChange} />);
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

    it('allowHalf 时 Tab 聚焦选中星的左半边', async () => {
        render(<Rating defaultValue={2.5} allowHalf />);
        const firstHalf = screen.getByRole('radio', { name: '2.5 stars' });
        expect(firstHalf).toHaveClass(`${prefixCls}-star-first`);
        await userEvent.tab();
        expect(firstHalf).toHaveFocus();
    });

    it('allowHalf 时 Tab 聚焦选中星的右半边', async () => {
        render(<Rating defaultValue={3} allowHalf />);
        const secondHalf = screen.getByRole('radio', { name: '3 stars' });
        expect(secondHalf).toHaveClass(`${prefixCls}-star-second`);
        await userEvent.tab();
        expect(secondHalf).toHaveFocus();
    });

    it('第一个星的 onFocus', () => {
        const onFocus = vi.fn<RatingCallback<'onFocus'>>();
        render(<Rating defaultValue={2.5} allowHalf onFocus={onFocus} />);
        act(() => screen.getByRole('radio', { name: '2.5 stars' }).focus());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('第一个星的 onBlur', () => {
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        render(<Rating defaultValue={2.5} allowHalf onBlur={onBlur} />);
        const firstHalf = screen.getByRole('radio', { name: '2.5 stars' });
        act(() => firstHalf.focus());
        expect(onBlur).not.toHaveBeenCalled();
        act(() => firstHalf.blur());
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('半星值的 starFocus 方法', () => {
        render(<Rating autoFocus defaultValue={2.5} allowHalf />);
        expect(screen.getByRole('radio', { name: '2.5 stars' })).toHaveFocus();
    });

    it('整星值的 starFocus 方法', () => {
        render(<Rating autoFocus defaultValue={3} allowHalf />);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
    });

    it('方向键移到半星值时聚焦该星的左半边', () => {
        render(<Rating defaultValue={2} allowHalf />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        // keyboard navigation onto a half value focuses the first half of that star
        const firstHalf = screen.getByRole('radio', { name: '2.5 stars' });
        expect(firstHalf).toHaveFocus();
        expect(firstHalf).toHaveClass(`${prefixCls}-star-first`);
        expect(firstHalf).toHaveAttribute('aria-checked', 'true');
    });

    it('方向键移到整星值时聚焦该星的右半边', () => {
        render(<Rating defaultValue={2.5} allowHalf />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        const secondHalf = screen.getByRole('radio', { name: '3 stars' });
        expect(secondHalf).toHaveFocus();
        expect(secondHalf).toHaveClass(`${prefixCls}-star-second`);
        expect(secondHalf).toHaveAttribute('aria-checked', 'true');
    });

    it('第一个星的 div role radio 获得焦点', () => {
        render(<Rating defaultValue={2.5} allowHalf />);
        const firstHalves = getRadios().filter((radio) => radio.classList.contains(`${prefixCls}-star-first`));
        expect(firstHalves).toHaveLength(5);
        firstHalves.forEach((radio, index) => {
            expect(radio).toHaveAttribute('aria-label', `${index + 0.5} stars`);
            expect(radio).toHaveAttribute('aria-posinset', String(2 * index + 1));
            expect(radio).toHaveAttribute('aria-setsize', '11');
            expect(radio).toHaveAttribute('aria-checked', String(index === 2));
        });
    });

    it('第二个星的 div role radio 获得焦点', () => {
        render(<Rating defaultValue={3} allowHalf />);
        const secondHalves = getRadios()
            .filter((radio) => radio.classList.contains(`${prefixCls}-star-second`))
            .slice(0, 5);
        secondHalves.forEach((radio, index) => {
            expect(radio).toHaveAttribute('aria-label', `${index + 1} star${index === 0 ? '' : 's'}`);
            expect(radio).toHaveAttribute('aria-posinset', String(2 * (index + 1)));
            expect(radio).toHaveAttribute('aria-setsize', '11');
            expect(radio).toHaveAttribute('aria-checked', String(index === 2));
        });
    });

    it('star item 设置 preventScroll 属性', () => {
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
        render(<Rating defaultValue={2.5} allowHalf preventScroll />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });
        focusSpy.mockRestore();
    });

    it('star item 带 tabIndex 时获得焦点', () => {
        render(<Rating defaultValue={2.5} allowHalf />);
        const tabbable = getRadios().filter((radio) => radio.getAttribute('tabindex') === '0');
        expect(tabbable).toEqual([screen.getByRole('radio', { name: '2.5 stars' })]);
    });

    it('禁用的 star item tabIndex 为 -1', () => {
        render(<Rating defaultValue={3} disabled />);
        const radios = getRadios();
        expect(radios).toHaveLength(6);
        radios.forEach((radio) => {
            expect(radio).toHaveAttribute('tabindex', '-1');
            expect(radio).toHaveAttribute('aria-disabled', 'true');
        });
    });

    it('rating 把未声明的属性透传到根元素，不包括由 foundation 驱动的属性', async () => {
        const onClick = vi.fn<RatingCallback<'onClick'>>();
        render(<Rating data-x="1" title="score" onClick={onClick} />);
        expect(getList()).toHaveAttribute('title', 'score');
        expect(getList()).toHaveAttribute('data-x', '1');
        await userEvent.click(getRadios()[2]);
        // onClick comes from the foundation with the star index, never as a second DOM handler
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][1]).toBe(2);
    });

    it('Form.Rating 不把 Form 属性放到 DOM 上', () => {
        render(
            <Form>
                <Form.Rating field="score" />
            </Form>
        );
        expect(getList()).not.toHaveAttribute('validatestatus');
        expect(getList()).not.toHaveAttribute('validateStatus');
        expect(getList()).not.toHaveAttribute('name');
    });

    it('位于 Tooltip 中的 rating 由 tooltip 描述', async () => {
        render(
            <Tooltip content="tip">
                <Rating />
            </Tooltip>
        );
        await userEvent.tab();
        await waitFor(() => expect(getList()).toHaveAccessibleDescription('tip'));
    });
});

describe('Rating 的 Tab 停靠点', () => {
    it('tooltips: radiogroup 只在选中的 radio 上保留一个 Tab 停靠点', async () => {
        render(<Rating defaultValue={2} tooltips={['terrible', 'bad', 'normal', 'good', 'wonderful']} />);
        await userEvent.tab();
        expect(document.activeElement).toHaveAttribute('role', 'radio');
        expect(document.activeElement).toBeChecked();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('tooltips: tooltip 描述获得焦点的 radio，该 radio 保留自己的名称', async () => {
        render(<Rating defaultValue={2} tooltips={['terrible', 'bad', 'normal', 'good', 'wonderful']} />);
        await userEvent.tab();
        const radio = document.activeElement;
        fireEvent.mouseMove(radio);
        await waitFor(() => expect(radio).toHaveAccessibleDescription('bad'));
        expect(radio).toHaveAccessibleName('2 stars');
    });

    it('tooltips: 键盘焦点显示所聚焦星星的 tooltip，方向键随之移动', async () => {
        render(<Rating defaultValue={2} tooltips={['terrible', 'bad', 'normal', 'good', 'wonderful']} />);
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

    it('作为 Tooltip 触发器时列表不是 Tab 停靠点', async () => {
        render(
            <Tooltip content="tip">
                <Rating defaultValue={2} />
            </Tooltip>
        );
        expect(getList()).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('值不对应任何 radio 时第一个 radio 是 Tab 停靠点', async () => {
        const { unmount } = render(<Rating defaultValue={2.5} />);
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
        expect(getRadios().filter((radio) => radio.getAttribute('tabindex') === '0')).toHaveLength(1);
        unmount();

        render(<Rating defaultValue={3.65} allowHalf />);
        await userEvent.tab();
        expect(screen.getByRole('radio', { name: '0.5 stars' })).toHaveFocus();
    });
});

describe('Rating 的 APG radio group 行为', () => {
    it('allowHalf 时空星的 aria-posinset 等于 aria-setsize', () => {
        render(<Rating allowHalf />);
        const empty = screen.getByRole('radio', { name: '0 stars' });
        expect(empty).toHaveAttribute('aria-setsize', '11');
        expect(empty).toHaveAttribute('aria-posinset', '11');
    });

    it('值落在两个 radio 之间时，方向键选中相邻的 radio', () => {
        const between = render(<Rating defaultValue={2.5} />);
        fireEvent.keyDown(getList(), { key: 'ArrowRight' });
        expectValue(3);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        between.unmount();

        const below = render(<Rating defaultValue={2.5} />);
        fireEvent.keyDown(getList(), { key: 'ArrowLeft' });
        expectValue(2);
        expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
        below.unmount();

        render(<Rating defaultValue={3.65} allowHalf />);
        fireEvent.keyDown(getList(), { key: 'ArrowDown' });
        expectValue(4);
        fireEvent.keyDown(getList(), { key: 'ArrowUp' });
        expectValue(3.5);
        expect(screen.getByRole('radio', { name: '3.5 stars' })).toHaveFocus();
    });

    it('值不落在任何 radio 上时 autoFocus 与 focus() 都聚焦 Tab 停靠的 radio', () => {
        const ref = createRef<RatingHandle>();
        render(<Rating ref={ref} autoFocus defaultValue={2.5} />);
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
        act(() => ref.current?.blur());
        act(() => ref.current?.focus());
        expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
    });

    it('Down 选中下一个、Up 选中上一个，RTL 下上下方向不镜像', () => {
        const { unmount } = render(<Rating defaultValue={2} />);
        fireEvent.keyDown(getList(), { key: 'ArrowDown' });
        expectValue(3);
        expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
        fireEvent.keyDown(getList(), { key: 'ArrowUp' });
        expectValue(2);
        unmount();

        render(
            <ConfigProvider direction="rtl">
                <Rating defaultValue={2} />
            </ConfigProvider>
        );
        fireEvent.keyDown(getList(), { key: 'ArrowDown' });
        expectValue(3);
        fireEvent.keyDown(getList(), { key: 'ArrowUp' });
        expectValue(2);
    });

    it('Space 选中获得焦点且未选中的星，在已选中的星上不清除', async () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={2} onChange={onChange} />);
        act(() => screen.getByRole('radio', { name: '4 stars' }).focus());
        await userEvent.keyboard(' ');
        expectValue(4);
        expect(onChange).toHaveBeenLastCalledWith(4);
        await userEvent.keyboard(' ');
        expectValue(4);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('受控 value 变回 undefined 时回到 defaultValue', async () => {
        const { rerender } = render(<Rating defaultValue={1} value={3} />);
        expectValue(3);
        rerender(<Rating defaultValue={1} value={undefined} />);
        expectValue(1);
        expect(screen.getByRole('radio', { name: '1 star' })).toBeChecked();
        await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
        expectValue(4);
    });
});

describe('Rating 的 ul 事件、非指针激活与修饰键', () => {
    it('使用方传入的 onMouseLeave 在指针离开时调用，禁用时也一样', () => {
        const onMouseLeave = vi.fn<NonNullable<RatingProps['onMouseLeave']>>();
        const { rerender } = render(<Rating onMouseLeave={onMouseLeave} />);
        fireEvent.mouseLeave(getList());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        rerender(<Rating disabled onMouseLeave={onMouseLeave} />);
        fireEvent.mouseLeave(getList());
        expect(onMouseLeave).toHaveBeenCalledTimes(2);
    });

    it('悬停中途被禁用后指针离开仍复位悬停，重新启用时不残留', () => {
        const onHoverChange = vi.fn<RatingCallback<'onHoverChange'>>();
        const { rerender } = render(<Rating defaultValue={1} onHoverChange={onHoverChange} />);
        fireEvent.mouseMove(getRadios()[3]);
        expect(getFullStars()).toHaveLength(4);
        rerender(<Rating defaultValue={1} disabled onHoverChange={onHoverChange} />);
        fireEvent.mouseLeave(getList());
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
        rerender(<Rating defaultValue={1} onHoverChange={onHoverChange} />);
        expect(getFullStars()).toHaveLength(1);
    });

    it('键盘聚焦中被禁用后焦点离开仍清除聚焦星，重新启用时 tooltip 不残留', async () => {
        const onBlur = vi.fn<RatingCallback<'onBlur'>>();
        const tooltips = ['差', '中', '好'];
        const ui = (disabled: boolean) => (
            <>
                <Rating defaultValue={1} disabled={disabled} count={3} tooltips={tooltips} onBlur={onBlur} />
                <button>after</button>
            </>
        );
        const { rerender } = render(ui(false));
        await userEvent.tab();
        expect(await screen.findByText('差')).toBeInTheDocument();
        rerender(ui(true));
        act(() => screen.getByRole('button', { name: 'after' }).focus());
        expect(onBlur).toHaveBeenCalledTimes(1);
        rerender(ui(false));
        await act(async () => {});
        expect(screen.queryByText('差')).toBeNull();
    });

    it('tooltips 短于 count 时悬停没有文案的星不显示空气泡', async () => {
        render(<Rating tooltips={['差', '中', '好']} />);
        fireEvent.mouseMove(getRadios()[3]);
        await act(async () => {});
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull();
        expect(getRadios()[3]).not.toHaveAttribute('aria-describedby');
    });

    it('allowHalf 时悬停在左半星上显示该星的 tooltip', async () => {
        render(<Rating allowHalf tooltips={['差', '中', '好']} />);
        // jsdom stars have no width, so a pointer left of the star's origin is its left half
        fireEvent.mouseMove(getRadios()[1], { clientX: -1 });
        expect(await screen.findByText('差')).toBeInTheDocument();
    });

    it('非指针激活空星得到 0 而不是 count + 1', () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={3} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '0 stars' }));
        expect(onChange).toHaveBeenLastCalledWith(0);
        expectValue(0);
    });

    it('allowHalf 时非指针激活半星 radio 得到该 radio 的值', () => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        render(<Rating defaultValue={1} allowHalf onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '2.5 stars' }));
        expect(onChange).toHaveBeenLastCalledWith(2.5);
        expectValue(2.5);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不改值、不移焦、不触发 onKeyDown', (modifier) => {
        const onChange = vi.fn<RatingCallback<'onChange'>>();
        const onKeyDown = vi.fn<RatingCallback<'onKeyDown'>>();
        render(<Rating defaultValue={3} onChange={onChange} onKeyDown={onKeyDown} />);
        const radio = screen.getByRole('radio', { name: '3 stars' });
        act(() => radio.focus());
        expect(fireEvent.keyDown(radio, { key: 'ArrowLeft', [modifier]: true })).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
        expect(onKeyDown).not.toHaveBeenCalled();
        expect(radio).toHaveFocus();
        expectValue(3);
    });
});
