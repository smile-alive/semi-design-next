import { type JSX, createSignal } from 'solid-js';
import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { isWebKit, tab } from '@test/utils/browser';
import Slider, { type SliderProps } from '..';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-slider`;
type OnChange = NonNullable<SliderProps['onChange']>;

const getRail = () => document.querySelector(`.${prefixCls}-rail`) as HTMLElement;
const getHandles = () => [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-handle`)];
const getInputs = () => [...document.querySelectorAll<HTMLInputElement>('input[type="range"]')];

describe('Slider（浏览器）', () => {
    it('点击已滚动的水平 Slider 时，值设为指针下方的位置', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(() => (
            <div style={{ position: 'relative', width: '500px', height: '200px', overflow: 'auto' }}>
                <Slider style={{ width: '2000px' }} onChange={onChange} />
            </div>
        ));
        (container.firstElementChild as HTMLElement).scrollLeft = 1000;
        const rect = getRail().getBoundingClientRect();
        expect(rect.left).toBeLessThan(0);

        const offset = 1100;
        fireEvent.click(getRail(), { clientX: rect.left + offset, clientY: rect.top + rect.height / 2 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(Math.round((offset / rect.width) * 100));
        expect(getInputs()[0]).toHaveValue(String(onChange.mock.calls[0][0]));
    });

    it('点击已滚动的垂直 Slider 时，值设为指针下方的位置', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(() => (
            <div style={{ position: 'relative', width: '200px', height: '200px', overflow: 'auto' }}>
                <Slider style={{ height: '2000px' }} vertical onChange={onChange} />
            </div>
        ));
        (container.firstElementChild as HTMLElement).scrollTop = 1000;
        const rect = getRail().getBoundingClientRect();
        expect(rect.top).toBeLessThan(0);

        const offset = 1100;
        fireEvent.click(getRail(), { clientX: rect.left + rect.width / 2, clientY: rect.top + offset });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(Math.round((offset / rect.height) * 100));
    });
});

