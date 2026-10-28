/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { isWebKit, tab } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Slider from '..';
import ConfigProvider from '../../config-provider';
import Model from './fixtures/model.vue';

type OnChange = (value: number | number[]) => void;
type Props = Record<string, unknown>;

const prefixCls = `${BASE_CLASS_PREFIX}-slider`;
const pointer = (type: string, target: EventTarget, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, ...init }));
const click = (target: Element, clientX: number, clientY: number) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }));
const flush = () => new Promise((resolve) => requestAnimationFrame(resolve));

// Click and slider positions both come from viewport rects, which already reflect the scroll; adding the scroll
// container's scrollLeft/scrollTop on top of them would push the value past the click towards max
describe('Slider（浏览器）', () => {
    it('点击已滚动的水平 Slider 时，值设为指针下方的位置', async () => {
        const change = vi.fn<OnChange>();
        const { container } = render({
            render: () => (
                <div style={{ position: 'relative', width: '500px', height: '200px', overflow: 'auto' }}>
                    <Slider style={{ width: '2000px' }} onChange={change} />
                </div>
            ),
        });
        (container.firstElementChild as HTMLElement).scrollLeft = 1000;
        const rail = container.querySelector(`.${prefixCls}-rail`) as HTMLElement;
        const rect = rail.getBoundingClientRect();
        expect(rect.left).toBeLessThan(0);

        const offset = 1100;
        click(rail, rect.left + offset, rect.top + rect.height / 2);
        await flush();
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0]).toBe(Math.round((offset / rect.width) * 100));
        expect(screen.getByRole('slider')).toHaveValue(String(change.mock.calls[0]?.[0]));
    });

    it('点击已滚动的垂直 Slider 时，值设为指针下方的位置', () => {
        const change = vi.fn<OnChange>();
        const { container } = render({
            render: () => (
                <div style={{ position: 'relative', width: '200px', height: '200px', overflow: 'auto' }}>
                    <Slider style={{ height: '2000px' }} vertical onChange={change} />
                </div>
            ),
        });
        (container.firstElementChild as HTMLElement).scrollTop = 1000;
        const rail = container.querySelector(`.${prefixCls}-rail`) as HTMLElement;
        const rect = rail.getBoundingClientRect();
        expect(rect.top).toBeLessThan(0);

        const offset = 1100;
        click(rail, rect.left + rect.width / 2, rect.top + offset);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0]).toBe(Math.round((offset / rect.height) * 100));
    });
});

