import React, { StrictMode, createRef } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Progress, { type ProgressProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-progress`;

const renderProgress = (props = {}) => {
    const result = render(<Progress {...props} />);
    return { ...result, rerender: (nextProps) => result.rerender(<Progress {...nextProps} />) };
};
const getProgressbar = () => screen.getByRole('progressbar');

describe('Progress', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('percent 传入 NaN 等非法值', () => {
        // React reports the uncaught lifecycle error to window and console before rethrowing it
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const silence = (e) => e.preventDefault();
        window.addEventListener('error', silence);
        const { rerender } = renderProgress({ percent: 30 });
        function testNaN() {
            rerender({ percent: NaN });
        }
        expect(testNaN).toThrow('[Semi Progress]:percent can not be NaN');
        window.removeEventListener('error', silence);
    });

    it('正常渲染', () => {
        const { container } = renderProgress();
        expect(container.querySelectorAll(`.${prefixCls}`)).toHaveLength(1);
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '0');
    });

    it('渲染环形进度条', () => {
        const { container } = renderProgress({ type: 'circle' });
        expect(container.querySelectorAll(`svg.${prefixCls}-circle-ring`)).toHaveLength(1);
    });

    it('进度变化后成功', async () => {
        const { rerender } = renderProgress({ type: 'circle', percent: 30 });
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '30');
        rerender({ type: 'circle', percent: 50 });
        // the 300ms tween reads Date.now, frozen by vitest/setup.ts
        vi.setSystemTime(Date.now() + 300);
        await waitFor(() => expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50'));
    });

    it('className 与 style', () => {
        renderProgress({ className: 'test', style: { color: 'red' } });
        const node = getProgressbar();
        expect(node).toHaveClass(prefixCls, 'test');
        expect(node).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('showInfo', () => {
        const { container } = renderProgress({ showInfo: true, percent: 50 });
        expect(container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^50%$/);
    });

    it('stroke、size 与 orbitStroke', () => {
        let props = {
            stroke: '#fc8800',
            size: 'small',
            orbitStroke: '#f93920',
        };
        const { container, rerender } = renderProgress(props);
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-large`);
        expect(container.querySelector(`.${prefixCls}-track`)).toHaveStyle({ backgroundColor: 'rgb(249, 57, 32)' });
        expect(container.querySelector(`.${prefixCls}-track-inner`)).toHaveStyle({ backgroundColor: 'rgb(252, 136, 0)' });

        rerender({ ...props, size: 'large' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-large`);
    });

    it('渐变准确性 [strokeGradient 为 true 且 stroke 类型为数组]', () => {
        let props = {
            stroke: [
                {
                    percent: 50,
                    color: '#fff',
                },
                {
                    percent: 52,
                    color: 'rgba(0, 0, 0, 0)',
                },
            ],
            strokeGradient: true,
            percent: 51,
            type: 'circle',
        };
        const { container } = renderProgress(props);
        const style = container.querySelector(`.${prefixCls}-circle-ring-inner`).getAttribute('style');
        // jsdom normalizes the colors and drops the default 50% of the color-mix() the component sets
        expect(style).toEqual('stroke: color-mix(in srgb, rgba(0, 0, 0, 0), rgb(255, 255, 255));');
    });

    it('rgba 色标的小数透明度不会被截成 0', () => {
        const { container } = renderProgress({
            stroke: [{ percent: 0, color: 'rgba(255, 0, 0, 0.5)' }],
            percent: 50,
            type: 'circle',
        });
        const style = container.querySelector(`.${prefixCls}-circle-ring-inner`).getAttribute('style');
        expect(style).toEqual('stroke: rgba(255, 0, 0, 0.5);');
    });

    it('percent 小于 0 时按 0 处的色标选色', () => {
        const { container } = renderProgress({ stroke: [{ percent: 0, color: '#fff' }], percent: -10, type: 'circle' });
        expect(container.querySelector(`.${prefixCls}-circle-ring-inner`).getAttribute('style')).toEqual('stroke: rgb(255, 255, 255);');
    });

    it('渐变准确性 [strokeGradient 为 false 且 stroke 类型为数组]', () => {
        let props = {
            stroke: [
                {
                    percent: 3,
                    color: '#fff',
                },
            ],
            percent: 90,
            type: 'circle',
        };
        const { container } = renderProgress(props);
        const style = container.querySelector(`.${prefixCls}-circle-ring-inner`).getAttribute('style');
        expect(style).toEqual('stroke: rgb(255, 255, 255);');
    });

    it('不重新排序 stroke 属性数组', () => {
        const stroke = [
            { percent: 80, color: '#000' },
            { percent: 20, color: '#fff' },
        ];
        const { container } = renderProgress({ stroke, percent: 10, type: 'circle' });
        const style = container.querySelector(`.${prefixCls}-circle-ring-inner`).getAttribute('style');
        expect(style).not.toBeNull();
        expect(stroke.map((item) => item.percent)).toEqual([80, 20]);
    });

    it('渐变兼容性 [strokeGradient 为 true 且 stroke 类型为数组]', () => {
        let props = {
            stroke: [
                { percent: 0, color: 'red' },
                { percent: 10, color: '#b2140c' },
                { percent: 50, color: 'rgb(0, 99, 167)' },
                { percent: 100, color: 'hsla(125, 50%, 46%, 1)' },
            ],
            strokeGradient: true,
            percent: 55,
            type: 'circle',
        };
        const { container } = renderProgress(props);
        const style = container.querySelector(`.${prefixCls}-circle-ring-inner`).getAttribute('style');
        // jsdom serializes the hsla() stop in rgb() form; the browser test checks the mixed color
        expect(style).toEqual('stroke: color-mix(in srgb, rgb(59, 176, 68) 10%, rgb(0, 99, 167));');
    });

    it('direction', () => {
        renderProgress({ direction: 'vertical' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
    });

    it('format', () => {
        let props = {
            percent: 70,
            showInfo: true,
            format: () => 'semi',
            type: 'circle',
        };
        const { container } = renderProgress(props);
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^semi$/);
    });

    it('strokeLinecap 与 strokeWidth', () => {
        let props = {
            percent: 70,
            strokeLinecap: 'square',
            type: 'circle',
            strokeWidth: 10,
        };
        const { container } = renderProgress(props);
        let firstCircle = container.querySelector('circle');
        expect(firstCircle).toHaveAttribute('stroke-linecap', 'square');
        expect(firstCircle).toHaveAttribute('stroke-width', '10');
    });

    it('width', () => {
        let props = {
            width: 120,
            type: 'circle',
        };
        const { container } = renderProgress(props);
        expect(container.querySelector(`.${prefixCls}-circle-ring`)).toHaveAttribute('width', '120');
    });

    it('circle 的 size=large 按 default 渲染：72px 并显示文字', () => {
        const { container } = renderProgress({ type: 'circle', size: 'large', percent: 30, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-ring`)).toHaveAttribute('width', '72');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^30%$/);
    });

    it('motion = false', () => {
        let props = {
            motion: false,
            percent: 70,
            showInfo: true,
        };
        const { container, rerender } = renderProgress(props);
        const getText = () => container.querySelector(`.${prefixCls}-line-text`);
        expect(getText()).toHaveTextContent(/^70%$/);
        rerender({ ...props, percent: 80 });
        expect(getText()).toHaveTextContent(/^80%$/);
    });

    it('传入 101、-1 等非法 percent', () => {
        const { container, unmount } = renderProgress({ percent: 101, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^100%$/);
        unmount();

        const { container: minContainer } = renderProgress({ percent: -2, showInfo: true });
        expect(minContainer.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^0%$/);
    });

    it('line 的 indeterminate 忽略 percent 与 showInfo，并渲染动画类名', () => {
        const { container } = renderProgress({ indeterminate: true, percent: 50, showInfo: true });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-indeterminate`);
        // the CSS animation drives the block, so no fixed width is written
        const inner = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(inner).toHaveLength(1);
        expect(inner[0].style.width).toEqual('');
        // showInfo is ignored and aria-valuenow is not set
        expect(container.querySelector(`.${prefixCls}-line-text`)).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('line 的 indeterminate 默认为 false，保留 percent 宽度', () => {
        const { container } = renderProgress({ percent: 30, showInfo: true });
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-indeterminate`);
        expect(container.querySelector(`.${prefixCls}-track-inner`).getAttribute('style')).toContain('width: 30%');
        expect(container.querySelector(`.${prefixCls}-line-text`)).not.toBeNull();
    });

    it('circle 的 indeterminate 渲染固定弧线与旋转动画类名，并隐藏文本', () => {
        const { container } = renderProgress({ type: 'circle', indeterminate: true, percent: 30, showInfo: true });
        const inners = container.querySelectorAll(`.${prefixCls}-circle-ring-inner-indeterminate`);
        expect(inners).toHaveLength(1);
        const inner = inners[0];
        const dasharray = inner.getAttribute('stroke-dasharray');
        expect(dasharray).toContain(' ');
        const [arc, total] = dasharray.split(' ').map(Number);
        expect(Number((arc / total).toFixed(3))).toBeCloseTo(0.3, 3);
        expect(inner).toHaveAttribute('stroke-dashoffset', '0');
        const trackDasharray = container.querySelector(`.${prefixCls}-circle-ring-track`).getAttribute('stroke-dasharray');
        const [trackArc, trackTotal] = trackDasharray.split(' ').map(Number);
        expect(trackArc).toEqual(trackTotal);
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('circle 的 indeterminate 默认为 false，保留 percent 的 dashoffset', () => {
        const { container } = renderProgress({ type: 'circle', percent: 30, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-ring-inner-indeterminate`)).toBeNull();
        const inner = container.querySelector(`.${prefixCls}-circle-ring-inner`);
        expect(inner.getAttribute('stroke-dashoffset')).not.toEqual('0');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).not.toBeNull();
    });

    it('竖向 line 的 indeterminate 使用竖向动画类名', () => {
        const { container } = renderProgress({ direction: 'vertical', indeterminate: true, percent: 50 });
        const inner = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(inner).toHaveLength(1);
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
        expect(inner[0].style.height).toEqual('');
    });

    describe('percent 动画', () => {
        afterEach(() => {
            vi.useRealTimers();
        });
        const advance = (ms) => {
            act(() => {
                vi.advanceTimersByTime(ms);
            });
        };
        const valueNow = () => Number(getProgressbar().getAttribute('aria-valuenow'));

        it('circle 只把显示数字动画到新的 percent，aria-valuenow 立即是目标值', () => {
            vi.useFakeTimers();
            const props = { type: 'circle', percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            const getText = () => container.querySelector(`.${prefixCls}-circle-text`);
            rerender({ ...props, percent: 50 });
            expect(valueNow()).toBe(50);
            advance(150);
            expect(valueNow()).toBe(50);
            const shown = Number(getText().textContent.replace('%', ''));
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            advance(300);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            expect(getText()).toHaveTextContent(/^50%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('line 在文本动画时同时移动宽度与 aria-valuenow', () => {
            vi.useFakeTimers();
            const props = { percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            const getText = () => container.querySelector(`.${prefixCls}-line-text`);
            rerender({ ...props, percent: 50 });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            expect(container.querySelector<HTMLElement>(`.${prefixCls}-track-inner`).style.width).toBe('50%');
            advance(150);
            const shown = Number(getText().textContent.replace('%', ''));
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            advance(300);
            expect(getText()).toHaveTextContent(/^50%$/);
        });

        it('动画过程中 percent 变化，最终停在最新的 percent', () => {
            vi.useFakeTimers();
            const props = { type: 'circle', percent: 0 };
            const { rerender } = renderProgress(props);
            rerender({ ...props, percent: 100 });
            advance(100);
            rerender({ ...props, percent: 20 });
            advance(400);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中 percent 变化，新动画从当前显示的数字起算', () => {
            vi.useFakeTimers();
            const props = { type: 'circle', percent: 0, showInfo: true };
            const { container, rerender } = renderProgress(props);
            const shown = () => Number(container.querySelector(`.${prefixCls}-circle-text`).textContent.replace('%', ''));
            rerender({ ...props, percent: 100 });
            advance(100);
            const before = shown();
            expect(before).toBeGreaterThan(0);
            expect(before).toBeLessThan(60);
            rerender({ ...props, percent: 20 });
            advance(20);
            expect(shown()).toBeLessThanOrEqual(before + 10);
        });

        it('动画过程中关闭 motion，动画停在新的 percent', () => {
            vi.useFakeTimers();
            const { rerender } = renderProgress({ type: 'circle', percent: 0 });
            rerender({ type: 'circle', percent: 100 });
            advance(100);
            rerender({ type: 'circle', percent: 20, motion: false });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            advance(50);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中卸载，不残留待执行的帧', () => {
            vi.useFakeTimers();
            const { rerender, unmount } = renderProgress({ type: 'circle', percent: 0 });
            rerender({ type: 'circle', percent: 80 });
            advance(50);
            expect(vi.getTimerCount()).toBeGreaterThan(0);
            unmount();
            expect(vi.getTimerCount()).toBe(0);
        });

        it('StrictMode 下动画到最终值', () => {
            vi.useFakeTimers();
            const { rerender } = render(
                <StrictMode>
                    <Progress type="circle" percent={10} />
                </StrictMode>
            );
            rerender(
                <StrictMode>
                    <Progress type="circle" percent={60} />
                </StrictMode>
            );
            advance(400);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '60');
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    it('circle 尺寸：默认 72px 带文本，small 为 24px 且无文本', () => {
        const props = { type: 'circle', percent: 40, showInfo: true };
        const { container, rerender } = renderProgress(props);
        const ring = () => container.querySelector(`.${prefixCls}-circle-ring`);
        expect(ring()).toHaveAttribute('width', '72');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^40%$/);
        rerender({ ...props, size: 'small' });
        expect(ring()).toHaveAttribute('width', '24');
        expect(ring()).toHaveAttribute('height', '24');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toBeNull();
    });

    it('circle 的 stroke 字符串与 orbitStroke', () => {
        const { container } = renderProgress({ type: 'circle', stroke: '#fc8800', orbitStroke: '#f93920' });
        expect(container.querySelector(`.${prefixCls}-circle-ring-inner`)).toHaveStyle({ stroke: '#fc8800' });
        expect(container.querySelector(`.${prefixCls}-circle-ring-track`)).toHaveStyle({ stroke: '#f93920' });
    });

    it('line 的 stroke 数组取已到达分段的颜色', () => {
        const stroke = [
            { percent: 20, color: 'rgb(255, 0, 0)' },
            { percent: 60, color: 'rgb(0, 0, 255)' },
        ];
        const { container } = renderProgress({ stroke, percent: 70 });
        expect(container.querySelector(`.${prefixCls}-track-inner`).getAttribute('style')).toContain('background: rgb(0, 0, 255)');
    });

    it('两种类型下 format 都接收截断后的 percent', () => {
        const format = vi.fn<(percent: number) => string>((p) => `${p} pts`);
        const { container, unmount } = renderProgress({ percent: 120, showInfo: true, format });
        expect(container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^100 pts$/);
        unmount();
        const { container: circle } = renderProgress({ type: 'circle', percent: -5, showInfo: true, format });
        expect(circle.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^0 pts$/);
    });

    it('两种类型下 id、aria 与 data 属性都透传到根元素', () => {
        const props = {
            id: 'p',
            'aria-label': 'upload',
            'aria-labelledby': 'lbl',
            'aria-valuetext': 'half',
            'data-testid': 'root',
        };
        const { rerender } = renderProgress(props);
        for (const type of ['line', 'circle']) {
            rerender({ ...props, type });
            const node = getProgressbar();
            expect(node).toBe(screen.getByTestId('root'));
            expect(node).toHaveAttribute('id', 'p');
            expect(node).toHaveAttribute('aria-label', 'upload');
            expect(node).toHaveAttribute('aria-labelledby', 'lbl');
            expect(node).toHaveAttribute('aria-valuetext', 'half');
            expect(node).toHaveAttribute('aria-valuemin', '0');
            expect(node).toHaveAttribute('aria-valuemax', '100');
        }
    });

    it('两种类型下 ref 都指向根元素', () => {
        const ref = createRef<HTMLDivElement>();
        const { rerender } = render(<Progress ref={ref} />);
        expect(ref.current).toBe(getProgressbar());
        rerender(<Progress ref={ref} type="circle" />);
        expect(ref.current).toBe(getProgressbar());
    });

    it('类型上不接受不会渲染的 children', () => {
        expectTypeOf<ProgressProps>().not.toHaveProperty('children');
    });

    it('其他 DOM 属性与事件透传到根元素', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        renderProgress({ title: 'tip', onClick, type: 'circle' });
        const node = getProgressbar();
        expect(node).toHaveAttribute('title', 'tip');
        node.click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Progress: { showInfo: true, type: 'circle' } };
        try {
            const { container } = renderProgress({ percent: 25 });
            expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^25%$/);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