describe('Slider 的真实布局', () => {
    const renderSlider = (props: SliderProps) => {
        const onChange = vi.fn<OnChange>();
        render(() => (
            <div style={{ width: '800px', 'margin-left': '20px', 'margin-top': '40px' }}>
                <Slider onChange={onChange} {...props} />
            </div>
        ));
        return { onChange, rail: getRail(), handles: getHandles() };
    };
    const clickRail = (rail: HTMLElement, side: 'right' | 'left' | 'bottom') => {
        const rect = rail.getBoundingClientRect();
        const [clientX, clientY] = {
            right: [rect.right - 1, rect.top + rect.height / 2],
            left: [rect.left, rect.top + rect.height / 2],
            bottom: [rect.left + rect.width / 2, rect.bottom - 1],
        }[side];
        fireEvent.click(rail, { clientX, clientY });
    };
    const dragHandle = (handle: HTMLElement, clientX: number, clientY: number, pointerType = 'mouse') => {
        fireEvent.pointerDown(handle, { pointerId: 1, pointerType });
        fireEvent.pointerMove(document.body, { pointerId: 1, pointerType, clientX, clientY });
        fireEvent.pointerUp(window, { pointerId: 1, pointerType });
    };
    const rects = (handles: HTMLElement[]) => handles.map((handle) => handle.getBoundingClientRect());

    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针拖动滑块手柄', (pointerType) => {
        const { onChange, rail, handles } = renderSlider({});
        const railRect = rail.getBoundingClientRect();
        const handleRect = handles[0].getBoundingClientRect();
        const common = { pointerId: 1, pointerType };

        fireEvent.pointerDown(handles[0], { ...common, clientX: handleRect.left + handleRect.width / 2, clientY: handleRect.top + handleRect.height / 2 });
        fireEvent.pointerMove(document.body, { ...common, clientX: railRect.left + railRect.width / 2, clientY: 0 });
        fireEvent.pointerUp(window, common);

        expect(onChange).toHaveBeenLastCalledWith(50);
    });

    it('受控 slider', () => {
        const { onChange, rail, handles } = renderSlider({ value: 30 });
        const initial = rects(handles);

        clickRail(rail, 'right');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(rects(handles)).toEqual(initial);

        dragHandle(handles[0], 600, 0);
        expect(rects(handles)).toEqual(initial);
        expect(handles[0].querySelector('input')).toHaveValue('30');
    });

    it('带 onChange 的受控 slider', async () => {
        const onChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal<number | number[]>(30);
        const { container } = render(() => (
            <div style={{ width: '800px', 'margin-left': '20px', 'margin-top': '40px' }}>
                <Slider
                    value={value()}
                    onChange={(next) => {
                        onChange(next);
                        setValue(next as number | number[]);
                    }}
                />
            </div>
        ));
        const rail = getRail();
        const [handle] = getHandles();

        clickRail(rail, 'right');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(handle.style.left).toBe('100%');

        // Drop on the wrapper: the track covers the rail and Playwright refuses targets that are covered
        const wrapper = container.firstElementChild as HTMLElement;
        const wrapperRect = wrapper.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        await userEvent.dragAndDrop(handle, wrapper, {
            targetPosition: {
                x: railRect.left - wrapperRect.left + railRect.width * 0.32,
                y: railRect.top - wrapperRect.top + railRect.height / 2,
            },
        });
        expect(onChange).toHaveBeenLastCalledWith(32);
        expect(handle.style.left).toBe('32%');
    });

    it('受控范围 slider', () => {
        const { onChange, rail, handles } = renderSlider({ value: [10, 30], range: true });
        const initial = rects(handles);

        clickRail(rail, 'right');
        expect(onChange).toHaveBeenLastCalledWith([10, 100]);
        clickRail(rail, 'left');
        expect(onChange).toHaveBeenLastCalledWith([0, 30]);
        expect(rects(handles)).toEqual(initial);

        dragHandle(handles[0], 100, 0);
        dragHandle(handles[1], 600, 0);
        expect(rects(handles)).toEqual(initial);
    });

    it('受控垂直 slider', () => {
        const { onChange, rail, handles } = renderSlider({ value: 40, vertical: true, style: { height: '300px' } });
        const initial = rects(handles);

        clickRail(rail, 'bottom');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(rects(handles)).toEqual(initial);

        dragHandle(handles[0], 0, 600);
        expect(rects(handles)).toEqual(initial);
    });

    it('键盘', async () => {
        const onChange = vi.fn<OnChange>();
        render(() => (
            <div style={{ width: '800px', 'margin-left': '20px' }}>
                <Slider onChange={onChange} />
                <Slider />
            </div>
        ));
        const [handle] = getHandles();
        const [input, next] = getInputs();
        await userEvent.click(handle);
        expect(input).toHaveFocus();
        // a pointer press focuses the input without the keyboard focus ring
        expect(input.matches(':focus-visible')).toBe(false);
        const steps = [
            ['{ArrowUp}', '1'],
            ['{ArrowRight}', '2'],
            ['{ArrowDown}', '1'],
            ['{ArrowLeft}', '0'],
            ['{PageUp}', '10'],
            ['{PageDown}', '0'],
            ['{End}', '100'],
            ['{Home}', '0'],
        ];
        for (const [key, value] of steps) {
            await userEvent.keyboard(key);
            expect(input).toHaveValue(value);
            expect(onChange).toHaveBeenLastCalledWith(Number(value));
        }
        await tab();
        expect(next).toHaveFocus();
    });

    it.each([
        ['rtl', { direction: 'rtl' as const }, {}, ['{ArrowLeft}', '{ArrowRight}']],
        ['vertical', {}, { vertical: true }, ['{ArrowDown}', '{ArrowUp}']],
        ['verticalReverse', {}, { vertical: true, verticalReverse: true }, ['{ArrowUp}', '{ArrowDown}']],
    ])('%s slider 中的方向键', async (_name, providerProps, sliderProps, [increase, decrease]) => {
        render(() => (
            <ConfigProvider {...providerProps}>
                <div style={{ width: '300px', height: '300px' }}>
                    <Slider defaultValue={50} {...sliderProps} />
                </div>
            </ConfigProvider>
        ));
        const [input] = getInputs();
        await userEvent.click(getHandles()[0]);
        await userEvent.keyboard(increase);
        expect(input).toHaveValue('51');
        await userEvent.keyboard(`${decrease}${decrease}`);
        expect(input).toHaveValue('49');
    });

    it('范围', async () => {
        render(() => (
            <div style={{ width: '800px', 'margin-left': '20px' }}>
                <Slider showBoundary />
                <Slider max={50} min={10} showBoundary />
                <Slider defaultValue={[20, 60]} range />
            </div>
        ));
        const [, , minInput, maxInput] = getInputs();
        const minHandle = getHandles()[2];
        const press = async (input: HTMLInputElement, key: string, value: string) => {
            await userEvent.keyboard(key);
            expect(input).toHaveValue(value);
        };
        await userEvent.click(minHandle);
        await userEvent.keyboard('{PageUp}{PageUp}{PageUp}{PageUp}');
        expect(minInput).toHaveValue('60');
        await press(minInput, '{PageUp}', '60');
        await press(minInput, '{ArrowRight}', '60');
        await press(minInput, '{End}', '60');

        await tab();
        expect(maxInput).toHaveFocus();
        await press(maxInput, '{PageDown}', '60');
        await press(maxInput, '{ArrowLeft}', '60');
        await press(maxInput, '{Home}', '60');
        await press(maxInput, '{PageUp}', '70');
        await press(maxInput, '{End}', '100');

        await userEvent.click(minHandle);
        await press(minInput, '{PageDown}', '50');
        await press(minInput, '{Home}', '0');
    });

    const renderLabelled = () =>
        render(() => (
            <div style={{ width: '800px' }}>
                <label for="volume">Volume</label>
                <Slider id="volume" defaultValue={30} />
            </div>
        ));

    it('label 为滑块输入框提供可访问名称', () => {
        renderLabelled();
        expect(getInputs()[0]).toHaveAccessibleName('Volume');
    });

    // Safari focuses only text fields on a click, through a label too
    it.skipIf(isWebKit)('点击 label 会聚焦滑块输入框', async () => {
        renderLabelled();
        await userEvent.click(document.querySelector('label') as HTMLElement);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('键盘聚焦时在可见手柄上绘制焦点环，指针按下不绘制', async () => {
        // the theme is not loaded: give the focus token a value so the outline stays valid
        render(() => (
            <div style={{ width: '800px', '--semi-color-primary-light-active': 'rgb(1, 2, 3)' } as JSX.CSSProperties}>
                <Slider />
                <Slider />
            </div>
        ));
        const [handle] = getHandles();
        const input = handle.querySelector('input') as HTMLInputElement;
        expect(getComputedStyle(handle).outlineStyle).toBe('none');
        await userEvent.click(handle);
        expect(input).toHaveFocus();
        expect(getComputedStyle(handle).outlineStyle).toBe('none');
        await tab();
        await tab({ shift: true });
        expect(input).toHaveFocus();
        // longhands: engines serialize the outline shorthand in different orders
        const { outlineColor, outlineStyle, outlineWidth } = getComputedStyle(handle);
        expect({ outlineColor, outlineStyle, outlineWidth }).toEqual({ outlineColor: 'rgb(1, 2, 3)', outlineStyle: 'solid', outlineWidth: '2px' });
        expect(input.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        expect(handle.offsetWidth).toBe(24);
        expect(handle.offsetHeight).toBe(24);
    });

    it('悬停滑块手柄时显示 tooltip', async () => {
        render(() => (
            <div style={{ width: '800px', 'margin-left': '20px' }}>
                <Slider showBoundary />
            </div>
        ));
        await userEvent.hover(getHandles()[0]);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-handle-tooltip`)?.textContent).toMatch(/^0$/));
    });
});
