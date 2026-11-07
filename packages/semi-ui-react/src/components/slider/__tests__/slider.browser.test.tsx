import { useState, type CSSProperties } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ConfigProvider, { type ConfigProviderProps } from '@fibrae/semi-ui-react/config-provider';
import { isWebKit, tab } from '@test/utils/browser';
import Slider, { type SliderProps } from '../index';
const prefixCls = `${BASE_CLASS_PREFIX}-slider`;
type OnChange = NonNullable<SliderProps['onChange']>;

describe('Slider（浏览器）', () => {
    it('Fix2931：点击已滚动的水平 Slider 时，值设为指针下方的位置', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(
            <div style={{ position: 'relative', width: 500, height: 200, overflow: 'auto' }}>
                <Slider style={{ width: 2000 }} onChange={onChange} />
            </div>
        );
        const scroller = container.firstElementChild;
        scroller.scrollLeft = 1000;
        const rail = container.querySelector(`.${prefixCls}-rail`);
        const rect = rail.getBoundingClientRect();
        expect(rect.left).toBeLessThan(0);

        const offset = 1100;
        fireEvent.click(rail, { clientX: rect.left + offset, clientY: rect.top + rect.height / 2 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(Math.round((offset / rect.width) * 100));
        expect(container.querySelector('input[type="range"]')).toHaveValue(String(onChange.mock.calls[0][0]));
    });

    it('Fix2931：点击已滚动的垂直 Slider 时，值设为指针下方的位置', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(
            <div style={{ position: 'relative', width: 200, height: 200, overflow: 'auto' }}>
                <Slider style={{ height: 2000 }} vertical onChange={onChange} />
            </div>
        );
        const scroller = container.firstElementChild;
        scroller.scrollTop = 1000;
        const rail = container.querySelector(`.${prefixCls}-rail`);
        const rect = rail.getBoundingClientRect();
        expect(rect.top).toBeLessThan(0);

        const offset = 1100;
        fireEvent.click(rail, { clientX: rect.left + rect.width / 2, clientY: rect.top + offset });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(Math.round((offset / rect.height) * 100));
    });
});

