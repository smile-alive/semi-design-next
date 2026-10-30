import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { isWebKit, mouse, tab } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { SliderProps } from '../interface';
import SliderBrowser from './slider-browser.svelte';
import SliderConfig from './slider-config.svelte';
import SliderLabelled from './slider-labelled.svelte';
import SliderScroll from './slider-scroll.svelte';

type OnChange = (value: number | number[]) => void;
type Value = number | number[] | undefined;

const prefix = 'semi-slider';
const pointer = (type: string, target: EventTarget, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, ...init }));
const click = (target: Element, clientX: number, clientY: number) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }));
const flush = () => new Promise((resolve) => requestAnimationFrame(resolve));

function setup(props: SliderProps = {}, { bound = false, value, count = 1, rootStyle }: { bound?: boolean; value?: Value; count?: number; rootStyle?: string } = {}) {
    const change = vi.fn<OnChange>();
    const store = createStore<{ props: SliderProps; value?: Value }>({ props: { onChange: change, ...props }, value });
    const { container } = render(SliderBrowser, { props: { store, bound, count, ...(rootStyle ? { rootStyle } : {}) } });
    flushSync();
    return {
        store,
        change,
        container,
        rail: container.querySelector(`.${prefix}-rail`) as HTMLElement,
        handles: [...container.querySelectorAll<HTMLElement>(`.${prefix}-handle`)],
        inputs: [...container.querySelectorAll<HTMLInputElement>('input[type="range"]')],
    };
}

function clickRail(rail: HTMLElement, side: 'right' | 'left' | 'bottom') {
    const rect = rail.getBoundingClientRect();
    const point = {
        right: [rect.right - 1, rect.top + rect.height / 2],
        left: [rect.left, rect.top + rect.height / 2],
        bottom: [rect.left + rect.width / 2, rect.bottom - 1],
    }[side] as [number, number];
    click(rail, ...point);
}
function dragHandle(handle: HTMLElement, clientX: number, clientY: number, pointerType = 'mouse') {
    pointer('pointerdown', handle, { pointerType });
    pointer('pointermove', document.body, { pointerType, clientX, clientY });
    pointer('pointerup', window, { pointerType });
}
const rects = (handles: HTMLElement[]) => handles.map((handle) => handle.getBoundingClientRect());
function center(el: Element) {
    const { left, top, width, height } = el.getBoundingClientRect();
    return { x: left + width / 2, y: top + height / 2 };
}

// Click and slider positions both come from viewport rects, which already reflect the scroll; adding the scroll
// container's scrollLeft/scrollTop on top of them would push the value past the click towards max
describe('Svelte Slider（浏览器）滚动容器', () => {
    it('点击已滚动的水平 Slider 时，值设为指针下方的位置', async () => {
        const change = vi.fn<OnChange>();
        const { container } = render(SliderScroll, { props: { props: { onChange: change } } });
        (container.firstElementChild as HTMLElement).scrollLeft = 1000;
        const rail = container.querySelector(`.${prefix}-rail`) as HTMLElement;
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
        const { container } = render(SliderScroll, { props: { props: { onChange: change }, vertical: true } });
        (container.firstElementChild as HTMLElement).scrollTop = 1000;
        const rail = container.querySelector(`.${prefix}-rail`) as HTMLElement;
        const rect = rail.getBoundingClientRect();
        expect(rect.top).toBeLessThan(0);

        const offset = 1100;
        click(rail, rect.left + rect.width / 2, rect.top + offset);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0]?.[0]).toBe(Math.round((offset / rect.height) * 100));
    });
});

