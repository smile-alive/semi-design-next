import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ProgressProps } from '../interface';
import ProgressDemo from './progress-demo.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-progress`;

type Props = ProgressProps & { withFormat?: boolean };

function setup(initial: Props = {}) {
    const store = createStore<Props>(initial);
    const view = render(ProgressDemo, { props: { store } });
    const update = (next: Props) => {
        Object.assign(store, next);
        flushSync();
    };
    return { store, update, ...view };
}
const getProgressbar = () => screen.getByRole('progressbar');

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = undefined;
});

describe('Progress', () => {
    it('percent 传入 NaN 时抛出错误', () => {
        const { update } = setup({ percent: 30 });
        expect(() => update({ percent: Number.NaN })).toThrow('[Semi Progress]:percent can not be NaN');
    });

    it('正常渲染', () => {
        const { container } = setup();
        expect(container.querySelectorAll(`.${prefixCls}`)).toHaveLength(1);
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '0');
    });

    it('渲染环形进度条', () => {
        const { container } = setup({ type: 'circle' });
        expect(container.querySelectorAll(`svg.${prefixCls}-circle-ring`)).toHaveLength(1);
    });

    it('进度变化后 aria-valuenow 立即是目标值', () => {
        const { update } = setup({ type: 'circle', percent: 30 });
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '30');
        update({ percent: 50 });
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
    });

    it('两种类型下 class 与 style 都落在根元素', () => {
        const { update } = setup({ class: 'test', style: 'color: red' });
        for (const type of ['line', 'circle'] as const) {
            update({ type });
            const node = getProgressbar();
            expect(node).toHaveClass(type === 'line' ? prefixCls : `${prefixCls}-circle`, 'test');
            expect(node).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        }
    });

    it('showInfo', () => {
        const { container } = setup({ showInfo: true, percent: 50 });
        expect(container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^50%$/);
    });

    it('stroke、size 与 orbitStroke', () => {
        const { container, update } = setup({ stroke: '#fc8800', size: 'small', orbitStroke: '#f93920' });
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-large`);
        expect(container.querySelector(`.${prefixCls}-track`)).toHaveStyle({ backgroundColor: 'rgb(249, 57, 32)' });
        expect(container.querySelector(`.${prefixCls}-track-inner`)).toHaveStyle({ backgroundColor: 'rgb(252, 136, 0)' });
        update({ size: 'large' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-large`);
    });

    const ringStyle = (container: Element) => container.querySelector(`.${prefixCls}-circle-ring-inner`)?.getAttribute('style');

    it('渐变准确性 [strokeGradient 为 true 且 stroke 类型为数组]', () => {
        const { container } = setup({
            stroke: [
                { percent: 50, color: '#fff' },
                { percent: 52, color: 'rgba(0, 0, 0, 0)' },
            ],
            strokeGradient: true,
            percent: 51,
            type: 'circle',
        });
        expect(ringStyle(container)).toContain('color-mix(in srgb');
    });

    it('percent 小于 0 时按 0 处的色标选色', () => {
        const { container } = setup({ stroke: [{ percent: 0, color: '#fff' }], percent: -10, type: 'circle' });
        expect(ringStyle(container)).toContain('rgb(255, 255, 255)');
    });

    it('不重新排序 stroke 属性数组', () => {
        const stroke = [
            { percent: 80, color: '#000' },
            { percent: 20, color: '#fff' },
        ];
        const { container } = setup({ stroke, percent: 10, type: 'circle' });
        expect(ringStyle(container)).not.toBeNull();
        expect(stroke.map((item) => item.percent)).toEqual([80, 20]);
    });

    it('direction', () => {
        setup({ direction: 'vertical' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
    });

    it('format snippet 替换文本，两种类型都接收截断后的 percent', () => {
        const line = setup({ percent: 120, showInfo: true, withFormat: true });
        expect(line.container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^100 pts$/);
        line.unmount();
        const { container } = setup({ type: 'circle', percent: -5, showInfo: true, withFormat: true });
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^0 pts$/);
    });

    it('未提供 format 时两种类型都输出 N%', () => {
        const line = setup({ percent: 35, showInfo: true });
        expect(line.container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^35%$/);
        line.unmount();
        const { container } = setup({ type: 'circle', percent: 35, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^35%$/);
    });

    it('strokeLinecap 与 strokeWidth 输出为连字符 SVG 属性', () => {
        const { container } = setup({ percent: 70, strokeLinecap: 'square', type: 'circle', strokeWidth: 10 });
        const firstCircle = container.querySelector('circle');
        expect(firstCircle).toHaveAttribute('stroke-linecap', 'square');
        expect(firstCircle).toHaveAttribute('stroke-width', '10');
    });

    it('width', () => {
        const { container } = setup({ width: 120, type: 'circle' });
        expect(container.querySelector(`.${prefixCls}-circle-ring`)).toHaveAttribute('width', '120');
    });

    it('circle 的 size=large 按 default 渲染：72px 并显示文字', () => {
        const { container } = setup({ type: 'circle', size: 'large', percent: 30, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-ring`)).toHaveAttribute('width', '72');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^30%$/);
    });

    it('motion = false', () => {
        const { container, update } = setup({ motion: false, percent: 70, showInfo: true });
        const getText = () => container.querySelector(`.${prefixCls}-line-text`);
        expect(getText()).toHaveTextContent(/^70%$/);
        update({ percent: 80 });
        expect(getText()).toHaveTextContent(/^80%$/);
    });

    it('传入 101、-1 等非法 percent', () => {
        const max = setup({ percent: 101, showInfo: true });
        expect(max.container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^100%$/);
        max.unmount();
        const { container } = setup({ percent: -2, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^0%$/);
    });

    it('line 的 indeterminate 忽略 percent 与 showInfo，并渲染动画类名', () => {
        const { container } = setup({ indeterminate: true, percent: 50, showInfo: true });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-indeterminate`);
        const inner = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(inner).toHaveLength(1);
        expect(inner[0].style.width).toEqual('');
        expect(container.querySelector(`.${prefixCls}-line-text`)).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('line 的 indeterminate 默认为 false，保留 percent 宽度', () => {
        const { container } = setup({ percent: 30, showInfo: true });
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-indeterminate`);
        expect(container.querySelector(`.${prefixCls}-track-inner`)?.getAttribute('style')).toContain('width: 30%');
        expect(container.querySelector(`.${prefixCls}-line-text`)).not.toBeNull();
    });

    it('circle 的 indeterminate 渲染固定弧线与旋转动画类名，并隐藏文本', () => {
        const { container } = setup({ type: 'circle', indeterminate: true, percent: 30, showInfo: true });
        const inners = container.querySelectorAll(`.${prefixCls}-circle-ring-inner-indeterminate`);
        expect(inners).toHaveLength(1);
        const [arc, total] = (inners[0].getAttribute('stroke-dasharray') ?? '').split(' ').map(Number);
        expect(arc / total).toBeCloseTo(0.3, 3);
        expect(inners[0]).toHaveAttribute('stroke-dashoffset', '0');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('竖向 line 的 indeterminate 使用竖向动画类名', () => {
        const { container } = setup({ direction: 'vertical', indeterminate: true, percent: 50 });
        const inner = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(inner).toHaveLength(1);
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
        expect(inner[0].style.height).toEqual('');
    });

    it('文本不显示时不求值 format', () => {
        const hidden = [{ percent: 50 }, { percent: 50, showInfo: true, indeterminate: true }, { percent: 50, showInfo: true, type: 'circle', size: 'small' }] as Props[];
        for (const props of hidden) {
            const { container, unmount } = setup({ ...props, withFormat: true });
            expect(container.textContent).not.toContain('pts');
            unmount();
        }
    });

    it('circle 尺寸：默认 72px 带文本，small 为 24px 且无文本', () => {
        const { container, update } = setup({ type: 'circle', percent: 40, showInfo: true });
        const ring = () => container.querySelector(`.${prefixCls}-circle-ring`);
        expect(ring()).toHaveAttribute('width', '72');
        update({ size: 'small' });
        expect(ring()).toHaveAttribute('width', '24');
        expect(ring()).toHaveAttribute('height', '24');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toBeNull();
    });

    it('line 的 stroke 数组取已到达分段的颜色', () => {
        const stroke = [
            { percent: 20, color: 'rgb(255, 0, 0)' },
            { percent: 60, color: 'rgb(0, 0, 255)' },
        ];
        const { container } = setup({ stroke, percent: 70 });
        expect(container.querySelector(`.${prefixCls}-track-inner`)?.getAttribute('style')).toContain('background: rgb(0, 0, 255)');
    });

    it('两种类型下 id、aria 与 data 属性都透传到根元素', () => {
        const { update } = setup({ id: 'p', 'aria-label': 'upload', 'aria-valuetext': 'half', 'data-testid': 'root' } as Props);
        for (const type of ['line', 'circle'] as const) {
            update({ type });
            const node = getProgressbar();
            expect(node).toBe(screen.getByTestId('root'));
            expect(node).toHaveAttribute('id', 'p');
            expect(node).toHaveAttribute('aria-label', 'upload');
            expect(node).toHaveAttribute('aria-valuetext', 'half');
            expect(node).toHaveAttribute('aria-valuemin', '0');
            expect(node).toHaveAttribute('aria-valuemax', '100');
        }
    });

    it('两种类型下事件都透传到根元素', () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { update } = setup({ title: 'tip', onclick });
        for (const [index, type] of (['line', 'circle'] as const).entries()) {
            update({ type });
            const node = getProgressbar();
            expect(node).toHaveAttribute('title', 'tip');
            node.click();
            expect(onclick).toHaveBeenCalledTimes(index + 1);
        }
    });

    it('读取全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Progress: { showInfo: true, type: 'circle', strokeWidth: 8 } };
        const { container } = setup({ percent: 25 });
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^25%$/);
        expect(container.querySelector('circle')).toHaveAttribute('stroke-width', '8');
    });

    describe('percent 动画', () => {
        afterEach(() => {
            vi.useRealTimers();
        });
        // only the frame timers are faked, so Testing Library keeps real timers
        const fakeFrames = () => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const advance = (ms: number) => {
            vi.advanceTimersByTime(ms);
            flushSync();
        };
        const shownNumber = (el: Element | null) => Number(el?.textContent?.replace('%', ''));

        it('circle 只把显示数字动画到新的 percent，aria-valuenow 立即是目标值', () => {
            fakeFrames();
            const { container, update } = setup({ type: 'circle', percent: 30, showInfo: true });
            const getText = () => container.querySelector(`.${prefixCls}-circle-text`);
            update({ percent: 50 });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            advance(150);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            const shown = shownNumber(getText());
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            advance(300);
            expect(getText()).toHaveTextContent(/^50%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中 percent 变化，最终停在最新的 percent', () => {
            fakeFrames();
            const { container, update } = setup({ type: 'circle', percent: 0, showInfo: true });
            update({ percent: 100 });
            advance(100);
            update({ percent: 20 });
            advance(400);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^20%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中关闭 motion，动画停在新的 percent', () => {
            fakeFrames();
            const { container, update } = setup({ type: 'circle', percent: 0, showInfo: true });
            update({ percent: 100 });
            advance(100);
            update({ percent: 20, motion: false });
            advance(50);
            expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^20%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中卸载，不残留待执行的帧', () => {
            fakeFrames();
            const view = setup({ type: 'circle', percent: 0 });
            view.update({ percent: 80 });
            advance(50);
            expect(vi.getTimerCount()).toBeGreaterThan(0);
            view.unmount();
            expect(vi.getTimerCount()).toBe(0);
        });
    });
});