describe('slider', () => {
    const renderSlider = (props) => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(
            <div style={{ width: 800, marginLeft: 20, marginTop: 40 }}>
                <Slider onChange={onChange} {...props} />
            </div>
        );
        return {
            onChange,
            rail: container.querySelector(`.${prefixCls}-rail`),
            handles: container.querySelectorAll(`.${prefixCls}-handle`),
        };
    };
    const clickRail = (rail, side) => {
        const rect = rail.getBoundingClientRect();
        const point = {
            right: [rect.right - 1, rect.top + rect.height / 2],
            left: [rect.left, rect.top + rect.height / 2],
            bottom: [rect.left + rect.width / 2, rect.bottom - 1],
        }[side];
        fireEvent.click(rail, { clientX: point[0], clientY: point[1] });
    };
    const dragHandle = (handle, clientX, clientY, pointerType = 'mouse') => {
        fireEvent.pointerDown(handle, { pointerId: 1, pointerType });
        fireEvent.pointerMove(document.body, { pointerId: 1, pointerType, clientX, clientY });
        fireEvent.pointerUp(window, { pointerId: 1, pointerType });
    };

    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针拖动滑块手柄', (pointerType) => {
        const { onChange, rail, handles } = renderSlider({});
        const railRect = rail.getBoundingClientRect();
        const handleRect = handles[0].getBoundingClientRect();
        const common = { pointerId: 1, pointerType };

        fireEvent.pointerDown(handles[0], {
            ...common,
            clientX: handleRect.left + handleRect.width / 2,
            clientY: handleRect.top + handleRect.height / 2,
        });
        fireEvent.pointerMove(document.body, { ...common, clientX: railRect.left + railRect.width / 2, clientY: 0 });
        fireEvent.pointerUp(window, common);

        expect(onChange).toHaveBeenLastCalledWith(50);
    });

    it('受控 slider', () => {
        const { onChange, rail, handles } = renderSlider({ value: 30 });
        const [handle] = handles;
        const initialRect = handle.getBoundingClientRect();

        clickRail(rail, 'right');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(handle.getBoundingClientRect()).toEqual(initialRect);

        dragHandle(handle, 600, 0);
        expect(handle.getBoundingClientRect()).toEqual(initialRect);
        expect(handle.querySelector('input')).toHaveValue('30');
    });

    it('带 onChange 的受控 slider', async () => {
        function Demo({ onChange }) {
            const [value, setValue] = useState<number | number[]>(30);
            return (
                <div style={{ width: 800, marginLeft: 20, marginTop: 40 }}>
                    <Slider
                        value={value}
                        onChange={(v) => {
                            onChange(v);
                            setValue(v);
                        }}
                    />
                </div>
            );
        }
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Demo onChange={onChange} />);
        const rail = container.querySelector(`.${prefixCls}-rail`);
        const handle = container.querySelector<HTMLElement>(`.${prefixCls}-handle`);

        clickRail(rail, 'right');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(handle.style.left).toBe('100%');

        // Drop on the wrapper: the track covers the rail and Playwright refuses targets that are covered
        const wrapper = container.firstElementChild;
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
        const initialRects = [...handles].map((handle) => handle.getBoundingClientRect());

        clickRail(rail, 'right');
        expect(onChange).toHaveBeenLastCalledWith([10, 100]);
        clickRail(rail, 'left');
        expect(onChange).toHaveBeenLastCalledWith([0, 30]);
        expect([...handles].map((handle) => handle.getBoundingClientRect())).toEqual(initialRects);

        dragHandle(handles[0], 100, 0);
        dragHandle(handles[1], 600, 0);
        expect([...handles].map((handle) => handle.getBoundingClientRect())).toEqual(initialRects);
    });

    it('受控垂直 slider', () => {
        const { onChange, rail, handles } = renderSlider({ value: 40, vertical: true, style: { height: 300 } });
        const [handle] = handles;
        const initialRect = handle.getBoundingClientRect();

        clickRail(rail, 'bottom');
        expect(onChange).toHaveBeenLastCalledWith(100);
        expect(handle.getBoundingClientRect()).toEqual(initialRect);

        dragHandle(handle, 0, 600);
        expect(handle.getBoundingClientRect()).toEqual(initialRect);
    });

    const renderHorizontalSliders = () => {
        const { container } = render(
            <div style={{ width: 800, marginLeft: 20 }}>
                <Slider showBoundary />
                <Slider max={50} min={10} showBoundary />
                <Slider defaultValue={[20, 60]} range />
            </div>
        );
        return {
            handles: container.querySelectorAll(`.${prefixCls}-handle`),
            inputs: container.querySelectorAll('input[type="range"]'),
        };
    };

    it('键盘', async () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(
            <div style={{ width: 800, marginLeft: 20 }}>
                <Slider onChange={onChange} />
                <Slider />
            </div>
        );
        const [handle] = container.querySelectorAll(`.${prefixCls}-handle`);
        const [input, next] = container.querySelectorAll('input[type="range"]');
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
        ['rtl', { direction: 'rtl' }, {}, ['{ArrowLeft}', '{ArrowRight}']],
        ['vertical', {}, { vertical: true }, ['{ArrowDown}', '{ArrowUp}']],
        ['verticalReverse', {}, { vertical: true, verticalReverse: true }, ['{ArrowUp}', '{ArrowDown}']],
    ])('%s slider 中的方向键', async (_, providerProps, sliderProps, [increase, decrease]) => {
        const { container } = render(
            <ConfigProvider {...(providerProps as ConfigProviderProps)}>
                <div style={{ width: 300, height: 300 }}>
                    <Slider defaultValue={50} {...sliderProps} />
                </div>
            </ConfigProvider>
        );
        const input = container.querySelector('input[type="range"]');
        await userEvent.click(container.querySelector(`.${prefixCls}-handle`));
        await userEvent.keyboard(increase);
        expect(input).toHaveValue('51');
        await userEvent.keyboard(`${decrease}${decrease}`);
        expect(input).toHaveValue('49');
    });

    it('范围', async () => {
        const {
            inputs: [, , minInput, maxInput],
            handles: [, , minHandle],
        } = renderHorizontalSliders();
        const press = async (input, key, value) => {
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
        render(
            <div style={{ width: 800 }}>
                <label htmlFor="volume">Volume</label>
                <Slider id="volume" defaultValue={30} />
            </div>
        ).container;

    it('label 为滑块输入框提供可访问名称', () => {
        expect(renderLabelled().querySelector('input[type="range"]')).toHaveAccessibleName('Volume');
    });

    // Safari focuses only text fields on a click, through a label too
    it.skipIf(isWebKit)('点击 label 会聚焦滑块输入框', async () => {
        const container = renderLabelled();
        await userEvent.click(container.querySelector('label'));
        expect(container.querySelector('input[type="range"]')).toHaveFocus();
    });

    it('键盘聚焦时在可见手柄上绘制焦点环，指针按下不绘制', async () => {
        // the theme is not loaded: give the focus token a value so the outline stays valid
        const { container } = render(
            <div style={{ width: 800, '--semi-color-primary-light-active': 'rgb(1, 2, 3)' } as CSSProperties}>
                <Slider />
                <Slider />
            </div>
        );
        const [handle] = container.querySelectorAll<HTMLElement>(`.${prefixCls}-handle`);
        const input = handle.querySelector('input');
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
        const {
            handles: [handle],
        } = renderHorizontalSliders();
        await userEvent.hover(handle);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-handle-tooltip`)).toMatchTextContent(/^0$/));
    });
});
