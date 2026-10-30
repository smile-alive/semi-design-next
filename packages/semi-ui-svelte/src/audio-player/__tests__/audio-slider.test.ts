import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { AudioSliderProps } from '../interface';
import SliderFixture from './slider-fixture.svelte';

const prefixCls = 'semi-audio-player';

function mockTrackRect(rect: DOMRect) {
    const real = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains(`${prefixCls}-slider`) ? rect : real.call(this);
    });
}

function query(container: Element, selector: string) {
    const found = container.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
}

function setup(props: Partial<AudioSliderProps> = {}) {
    const store = createStore<{ props: AudioSliderProps }>({ props: { label: 'Progress', getValueText: String, ...props } });
    const view = render(SliderFixture, { props: { store } });
    return { store, ...view };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Svelte AudioSlider', () => {
    it('原生 range 带 max、value、名称与朗读文本', () => {
        setup({ value: 30, max: 120, getValueText: (v) => `${v}s` });
        const slider = screen.getByRole('slider', { name: 'Progress' });
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute('max', '120');
        expect(slider).toHaveValue('30');
        expect(slider).toHaveAttribute('aria-valuetext', '30s');
        expect(slider).not.toHaveAttribute('aria-orientation');
    });

    it('竖向时声明 aria-orientation，数值 height 换算为 px', () => {
        const { container } = setup({ vertical: true, height: 120, label: 'Volume' });
        expect(screen.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical');
        expect(query(container, `.${prefixCls}-slider`).style.height).toBe('120px');
        expect(query(container, `.${prefixCls}-slider-wrapper`)).toHaveClass(`${prefixCls}-slider-wrapper-vertical`);
    });

    it('外层包装 tabindex 为 -1，Tooltip 不再注入 0', () => {
        const { container } = setup();
        expect(query(container, `.${prefixCls}-slider-wrapper`)).toHaveAttribute('tabindex', '-1');
        expect(container.querySelector('[tabindex="0"]')).toBeNull();
    });

    it('showTooltip 为 false 时不包 Tooltip', () => {
        const { container } = setup({ showTooltip: false });
        expect(container.querySelector('[data-popupid]')).toBeNull();
        expect(query(container, `.${prefixCls}-slider-wrapper`)).toBeInTheDocument();
    });

    it('showTooltip 为 true 时包 Tooltip，触发器就是外层包装', () => {
        const { container } = setup();
        expect(query(container, `.${prefixCls}-slider-wrapper`)).toHaveAttribute('data-popupid');
    });

    it('range 输入时以数值调用 onChange', async () => {
        const onChange = vi.fn<(value: number) => void>();
        setup({ onChange });
        await fireEvent.input(screen.getByRole('slider'), { target: { value: '42' } });
        expect(onChange).toHaveBeenCalledExactlyOnceWith(42);
    });

    it('按下即跳转，拖动中跟随，失去指针捕获后停止', async () => {
        mockTrackRect(new DOMRect(0, 0, 200, 4));
        const onChange = vi.fn<(value: number) => void>();
        const { container } = setup({ max: 60, onChange });
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
        await fireEvent.pointerDown(wrapper, { pointerId: 3, clientX: 50 });
        flushSync();
        expect(onChange).toHaveBeenLastCalledWith(15);
        expect(capture.mock.contexts).toEqual([wrapper]);
        expect(capture.mock.calls).toEqual([[3]]);
        expect(document.activeElement).toBe(screen.getByRole('slider'));
        expect(wrapper).toHaveClass(`${prefixCls}-slider-wrapper-dragging`);
        await fireEvent.pointerMove(wrapper, { clientX: 100 });
        expect(onChange).toHaveBeenLastCalledWith(30);
        await fireEvent.lostPointerCapture(wrapper);
        await fireEvent.pointerMove(wrapper, { clientX: 150 });
        // a hover alone does not seek
        await fireEvent.mouseEnter(wrapper, { clientX: 180 });
        flushSync();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(wrapper).not.toHaveClass(`${prefixCls}-slider-wrapper-dragging`);
    });

    it('圆点与进度按 value / max 定位，max 为 0 时停在起点', () => {
        const { container, store } = setup({ value: 30, max: 60 });
        expect(query(container, `.${prefixCls}-slider-progress`).style.width).toBe('50%');
        store.props = { ...store.props, max: 0 };
        flushSync();
        expect(query(container, `.${prefixCls}-slider-progress`).style.width).toBe('0%');
        expect(query(container, `.${prefixCls}-slider-dot`).style.left).toBe('calc(0% - 8px)');
    });
});
