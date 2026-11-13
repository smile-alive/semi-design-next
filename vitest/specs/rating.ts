import { fireEvent, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

/** Framework-free Rating props; each fixture maps the naming differences (`modelValue`, `bind:value`, `autofocus`) */
export interface RatingSpecProps {
    /** `undefined` is uncontrolled and falls back to `defaultValue` */
    value?: number;
    defaultValue?: number;
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    disabled?: boolean;
    size?: 'small' | 'default';
    /** Drawn in every star */
    character?: string;
    tooltips?: string[];
    ariaLabel?: string;
    direction?: 'ltr' | 'rtl';
    onChange?: (value: number) => void;
    /** `undefined` when the pointer leaves the stars or a click clears the value */
    onHoverChange?: (value?: number) => void;
    // React passes a synthetic event, so only `type` is common to every framework
    onClick?: (event: { type: string }, index: number) => void;
    onFocus?: (event: { type: string }) => void;
    onBlur?: (event: { type: string }) => void;
    onKeyDown?: (event: { key: string }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-rating`;

export function ratingSpec(mount: SpecMount<RatingSpecProps>, options: SpecOptions = {}) {
    defineSpec('Rating（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<RatingSpecProps>;

        async function render(props: Partial<RatingSpecProps> = {}) {
            handle = await mount(props);
            view = within(handle.container);
            return handle;
        }

        const list = () => view.getByRole('radiogroup');
        const radios = () => view.getAllByRole('radio');
        // the last radio stands for 0; with allowHalf every star owns a half radio before its full one
        const isHalf = () => radios().some((radio) => radio.classList.contains(`${prefix}-star-first`));
        const valueOf = (radio: Element) => {
            const index = radios().indexOf(radio as HTMLElement);
            return index === radios().length - 1 ? 0 : isHalf() ? (index + 1) / 2 : index + 1;
        };
        const radioFor = (value: number) => radios()[value === 0 ? radios().length - 1 : isHalf() ? value * 2 - 1 : value - 1];
        const checkedValues = () =>
            radios()
                .filter((radio) => radio.getAttribute('aria-checked') === 'true')
                .map(valueOf);
        const tabStops = () =>
            radios()
                .filter((radio) => radio.getAttribute('tabindex') === '0')
                .map(valueOf);
        const focusedValue = () => valueOf(document.activeElement as Element);
        const fullStars = () => handle.container.querySelectorAll(`.${prefix}-star-full`);
        const halfStars = () => handle.container.querySelectorAll(`.${prefix}-star-half`);
        const focusRadio = (value: number) => radioFor(value).focus();

        test('渲染 radiogroup：count 颗星各有一个 radio，另有一个代表 0 的 radio；默认值为 0 时选中它', async () => {
            await render();
            expect(list()).toHaveClass(prefix);
            expect(radios()).toHaveLength(6);
            expect(checkedValues()).toEqual([0]);
            expect(fullStars()).toHaveLength(0);
            handle.unmount();

            await render({ count: 10 });
            expect(radios()).toHaveLength(11);
        });

        test('defaultValue 选中对应的 radio 并填充星星；allowHalf 时每颗星多一个半星 radio', async () => {
            await render({ defaultValue: 4 });
            expect(checkedValues()).toEqual([4]);
            expect(fullStars()).toHaveLength(4);
            handle.unmount();

            await render({ defaultValue: 3.5, allowHalf: true });
            expect(radios()).toHaveLength(11);
            expect(checkedValues()).toEqual([3.5]);
            expect(fullStars()).toHaveLength(3);
            expect(halfStars()).toHaveLength(1);
        });

        test('roving tabindex：只有选中的 radio 是 Tab 停靠点；值不对应任何 radio 时第一个 radio 是', async () => {
            await render({ defaultValue: 2 });
            expect(tabStops()).toEqual([2]);
            await userEvent.tab();
            expect(focusedValue()).toBe(2);
            await userEvent.tab();
            expect(radios()).not.toContain(document.activeElement);
            handle.unmount();

            await render({ defaultValue: 2.5 });
            expect(checkedValues()).toEqual([]);
            expect(tabStops()).toEqual([1]);
            handle.unmount();

            await render({ defaultValue: 2.5, allowHalf: true });
            await userEvent.tab();
            expect(focusedValue()).toBe(2.5);
        });

        test('allowHalf 时空星 radio 的 aria-posinset 等于 aria-setsize', async () => {
            await render({ allowHalf: true });
            const empty = radioFor(0);
            expect(empty).toHaveAttribute('aria-setsize', '11');
            expect(empty).toHaveAttribute('aria-posinset', '11');
        });

        test('非受控：点击星选中它，onChange 收到该值', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 3, onChange });
            await userEvent.click(radioFor(1));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
            expect(checkedValues()).toEqual([1]);
            expect(fullStars()).toHaveLength(1);
            await userEvent.click(radioFor(4));
            expect(checkedValues()).toEqual([4]);
        });

        test('onClick 收到点击事件和星的序号，onChange 照常调用', async () => {
            const onClick = vi.fn<NonNullable<RatingSpecProps['onClick']>>();
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 2, onClick, onChange });
            await userEvent.click(radioFor(3));
            expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'click' }), 2);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(3);
        });

        test('allowClear（默认）：再次点击已选中的星清空为 0；allowClear 为 false 时保持原值', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 2, onChange });
            await userEvent.click(radioFor(2));
            expect(checkedValues()).toEqual([0]);
            expect(fullStars()).toHaveLength(0);
            expect(onChange).toHaveBeenLastCalledWith(0);
            await userEvent.click(radioFor(2));
            expect(checkedValues()).toEqual([2]);
            handle.unmount();

            const keep = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 2, allowClear: false, onChange: keep });
            await userEvent.click(radioFor(2));
            expect(checkedValues()).toEqual([2]);
            expect(keep).toHaveBeenCalledWith(2);
        });

        test('无指针的激活：空星得到 0；allowHalf 时半星 radio 得到它自己的值', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 3, onChange });
            fireEvent.click(radioFor(0));
            await handle.update({});
            expect(onChange).toHaveBeenLastCalledWith(0);
            expect(checkedValues()).toEqual([0]);
            handle.unmount();

            await render({ defaultValue: 1, allowHalf: true, onChange });
            fireEvent.click(radioFor(2.5));
            await handle.update({});
            expect(onChange).toHaveBeenLastCalledWith(2.5);
            expect(checkedValues()).toEqual([2.5]);
        });

        test('受控：点击只报告新值，选中项由 value 决定；value 改回 undefined 后回到 defaultValue', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ value: 2, defaultValue: 1, onChange });
            expect(checkedValues()).toEqual([2]);
            await userEvent.click(radioFor(4));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(4);
            expect(checkedValues()).toEqual([2]);

            await handle.update({ value: 5 });
            expect(checkedValues()).toEqual([5]);

            await handle.update({ value: undefined });
            expect(checkedValues()).toEqual([1]);
            await userEvent.click(radioFor(4));
            expect(checkedValues()).toEqual([4]);
        });

        test('悬停：onHoverChange 收到悬停的值并预览填充，不改变 aria-checked 与 Tab 停靠点；指针离开后收到 undefined 并复位', async () => {
            const onHoverChange = vi.fn<NonNullable<RatingSpecProps['onHoverChange']>>();
            await render({ defaultValue: 2, onHoverChange });
            await userEvent.hover(radioFor(4));
            expect(onHoverChange).toHaveBeenLastCalledWith(4);
            expect(fullStars()).toHaveLength(4);
            expect(checkedValues()).toEqual([2]);
            expect(tabStops()).toEqual([2]);

            await userEvent.unhover(radioFor(4));
            expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
            expect(fullStars()).toHaveLength(2);
        });

        test('disabled：根节点带禁用类名，radio 是 aria-disabled 且不可 Tab 聚焦，点击与悬停都不产生回调', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            const onHoverChange = vi.fn<NonNullable<RatingSpecProps['onHoverChange']>>();
            await render({ defaultValue: 2, disabled: true, onChange, onHoverChange });
            expect(list()).toHaveClass(`${prefix}-disabled`);
            radios().forEach((radio) => {
                expect(radio).toHaveAttribute('aria-disabled', 'true');
                expect(radio).toHaveAttribute('tabindex', '-1');
            });
            await userEvent.click(radioFor(4));
            await userEvent.hover(radioFor(3));
            expect(onChange).not.toHaveBeenCalled();
            expect(onHoverChange).not.toHaveBeenCalled();
            expect(checkedValues()).toEqual([2]);
        });

        test('键盘：右、下方向键选中并聚焦下一个 radio，左、上选中上一个，到头后循环（1 到 count，再到 0）', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            const onKeyDown = vi.fn<NonNullable<RatingSpecProps['onKeyDown']>>();
            await render({ defaultValue: 4, onChange, onKeyDown });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowRight}');
            expect(checkedValues()).toEqual([5]);
            expect(focusedValue()).toBe(5);
            expect(onChange).toHaveBeenLastCalledWith(5);
            expect(onKeyDown).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'ArrowRight' }));
            await userEvent.keyboard('{ArrowDown}');
            expect(checkedValues()).toEqual([0]);
            expect(focusedValue()).toBe(0);
            await userEvent.keyboard('{ArrowLeft}');
            expect(checkedValues()).toEqual([5]);
            await userEvent.keyboard('{ArrowUp}');
            expect(checkedValues()).toEqual([4]);
            expect(focusedValue()).toBe(4);
            expect(onChange).toHaveBeenCalledTimes(4);
        });

        test('键盘：allowHalf 时每次移动半颗星', async () => {
            await render({ defaultValue: 2.5, allowHalf: true });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowLeft}');
            expect(checkedValues()).toEqual([2]);
            expect(focusedValue()).toBe(2);
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(checkedValues()).toEqual([3]);
            expect(focusedValue()).toBe(3);
        });

        test('键盘：值落在两个 radio 之间时，方向键选中相邻的 radio', async () => {
            await render({ defaultValue: 2.5 });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowRight}');
            expect(checkedValues()).toEqual([3]);
            expect(focusedValue()).toBe(3);
            handle.unmount();

            await render({ defaultValue: 2.5 });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowLeft}');
            expect(checkedValues()).toEqual([2]);
            expect(focusedValue()).toBe(2);
            handle.unmount();

            await render({ defaultValue: 3.65, allowHalf: true });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowDown}');
            expect(checkedValues()).toEqual([4]);
            await userEvent.keyboard('{ArrowUp}');
            expect(checkedValues()).toEqual([3.5]);
            expect(focusedValue()).toBe(3.5);
        });

        test('键盘：RTL 页面中左右方向键互换，上下方向键不互换', async () => {
            await render({ defaultValue: 2, direction: 'rtl' });
            await userEvent.tab();
            await userEvent.keyboard('{ArrowLeft}');
            expect(checkedValues()).toEqual([3]);
            await userEvent.keyboard('{ArrowRight}');
            expect(checkedValues()).toEqual([2]);
            await userEvent.keyboard('{ArrowDown}');
            expect(checkedValues()).toEqual([3]);
            await userEvent.keyboard('{ArrowUp}');
            expect(checkedValues()).toEqual([2]);
        });

        test('键盘：Space 选中获得焦点且未选中的 radio，在已选中的 radio 上不清除也不调用 onChange', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 2, onChange });
            focusRadio(4);
            await userEvent.keyboard(' ');
            expect(checkedValues()).toEqual([4]);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(4);
            await userEvent.keyboard(' ');
            expect(checkedValues()).toEqual([4]);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('键盘：Enter 选中获得焦点的 radio，空星上得到 0；allowHalf 时选中半星', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            await render({ defaultValue: 1, onChange });
            focusRadio(3);
            await userEvent.keyboard('{Enter}');
            expect(checkedValues()).toEqual([3]);
            focusRadio(0);
            await userEvent.keyboard('{Enter}');
            expect(checkedValues()).toEqual([0]);
            expect(onChange.mock.calls.every(([value]) => value >= 0 && value <= 5)).toBe(true);
            handle.unmount();

            await render({ defaultValue: 1, allowHalf: true, onChange });
            focusRadio(2.5);
            await userEvent.keyboard('{Enter}');
            expect(checkedValues()).toEqual([2.5]);
            expect(onChange).toHaveBeenLastCalledWith(2.5);
            await userEvent.keyboard('{Enter}');
            expect(checkedValues()).toEqual([0]);
        });

        test('按住 Alt、Ctrl 或 Meta 的方向键交给浏览器，不改值、不移焦、不调用 onKeyDown', async () => {
            const onChange = vi.fn<NonNullable<RatingSpecProps['onChange']>>();
            const onKeyDown = vi.fn<NonNullable<RatingSpecProps['onKeyDown']>>();
            await render({ defaultValue: 3, onChange, onKeyDown });
            focusRadio(3);
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', [modifier]: true, bubbles: true, cancelable: true });
                expect(radioFor(3).dispatchEvent(event)).toBe(true);
                expect(radioFor(3)).toHaveFocus();
            }
            expect(onChange).not.toHaveBeenCalled();
            expect(onKeyDown).not.toHaveBeenCalled();
            expect(checkedValues()).toEqual([3]);
        });

        test('onFocus 与 onBlur 只在焦点进入或离开整个控件时调用，方向键在 radio 间移动时不调用', async () => {
            const onFocus = vi.fn<NonNullable<RatingSpecProps['onFocus']>>();
            const onBlur = vi.fn<NonNullable<RatingSpecProps['onBlur']>>();
            await render({ defaultValue: 2, onFocus, onBlur });
            await userEvent.tab();
            expect(onFocus).toHaveBeenCalledTimes(1);
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(focusedValue()).toBe(4);
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.tab();
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onFocus).toHaveBeenCalledTimes(1);
        });

        test('size 决定星星的尺寸类名', async () => {
            await render({ size: 'small' });
            expect(handle.container.querySelector(`.${prefix}-star-small`)).not.toBeNull();
            expect(handle.container.querySelector(`.${prefix}-star-default`)).toBeNull();
            handle.unmount();

            await render();
            expect(handle.container.querySelector(`.${prefix}-star-default`)).not.toBeNull();
        });

        test('character 画在每颗星里', async () => {
            await render({ character: '赞' });
            const stars = handle.container.querySelectorAll(`.${prefix}-star-second`);
            expect(stars).toHaveLength(6);
            stars.forEach((star) => expect(star.textContent?.trim()).toBe('赞'));
        });

        test('ariaLabel 作为 radiogroup 的可访问名称', async () => {
            await render({ ariaLabel: '服务评分' });
            expect(view.getByRole('radiogroup', { name: '服务评分' })).toBe(list());
        });

        test('tooltips：悬停的星显示对应文案，没有文案的星不显示', async () => {
            await render({ tooltips: ['差', '中', '好'], count: 5 });
            expect(within(document.body).queryByText('中')).toBeNull();
            await userEvent.hover(radioFor(2));
            expect(await within(document.body).findByText('中')).toBeInTheDocument();
            await userEvent.unhover(radioFor(2));
            await userEvent.hover(radioFor(4));
            expect(within(document.body).queryByText('差')).toBeNull();
        });

        const apg = (name: string, props: Partial<RatingSpecProps>) =>
            test(`APG radio group：${name}`, async () => {
                await render({ defaultValue: 2, ...props });
                await expect(checkPattern('radio-group', handle.container, { press, ...(props.direction === 'rtl' ? { direction: 'rtl' as const } : {}) })).resolves.toBeUndefined();
            });
        apg('默认', {});
        apg('allowHalf', { allowHalf: true });
        apg('RTL', { direction: 'rtl' });
    });
}