describe('Svelte Slider 拖动（浏览器）', () => {
    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针拖动滑块手柄', (pointerType) => {
        const { change, rail, handles } = setup();
        const handle = handles[0] as HTMLElement;
        const railRect = rail.getBoundingClientRect();
        const handleRect = handle.getBoundingClientRect();

        pointer('pointerdown', handle, { pointerType, clientX: handleRect.left + handleRect.width / 2, clientY: handleRect.top + handleRect.height / 2 });
        pointer('pointermove', document.body, { pointerType, clientX: railRect.left + railRect.width / 2, clientY: 0 });
        pointer('pointerup', window, { pointerType });

        expect(change).toHaveBeenLastCalledWith(50);
    });

    it('真实鼠标按住手柄拖动，松开后手柄停在指针位置', async () => {
        const { change, rail, handles, inputs } = setup();
        const handle = handles[0] as HTMLElement;
        const railRect = rail.getBoundingClientRect();
        const from = center(handle);
        await mouse('move', from.x, from.y);
        await mouse('down', from.x, from.y);
        await mouse('move', railRect.left + railRect.width * 0.3, from.y);
        await mouse('move', railRect.left + railRect.width * 0.6, from.y);
        await mouse('up', railRect.left + railRect.width * 0.6, from.y);
        expect(change).toHaveBeenLastCalledWith(60);
        expect(inputs[0]).toHaveValue('60');
        await waitFor(() => expect(handle.style.left).toBe('60%'));
    });

    it('单向传值：点击报告新值，手柄在本地跟随', async () => {
        const { change, rail, handles } = setup({ value: 30 });
        const handle = handles[0] as HTMLElement;
        clickRail(rail, 'right');
        await flush();
        expect(change).toHaveBeenLastCalledWith(100);
        expect(handle.style.left).toBe('100%');
    });

    it('单向传值：真实方向键与拖动后手柄在本地移动，父级再传新值时跟随新值', async () => {
        const { change, rail, handles, inputs, store } = setup({ value: 30 });
        const handle = handles[0] as HTMLElement;
        inputs[0]?.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(change).toHaveBeenLastCalledWith(31);
        await waitFor(() => expect(handle.style.left).toBe('31%'));

        const railRect = rail.getBoundingClientRect();
        const from = center(handle);
        await mouse('move', from.x, from.y);
        await mouse('down', from.x, from.y);
        await mouse('move', railRect.left + railRect.width * 0.6, from.y);
        await mouse('up', railRect.left + railRect.width * 0.6, from.y);
        await waitFor(() => expect(handle.style.left).toBe('60%'));

        store.props = { ...store.props, value: 80 };
        flushSync();
        await waitFor(() => expect(handle.style.left).toBe('80%'));
    });

    it('bind:value 的 slider 跟随点击与拖动', async () => {
        const { change, rail, handles, container, store } = setup({}, { bound: true, value: 30 });
        const handle = handles[0] as HTMLElement;

        clickRail(rail, 'right');
        await waitFor(() => expect(handle.style.left).toBe('100%'));
        expect(change).toHaveBeenLastCalledWith(100);
        expect(store.value).toBe(100);

        // Drop on the wrapper: the track covers the rail and Playwright refuses targets that are covered
        const wrapper = container.querySelector(`.${prefix}-wrapper`) as HTMLElement;
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
        expect(store.value).toBe(32);
    });

    it('范围 slider：两端手柄各自拖动，不越过对方', async () => {
        const { change, rail, handles } = setup({ range: true }, { bound: true, value: [10, 30] });
        clickRail(rail, 'right');
        await flush();
        expect(change).toHaveBeenLastCalledWith([10, 100]);
        clickRail(rail, 'left');
        await flush();
        expect(change).toHaveBeenLastCalledWith([0, 100]);
        const railRect = rail.getBoundingClientRect();
        // the min handle dragged past the max handle stops at it
        dragHandle(handles[0] as HTMLElement, railRect.right + 200, 0);
        await flush();
        expect(rects(handles)[0]?.left).toBeLessThanOrEqual(rects(handles)[1]?.left as number);
    });

    it('垂直 slider：沿 y 轴点击与拖动', async () => {
        const { change, rail, handles } = setup({ vertical: true, style: 'height: 300px' });
        const handle = handles[0] as HTMLElement;
        clickRail(rail, 'bottom');
        await flush();
        expect(change).toHaveBeenLastCalledWith(100);
        const railRect = rail.getBoundingClientRect();
        const from = center(handle);
        pointer('pointerdown', handle, { clientX: from.x, clientY: from.y });
        pointer('pointermove', document.body, { clientX: from.x, clientY: railRect.top + railRect.height / 2 });
        pointer('pointerup', window, {});
        await flush();
        expect(change).toHaveBeenLastCalledWith(50);
    });
});

describe('Svelte Slider 键盘（浏览器）', () => {
    it('方向键、Page、Home、End 改值，Tab 到下一个滑块', async () => {
        const { change, handles, inputs } = setup({}, { count: 2 });
        const [input, next] = inputs as [HTMLInputElement, HTMLInputElement];
        await userEvent.click(handles[0] as HTMLElement);
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
    ] as const)('%s slider 中的方向键', async (_, config, sliderProps, [increase, decrease]) => {
        const { container } = render(SliderConfig, { props: { props: { value: 50, style: 'width: 300px; height: 300px', ...sliderProps }, ...config } });
        flushSync();
        const input = container.querySelector('input[type="range"]');
        await userEvent.click(container.querySelector(`.${prefix}-handle`) as HTMLElement);
        await userEvent.keyboard(increase);
        expect(input).toHaveValue('51');
        await userEvent.keyboard(`${decrease}${decrease}`);
        expect(input).toHaveValue('49');
    });

    it('范围：最小值滑块不越过最大值滑块，反之亦然', async () => {
        const { inputs, handles } = setup({ range: true }, { bound: true, value: [20, 60] });
        const [minInput, maxInput] = inputs as [HTMLInputElement, HTMLInputElement];
        const press = async (input: HTMLInputElement, key: string, value: string) => {
            await userEvent.keyboard(key);
            expect(input).toHaveValue(value);
        };
        await userEvent.click(handles[0] as HTMLElement);
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

        await userEvent.click(handles[0] as HTMLElement);
        await press(minInput, '{PageDown}', '50');
        await press(minInput, '{Home}', '0');
    });

    it('label 为滑块输入框提供可访问名称', () => {
        const { container } = render(SliderLabelled, { props: { kind: 'for' } });
        expect(container.querySelector('input[type="range"]')).toHaveAccessibleName('Volume');
    });

    // Safari focuses only text fields on a click, through a label too
    it.skipIf(isWebKit)('点击 label 会聚焦滑块输入框', async () => {
        const { container } = render(SliderLabelled, { props: { kind: 'for' } });
        await userEvent.click(container.querySelector('label') as HTMLElement);
        expect(container.querySelector('input[type="range"]')).toHaveFocus();
    });

    it('键盘聚焦时在可见手柄上绘制焦点环，指针按下不绘制', async () => {
        // the theme is not loaded here: give the focus token a value so the outline is not invalid at computed time
        const { handles, inputs } = setup({}, { count: 2, rootStyle: 'width: 800px; --semi-color-primary-light-active: rgb(1, 2, 3)' });
        const handle = handles[0] as HTMLElement;
        const input = inputs[0] as HTMLInputElement;
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
        const { handles } = setup({ showBoundary: true });
        await userEvent.hover(handles[0] as HTMLElement);
        await waitFor(() => expect(document.querySelector(`.${prefix}-handle-tooltip`)?.textContent?.trim()).toBe('0'));
    });
});
