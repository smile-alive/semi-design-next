import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Progress, { type ProgressProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefixCls = `${BASE_CLASS_PREFIX}-progress`;

const renderProgress = (initial: ProgressProps = {}) => {
    const [props, setProps] = createSignal<ProgressProps>(initial);
    const result = render(() => <Progress {...props()} />);
    return { ...result, rerender: setProps };
};
const getProgressbar = () => screen.getByRole('progressbar');
const text = (container: HTMLElement, name: 'line' | 'circle') => container.querySelector(`.${prefixCls}-${name}-text`);
const inner = (container: HTMLElement) => container.querySelector(`.${prefixCls}-circle-ring-inner`);

describe('Progress', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('percent 传入 NaN 等非法值', () => {
        const { rerender } = renderProgress({ percent: 30 });
        expect(() => rerender({ percent: NaN })).toThrow('[Semi Progress]:percent can not be NaN');
    });

    it('初始 percent 为 NaN 时，第一次变化同样抛错', () => {
        const { rerender } = renderProgress({ percent: NaN });
        expect(() => rerender({ percent: 30 })).toThrow('[Semi Progress]:percent can not be NaN');
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

    it('class 与 style', () => {
        renderProgress({ class: 'test', style: { color: 'red' } });
        const node = getProgressbar();
        expect(node).toHaveClass(prefixCls, 'test');
        expect(node).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('showInfo', () => {
        const { container } = renderProgress({ showInfo: true, percent: 50 });
        expect(text(container, 'line')).toHaveTextContent(/^50%$/);
    });

    it('stroke、size 与 orbitStroke', () => {
        const props: ProgressProps = { stroke: '#fc8800', size: 'small', orbitStroke: '#f93920' };
        const { container, rerender } = renderProgress(props);
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-large`);
        expect(container.querySelector(`.${prefixCls}-track`)).toHaveStyle({ backgroundColor: 'rgb(249, 57, 32)' });
        expect(container.querySelector(`.${prefixCls}-track-inner`)).toHaveStyle({ backgroundColor: 'rgb(252, 136, 0)' });

        rerender({ ...props, size: 'large' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-large`);
    });

    it('渐变准确性 [strokeGradient 为 true 且 stroke 类型为数组]', () => {
        const { container } = renderProgress({
            stroke: [
                { percent: 50, color: '#fff' },
                { percent: 52, color: 'rgba(0, 0, 0, 0)' },
            ],
            strokeGradient: true,
            percent: 51,
            type: 'circle',
        });
        // jsdom normalizes the colors and drops the default 50% of the color-mix() the component sets
        expect(inner(container)?.getAttribute('style')).toEqual('stroke: color-mix(in srgb, rgba(0, 0, 0, 0), rgb(255, 255, 255));');
    });

    it('rgba 色标的小数透明度不会被截成 0', () => {
        const { container } = renderProgress({ stroke: [{ percent: 0, color: 'rgba(255, 0, 0, 0.5)' }], percent: 50, type: 'circle' });
        expect(inner(container)?.getAttribute('style')).toEqual('stroke: rgba(255, 0, 0, 0.5);');
    });

    it('percent 小于 0 时按 0 处的色标选色', () => {
        const { container } = renderProgress({ stroke: [{ percent: 0, color: '#fff' }], percent: -10, type: 'circle' });
        expect(inner(container)?.getAttribute('style')).toEqual('stroke: rgb(255, 255, 255);');
    });

    it('渐变准确性 [strokeGradient 为 false 且 stroke 类型为数组]', () => {
        const { container } = renderProgress({ stroke: [{ percent: 3, color: '#fff' }], percent: 90, type: 'circle' });
        expect(inner(container)?.getAttribute('style')).toEqual('stroke: rgb(255, 255, 255);');
    });

    it('不重新排序 stroke 属性数组', () => {
        const stroke = [
            { percent: 80, color: '#000' },
            { percent: 20, color: '#fff' },
        ];
        const { container } = renderProgress({ stroke, percent: 10, type: 'circle' });
        expect(inner(container)?.getAttribute('style')).not.toBeNull();
        expect(stroke.map((item) => item.percent)).toEqual([80, 20]);
    });

    it('渐变兼容性 [strokeGradient 为 true 且 stroke 类型为数组]', () => {
        const { container } = renderProgress({
            stroke: [
                { percent: 0, color: 'red' },
                { percent: 10, color: '#b2140c' },
                { percent: 50, color: 'rgb(0, 99, 167)' },
                { percent: 100, color: 'hsla(125, 50%, 46%, 1)' },
            ],
            strokeGradient: true,
            percent: 55,
            type: 'circle',
        });
        // jsdom serializes the hsla() stop in rgb() form; the browser test checks the mixed color
        expect(inner(container)?.getAttribute('style')).toEqual('stroke: color-mix(in srgb, rgb(59, 176, 68) 10%, rgb(0, 99, 167));');
    });

    it('direction', () => {
        renderProgress({ direction: 'vertical' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
    });

    it('format', () => {
        const { container } = renderProgress({ percent: 70, showInfo: true, format: () => 'semi', type: 'circle' });
        expect(text(container, 'circle')).toHaveTextContent(/^semi$/);
    });

    it('strokeLinecap 与 strokeWidth', () => {
        const { container } = renderProgress({ percent: 70, strokeLinecap: 'square', type: 'circle', strokeWidth: 10 });
        const firstCircle = container.querySelector('circle');
        expect(firstCircle).toHaveAttribute('stroke-linecap', 'square');
        expect(firstCircle).toHaveAttribute('stroke-width', '10');
    });

    it('width', () => {
        const { container } = renderProgress({ width: 120, type: 'circle' });
        expect(container.querySelector(`.${prefixCls}-circle-ring`)).toHaveAttribute('width', '120');
    });

    it('circle 的 size=large 按 default 渲染：72px 并显示文字', () => {
        const { container } = renderProgress({ type: 'circle', size: 'large', percent: 30, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-ring`)).toHaveAttribute('width', '72');
        expect(text(container, 'circle')).toHaveTextContent(/^30%$/);
    });

    it('motion = false', () => {
        const props: ProgressProps = { motion: false, percent: 70, showInfo: true };
        const { container, rerender } = renderProgress(props);
        expect(text(container, 'line')).toHaveTextContent(/^70%$/);
        rerender({ ...props, percent: 80 });
        expect(text(container, 'line')).toHaveTextContent(/^80%$/);
    });

    it('传入 101、-1 等非法 percent', () => {
        const { container, unmount } = renderProgress({ percent: 101, showInfo: true });
        expect(text(container, 'line')).toHaveTextContent(/^100%$/);
        unmount();

        const { container: minContainer } = renderProgress({ percent: -2, showInfo: true });
        expect(text(minContainer, 'line')).toHaveTextContent(/^0%$/);
    });

    it('line 的 indeterminate 忽略 percent 与 showInfo，并渲染动画类名', () => {
        const { container } = renderProgress({ indeterminate: true, percent: 50, showInfo: true });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-indeterminate`);
        // the CSS animation drives the block, so no fixed width is written
        const blocks = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(blocks).toHaveLength(1);
        expect(blocks[0].style.width).toEqual('');
        // showInfo is ignored and aria-valuenow is not set
        expect(text(container, 'line')).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('line 的 indeterminate 默认为 false，保留 percent 宽度', () => {
        const { container } = renderProgress({ percent: 30, showInfo: true });
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-indeterminate`);
        expect(container.querySelector(`.${prefixCls}-track-inner`)?.getAttribute('style')).toContain('width: 30%');
        expect(text(container, 'line')).not.toBeNull();
    });

    it('circle 的 indeterminate 渲染固定弧线与旋转动画类名，并隐藏文本', () => {
        const { container } = renderProgress({ type: 'circle', indeterminate: true, percent: 30, showInfo: true });
        const inners = container.querySelectorAll(`.${prefixCls}-circle-ring-inner-indeterminate`);
        expect(inners).toHaveLength(1);
        const arcs = inners[0];
        const [arc, total] = (arcs.getAttribute('stroke-dasharray') as string).split(' ').map(Number);
        expect(arc / total).toBeCloseTo(0.3, 3);
        expect(arcs).toHaveAttribute('stroke-dashoffset', '0');
        const track = container.querySelector(`.${prefixCls}-circle-ring-track`) as Element;
        const [trackArc, trackTotal] = (track.getAttribute('stroke-dasharray') as string).split(' ').map(Number);
        expect(trackArc).toEqual(trackTotal);
        expect(text(container, 'circle')).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('circle 的 indeterminate 默认为 false，保留 percent 的 dashoffset', () => {
        const { container } = renderProgress({ type: 'circle', percent: 30, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-ring-inner-indeterminate`)).toBeNull();
        expect(inner(container)?.getAttribute('stroke-dashoffset')).not.toEqual('0');
        expect(text(container, 'circle')).not.toBeNull();
    });

    it('竖向 line 的 indeterminate 使用竖向动画类名', () => {
        const { container } = renderProgress({ direction: 'vertical', indeterminate: true, percent: 50 });
        const blocks = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(blocks).toHaveLength(1);
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
        expect(blocks[0].style.height).toEqual('');
    });

    describe('percent 动画', () => {
        afterEach(() => {
            vi.useRealTimers();
        });
        const valueNow = () => Number(getProgressbar().getAttribute('aria-valuenow'));
        const shownOf = (container: HTMLElement, name: 'line' | 'circle') => Number(text(container, name)?.textContent?.replace('%', ''));

        it('circle 只把显示数字动画到新的 percent，aria-valuenow 立即是目标值', () => {
            vi.useFakeTimers();
            const props: ProgressProps = { type: 'circle', percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            rerender({ ...props, percent: 50 });
            expect(valueNow()).toBe(50);
            vi.advanceTimersByTime(150);
            expect(valueNow()).toBe(50);
            const shown = shownOf(container, 'circle');
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            vi.advanceTimersByTime(300);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            expect(text(container, 'circle')).toHaveTextContent(/^50%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('line 在文本动画时同时移动宽度与 aria-valuenow', () => {
            vi.useFakeTimers();
            const props: ProgressProps = { percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            rerender({ ...props, percent: 50 });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            expect(container.querySelector<HTMLElement>(`.${prefixCls}-track-inner`)?.style.width).toBe('50%');
            vi.advanceTimersByTime(150);
            const shown = shownOf(container, 'line');
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            vi.advanceTimersByTime(300);
            expect(text(container, 'line')).toHaveTextContent(/^50%$/);
        });

        it('动画过程中无关属性变化不重启动画', () => {
            vi.useFakeTimers();
            const props: ProgressProps = { percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            rerender({ ...props, percent: 50 });
            vi.advanceTimersByTime(150);
            rerender({ ...props, percent: 50, class: 'other' });
            vi.advanceTimersByTime(200);
            expect(text(container, 'line')).toHaveTextContent(/^50%$/);
        });

        it('动画过程中 percent 变化，最终停在最新的 percent', () => {
            vi.useFakeTimers();
            const props: ProgressProps = { type: 'circle', percent: 0 };
            const { rerender } = renderProgress(props);
            rerender({ ...props, percent: 100 });
            vi.advanceTimersByTime(100);
            rerender({ ...props, percent: 20 });
            vi.advanceTimersByTime(400);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中 percent 变化，新动画从当前显示的数字起算', () => {
            vi.useFakeTimers();
            const props: ProgressProps = { type: 'circle', percent: 0, showInfo: true };
            const { container, rerender } = renderProgress(props);
            rerender({ ...props, percent: 100 });
            vi.advanceTimersByTime(100);
            const before = shownOf(container, 'circle');
            expect(before).toBeGreaterThan(0);
            expect(before).toBeLessThan(60);
            rerender({ ...props, percent: 20 });
            vi.advanceTimersByTime(20);
            expect(shownOf(container, 'circle')).toBeLessThanOrEqual(before + 10);
        });

        it('动画过程中关闭 motion，动画停在新的 percent', () => {
            vi.useFakeTimers();
            const { rerender } = renderProgress({ type: 'circle', percent: 0 });
            rerender({ type: 'circle', percent: 100 });
            vi.advanceTimersByTime(100);
            rerender({ type: 'circle', percent: 20, motion: false });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            vi.advanceTimersByTime(50);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中卸载，不残留待执行的帧', () => {
            vi.useFakeTimers();
            const { rerender, unmount } = renderProgress({ type: 'circle', percent: 0 });
            rerender({ type: 'circle', percent: 80 });
            vi.advanceTimersByTime(50);
            expect(vi.getTimerCount()).toBeGreaterThan(0);
            unmount();
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    it('circle 尺寸：默认 72px 带文本，small 为 24px 且无文本', () => {
        const props: ProgressProps = { type: 'circle', percent: 40, showInfo: true };
        const { container, rerender } = renderProgress(props);
        const ring = () => container.querySelector(`.${prefixCls}-circle-ring`);
        expect(ring()).toHaveAttribute('width', '72');
        expect(text(container, 'circle')).toHaveTextContent(/^40%$/);
        rerender({ ...props, size: 'small' });
        expect(ring()).toHaveAttribute('width', '24');
        expect(ring()).toHaveAttribute('height', '24');
        expect(text(container, 'circle')).toBeNull();
    });

    it('circle 的 stroke 字符串与 orbitStroke', () => {
        const { container } = renderProgress({ type: 'circle', stroke: '#fc8800', orbitStroke: '#f93920' });
        expect(inner(container)).toHaveStyle({ stroke: '#fc8800' });
        expect(container.querySelector(`.${prefixCls}-circle-ring-track`)).toHaveStyle({ stroke: '#f93920' });
    });

    it('line 的 stroke 数组取已到达分段的颜色', () => {
        const stroke = [
            { percent: 20, color: 'rgb(255, 0, 0)' },
            { percent: 60, color: 'rgb(0, 0, 255)' },
        ];
        const { container } = renderProgress({ stroke, percent: 70 });
        expect(container.querySelector(`.${prefixCls}-track-inner`)?.getAttribute('style')).toContain('background: rgb(0, 0, 255)');
    });

    it('两种类型下 format 都接收截断后的 percent', () => {
        const format = vi.fn<NonNullable<ProgressProps['format']>>((p) => `${p} pts`);
        const { container, unmount } = renderProgress({ percent: 120, showInfo: true, format });
        expect(text(container, 'line')).toHaveTextContent(/^100 pts$/);
        unmount();
        const { container: circle } = renderProgress({ type: 'circle', percent: -5, showInfo: true, format });
        expect(text(circle, 'circle')).toHaveTextContent(/^0 pts$/);
    });

    it('两种类型下 id、aria 与 data 属性都透传到根元素', () => {
        const props = { id: 'p', 'aria-label': 'upload', 'aria-labelledby': 'lbl', 'aria-valuetext': 'half', 'data-testid': 'root' } as ProgressProps;
        const { rerender } = renderProgress(props);
        for (const type of ['line', 'circle'] as const) {
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
        const [type, setType] = createSignal<'line' | 'circle'>('line');
        let root: HTMLDivElement | undefined;
        render(() => <Progress ref={(node) => (root = node)} type={type()} />);
        expect(root).toBe(getProgressbar());
        setType('circle');
        expect(root).toBe(getProgressbar());
    });

    it('类型上不接受不会渲染的 children', () => {
        expectTypeOf<ProgressProps>().not.toHaveProperty('children');
    });

    it('其他 DOM 属性与事件透传到根元素', () => {
        const onClick = vi.fn<() => void>();
        renderProgress({ title: 'tip', onClick, type: 'circle' });
        const node = getProgressbar();
        expect(node).toHaveAttribute('title', 'tip');
        node.click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Progress: { showInfo: true, type: 'circle' } };
        const { container } = renderProgress({ percent: 25 });
        expect(text(container, 'circle')).toHaveTextContent(/^25%$/);
    });
});