describe('Slider 交互（浏览器）', () => {
    const renderSlider = (props: Props) => {
        const change = vi.fn<OnChange>();
        const { container } = render({
            render: () => (
                <div style={{ width: '800px', marginLeft: '20px', marginTop: '40px' }}>
                    <Slider {...props} onChange={change} />
                </div>
            ),
        });
        return {
            change,
            rail: container.querySelector(`.${prefixCls}-rail`) as HTMLElement,
            handles: [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-handle`)],
        };
    };
    const clickRail = (rail: HTMLElement, side: 'right' | 'left' | 'bottom') => {
        const rect = rail.getBoundingClientRect();
        const point = {
            right: [rect.right - 1, rect.top + rect.height / 2],
            left: [rect.left, rect.top + rect.height / 2],
            bottom: [rect.left + rect.width / 2, rect.bottom - 1],
        }[side] as [number, number];
        click(rail, ...point);
    };
    const dragHandle = (handle: HTMLElement, clientX: number, clientY: number, pointerType = 'mouse') => {
        pointer('pointerdown', handle, { pointerType });
        pointer('pointermove', document.body, { pointerType, clientX, clientY });
        pointer('pointerup', window, { pointerType });
    };
    const rects = (handles: HTMLElement[]) => handles.map((handle) => handle.getBoundingClientRect());

    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针拖动滑块手柄', async (pointerType) => {
        const { change, rail, handles } = renderSlider({});
        const handle = handles[0] as HTMLElement;
        const railRect = rail.getBoundingClientRect();
        const handleRect = handle.getBoundingClientRect();

        pointer('pointerdown', handle, {
            pointerType,
            clientX: handleRect.left + handleRect.width / 2,
            clientY: handleRect.top + handleRect.height / 2,
        });
        pointer('pointermove', document.body, { pointerType, clientX: railRect.left + railRect.width / 2, clientY: 0 });
        pointer('pointerup', window, { pointerType });

        expect(change).toHaveBeenLastCalledWith(50);
    });

    it('受控 slider', async () => {
        const { change, rail, handles } = renderSlider({ modelValue: 30 });
        const handle = handles[0] as HTMLElement;
        const initialRect = handle.getBoundingClientRect();

        clickRail(rail, 'right');
        await flush();
        expect(change).toHaveBeenLastCalledWith(100);
        expect(handle.getBoundingClientRect()).toEqual(initialRect);

        dragHandle(handle, 600, 0);
        await flush();
        expect(handle.getBoundingClientRect()).toEqual(initialRect);
        expect(handle.querySelector('input')).toHaveValue('30');
    });

    it('v-model 的 slider 跟随点击与拖动', async () => {
        const change = vi.fn<OnChange>();
        const { container } = render({
            render: () => (
                <div style={{ width: '800px', marginLeft: '20px', marginTop: '40px' }}>
                    <Model onChange={change} />
                </div>
            ),
        });
        const rail = container.querySelector(`.${prefixCls}-rail`) as HTMLElement;
        const handle = container.querySelector(`.${prefixCls}-handle`) as HTMLElement;

        clickRail(rail, 'right');
        await waitFor(() => expect(handle.style.left).toBe('100%'));
        expect(change).toHaveBeenLastCalledWith(100);

        // Drop on the wrapper: the track covers the rail and Playwright refuses targets that are covered
        const wrapper = container.querySelector(`.${prefixCls}-wrapper`) as HTMLElement;
        const wrapperRect = wrapper.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        await userEvent.dragAndDrop(handle, wrapper, {
            targetPosition: {
                x: railRect.left - wrapperRect.left + railRect.width * 0.32,
                y: railRect.top - wrapperRect.top + railRect.height / 2,
            },
        });
        expect(change).toHaveBeenLastCalledWith(32);
        await waitFor(() => expect(handle.style.left).toBe('32%'));
    });

    it('受控范围 slider', async () => {
        const { change, rail, handles } = renderSlider({ modelValue: [10, 30], range: true });
        const initialRects = rects(handles);

        clickRail(rail, 'right');
        expect(change).toHaveBeenLastCalledWith([10, 100]);
        clickRail(rail, 'left');
        expect(change).toHaveBeenLastCalledWith([0, 30]);
        await flush();
        expect(rects(handles)).toEqual(initialRects);

        dragHandle(handles[0] as HTMLElement, 100, 0);
        dragHandle(handles[1] as HTMLElement, 600, 0);
        await flush();
        expect(rects(handles)).toEqual(initialRects);
    });

    it('受控垂直 slider', async () => {
        const { change, rail, handles } = renderSlider({ modelValue: 40, vertical: true, style: { height: '300px' } });
        const handle = handles[0] as HTMLElement;
        const initialRect = handle.getBoundingClientRect();

        clickRail(rail, 'bottom');
        await flush();
        expect(change).toHaveBeenLastCalledWith(100);
        expect(handle.getBoundingClientRect()).toEqual(initialRect);

        dragHandle(handle, 0, 600);
        await flush();
        expect(handle.getBoundingClientRect()).toEqual(initialRect);
    });

    const renderHorizontalSliders = () => {
        const { container } = render({
            render: () => (
                <div style={{ width: '800px', marginLeft: '20px' }}>
                    <Slider showBoundary />
                    <Slider max={50} min={10} showBoundary />
                    <Slider defaultValue={[20, 60]} range />
                </div>
            ),
        });
        return {
            handles: [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-handle`)],
            inputs: [...container.querySelectorAll<HTMLInputElement>('input[type="range"]')],
        };
    };

    it('键盘', async () => {
        const change = vi.fn<OnChange>();
        const { container } = render({
            render: () => (
                <div style={{ width: '800px', marginLeft: '20px' }}>
                    <Slider onChange={change} />
                    <Slider />
                </div>
            ),
        });
        const handle = container.querySelector(`.${prefixCls}-handle`) as HTMLElement;
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
            await userEvent.keyboard(key as string);
            expect(input).toHaveValue(value);
            expect(change).toHaveBeenLastCalledWith(Number(value));
        }
        await tab();
        expect(next).toHaveFocus();
    });

    it.each([
        ['rtl', { direction: 'rtl' }, {}, ['{ArrowLeft}', '{ArrowRight}']],
        ['vertical', {}, { vertical: true }, ['{ArrowDown}', '{ArrowUp}']],
        ['verticalReverse', {}, { vertical: true, verticalReverse: true }, ['{ArrowUp}', '{ArrowDown}']],
    ] as const)('%s slider 中的方向键', async (_, providerProps, sliderProps, [increase, decrease]) => {
        const { container } = render({
            render: () => (
                <ConfigProvider {...providerProps}>
                    {() => (
                        <div style={{ width: '300px', height: '300px' }}>
                            <Slider defaultValue={50} {...sliderProps} />
                        </div>
                    )}
                </ConfigProvider>
            ),
        });
        const input = container.querySelector('input[type="range"]');
        await userEvent.click(container.querySelector(`.${prefixCls}-handle`) as HTMLElement);
        await userEvent.keyboard(increase);
        expect(input).toHaveValue('51');
        await userEvent.keyboard(`${decrease}${decrease}`);
        expect(input).toHaveValue('49');
    });

    it('范围', async () => {
        const { inputs, handles } = renderHorizontalSliders();
        const [, , minInput, maxInput] = inputs as [HTMLInputElement, HTMLInputElement, HTMLInputElement, HTMLInputElement];
        const minHandle = handles[2] as HTMLElement;
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
        render({
            render: () => (
                <div style={{ width: '800px' }}>
                    <label for="volume">Volume</label>
                    <Slider id="volume" defaultValue={30} />
                </div>
            ),
        }).container;

    it('label 为滑块输入框提供可访问名称', () => {
        expect(renderLabelled().querySelector('input[type="range"]')).toHaveAccessibleName('Volume');
    });

    // Safari focuses only text fields on a click, through a label too
    it.skipIf(isWebKit)('点击 label 会聚焦滑块输入框', async () => {
        const container = renderLabelled();
        await userEvent.click(container.querySelector('label') as HTMLElement);
        expect(container.querySelector('input[type="range"]')).toHaveFocus();
    });

    it('键盘聚焦时在可见手柄上绘制焦点环，指针按下不绘制', async () => {
        // the theme is not loaded here: give the focus token a value so the outline is not invalid at computed time
        const { container } = render({
            render: () => (
                <div style={{ width: '800px', '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                    <Slider />
                    <Slider />
                </div>
            ),
        });
        const handle = container.querySelector(`.${prefixCls}-handle`) as HTMLElement;
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
        const { handles } = renderHorizontalSliders();
        await userEvent.hover(handles[0] as HTMLElement);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-handle-tooltip`)).toMatchTextContent(/^0$/));
    });
});
