/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Progress, { type ProgressProps, type ProgressSlots } from '../index';
import Instance from './fixtures/instance.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-progress`;

type Props = ProgressProps & Record<string, unknown>;
type FormatSlot = NonNullable<ProgressSlots['format']>;

function renderProgress({ class: className, style, ...rest }: Props = {}, slots: ProgressSlots = {}) {
    const view = render(Progress, { props: rest, attrs: { class: className, style }, slots });
    return { ...view, rerender: (next: Props) => view.rerender(next) };
}
const getProgressbar = () => screen.getByRole('progressbar');

describe('Progress', () => {
    it('percent 传入 NaN 等非法值时经 errorHandler 报错', async () => {
        const errorHandler = vi.fn<(error: unknown) => void>();
        const view = render(Progress, { props: { percent: 30 }, global: { config: { errorHandler } } });
        await view.rerender({ percent: NaN });
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(String(errorHandler.mock.calls[0][0])).toContain('[Semi Progress]:percent can not be NaN');
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

    it('进度变化后 aria-valuenow 立即是目标值', async () => {
        const { rerender } = renderProgress({ type: 'circle', percent: 30 });
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '30');
        await rerender({ type: 'circle', percent: 50 });
        expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
    });

    it('两种类型下 class 与 style 都落在根元素', async () => {
        const view = render(Progress, { attrs: { class: 'test', style: { color: 'red' } } });
        for (const type of ['line', 'circle'] as const) {
            await view.rerender({ type });
            const node = getProgressbar();
            expect(node).toHaveClass(type === 'line' ? prefixCls : `${prefixCls}-circle`, 'test');
            expect(node).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        }
    });

    it('showInfo', () => {
        const { container } = renderProgress({ showInfo: true, percent: 50 });
        expect(container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^50%$/);
    });

    it('stroke、size 与 orbitStroke', async () => {
        const props: Props = { stroke: '#fc8800', size: 'small', orbitStroke: '#f93920' };
        const { container, rerender } = renderProgress(props);
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-large`);
        expect(container.querySelector(`.${prefixCls}-track`)).toHaveStyle({ backgroundColor: 'rgb(249, 57, 32)' });
        expect(container.querySelector(`.${prefixCls}-track-inner`)).toHaveStyle({ backgroundColor: 'rgb(252, 136, 0)' });
        await rerender({ ...props, size: 'large' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-large`);
    });

    const ringStyle = (container: Element) => container.querySelector(`.${prefixCls}-circle-ring-inner`)?.getAttribute('style');

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
        expect(ringStyle(container)).toEqual('stroke: color-mix(in srgb, rgba(0, 0, 0, 0), rgb(255, 255, 255));');
    });

    it('rgba 色标的小数透明度不会被截成 0', () => {
        const { container } = renderProgress({
            stroke: [{ percent: 0, color: 'rgba(255, 0, 0, 0.5)' }],
            percent: 50,
            type: 'circle',
        });
        expect(ringStyle(container)).toEqual('stroke: rgba(255, 0, 0, 0.5);');
    });

    it('percent 小于 0 时按 0 处的色标选色', () => {
        const { container } = renderProgress({ stroke: [{ percent: 0, color: '#fff' }], percent: -10, type: 'circle' });
        expect(ringStyle(container)).toEqual('stroke: rgb(255, 255, 255);');
    });

    it('渐变准确性 [strokeGradient 为 false 且 stroke 类型为数组]', () => {
        const { container } = renderProgress({ stroke: [{ percent: 3, color: '#fff' }], percent: 90, type: 'circle' });
        expect(ringStyle(container)).toEqual('stroke: rgb(255, 255, 255);');
    });

    it('不重新排序 stroke 属性数组', () => {
        const stroke = [
            { percent: 80, color: '#000' },
            { percent: 20, color: '#fff' },
        ];
        const { container } = renderProgress({ stroke, percent: 10, type: 'circle' });
        expect(ringStyle(container)).not.toBeNull();
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
        expect(ringStyle(container)).toEqual('stroke: color-mix(in srgb, rgb(59, 176, 68) 10%, rgb(0, 99, 167));');
    });

    it('direction', () => {
        renderProgress({ direction: 'vertical' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-vertical`);
    });

    it('#format 插槽替换文本', () => {
        const { container } = renderProgress({ percent: 70, showInfo: true, type: 'circle' }, { format: () => [<span>semi</span>] });
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^semi$/);
    });

    it('strokeLinecap 与 strokeWidth 输出为连字符 SVG 属性', () => {
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
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^30%$/);
    });

    it('motion = false', async () => {
        const props: Props = { motion: false, percent: 70, showInfo: true };
        const { container, rerender } = renderProgress(props);
        const getText = () => container.querySelector(`.${prefixCls}-line-text`);
        expect(getText()).toHaveTextContent(/^70%$/);
        await rerender({ ...props, percent: 80 });
        expect(getText()).toHaveTextContent(/^80%$/);
    });

    it('传入 101、-1 等非法 percent', () => {
        const max = renderProgress({ percent: 101, showInfo: true });
        expect(max.container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^100%$/);
        max.unmount();
        const { container: minContainer } = renderProgress({ percent: -2, showInfo: true });
        expect(minContainer.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^0%$/);
    });

    it('line 的 indeterminate 忽略 percent 与 showInfo，并渲染动画类名', () => {
        const { container } = renderProgress({ indeterminate: true, percent: 50, showInfo: true });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-indeterminate`);
        const inner = container.querySelectorAll<HTMLElement>(`.${prefixCls}-track-inner-indeterminate`);
        expect(inner).toHaveLength(1);
        expect(inner[0].style.width).toEqual('');
        expect(container.querySelector(`.${prefixCls}-line-text`)).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('line 的 indeterminate 默认为 false，保留 percent 宽度', () => {
        const { container } = renderProgress({ percent: 30, showInfo: true });
        expect(getProgressbar()).not.toHaveClass(`${prefixCls}-indeterminate`);
        expect(container.querySelector(`.${prefixCls}-track-inner`)?.getAttribute('style')).toContain('width: 30%');
        expect(container.querySelector(`.${prefixCls}-line-text`)).not.toBeNull();
    });

    it('circle 的 indeterminate 渲染固定弧线与旋转动画类名，并隐藏文本', () => {
        const { container } = renderProgress({ type: 'circle', indeterminate: true, percent: 30, showInfo: true });
        const inners = container.querySelectorAll(`.${prefixCls}-circle-ring-inner-indeterminate`);
        expect(inners).toHaveLength(1);
        const dasharray = inners[0].getAttribute('stroke-dasharray') ?? '';
        expect(dasharray).toContain(' ');
        const [arc, total] = dasharray.split(' ').map(Number);
        expect(Number((arc / total).toFixed(3))).toBeCloseTo(0.3, 3);
        expect(inners[0]).toHaveAttribute('stroke-dashoffset', '0');
        const trackDasharray = container.querySelector(`.${prefixCls}-circle-ring-track`)?.getAttribute('stroke-dasharray') ?? '';
        const [trackArc, trackTotal] = trackDasharray.split(' ').map(Number);
        expect(trackArc).toEqual(trackTotal);
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toBeNull();
        expect(getProgressbar()).not.toHaveAttribute('aria-valuenow');
    });

    it('circle 的 indeterminate 默认为 false，保留 percent 的 dashoffset', () => {
        const { container } = renderProgress({ type: 'circle', percent: 30, showInfo: true });
        expect(container.querySelector(`.${prefixCls}-circle-ring-inner-indeterminate`)).toBeNull();
        const inner = container.querySelector(`.${prefixCls}-circle-ring-inner`);
        expect(inner?.getAttribute('stroke-dashoffset')).not.toEqual('0');
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
        // only the frame timers are faked: Testing Library and nextTick keep real timers and microtasks
        const fakeFrames = () => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const advance = async (ms: number) => {
            vi.advanceTimersByTime(ms);
            await nextTick();
        };
        const valueNow = () => Number(getProgressbar().getAttribute('aria-valuenow'));
        const shownNumber = (el: Element | null) => Number(el?.textContent?.replace('%', ''));

        it('circle 只把显示数字动画到新的 percent，aria-valuenow 立即是目标值', async () => {
            fakeFrames();
            const props: Props = { type: 'circle', percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            const getText = () => container.querySelector(`.${prefixCls}-circle-text`);
            await rerender({ ...props, percent: 50 });
            expect(valueNow()).toBe(50);
            await advance(150);
            expect(valueNow()).toBe(50);
            const shown = shownNumber(getText());
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            await advance(300);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            expect(getText()).toHaveTextContent(/^50%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('line 在文本动画时同时移动宽度与 aria-valuenow', async () => {
            fakeFrames();
            const props: Props = { percent: 30, showInfo: true };
            const { container, rerender } = renderProgress(props);
            const getText = () => container.querySelector(`.${prefixCls}-line-text`);
            await rerender({ ...props, percent: 50 });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '50');
            expect(container.querySelector<HTMLElement>(`.${prefixCls}-track-inner`)?.style.width).toBe('50%');
            await advance(150);
            const shown = shownNumber(getText());
            expect(shown).toBeGreaterThan(30);
            expect(shown).toBeLessThan(50);
            await advance(300);
            expect(getText()).toHaveTextContent(/^50%$/);
        });

        it('动画过程中 percent 变化，最终停在最新的 percent', async () => {
            fakeFrames();
            const props: Props = { type: 'circle', percent: 0, showInfo: true };
            const { container, rerender } = renderProgress(props);
            await rerender({ ...props, percent: 100 });
            await advance(100);
            await rerender({ ...props, percent: 20 });
            await advance(400);
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^20%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画中途改 percent 时，文本从当前显示的数字继续，不先跳回上一次的目标值', async () => {
            fakeFrames();
            const props: Props = { type: 'circle', percent: 40, showInfo: true };
            const { container, rerender } = renderProgress(props);
            const getText = () => container.querySelector(`.${prefixCls}-circle-text`);
            await rerender({ ...props, percent: 80 });
            await advance(150);
            const middle = shownNumber(getText());
            expect(middle).toBeGreaterThan(40);
            expect(middle).toBeLessThan(80);
            await rerender({ ...props, percent: 20 });
            await advance(32);
            expect(shownNumber(getText())).toBeLessThanOrEqual(middle);
            await advance(400);
            expect(getText()).toHaveTextContent(/^20%$/);
        });

        it('动画过程中关闭 motion，动画停在新的 percent', async () => {
            fakeFrames();
            const props: Props = { type: 'circle', percent: 0, showInfo: true };
            const { container, rerender } = renderProgress(props);
            await rerender({ ...props, percent: 100 });
            await advance(100);
            await rerender({ ...props, percent: 20, motion: false });
            expect(getProgressbar()).toHaveAttribute('aria-valuenow', '20');
            await advance(50);
            expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^20%$/);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('动画过程中卸载，不残留待执行的帧', async () => {
            fakeFrames();
            const view = renderProgress({ type: 'circle', percent: 0 });
            await view.rerender({ type: 'circle', percent: 80 });
            await advance(50);
            expect(vi.getTimerCount()).toBeGreaterThan(0);
            view.unmount();
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    it('circle 尺寸：默认 72px 带文本，small 为 24px 且无文本', async () => {
        const props: Props = { type: 'circle', percent: 40, showInfo: true };
        const { container, rerender } = renderProgress(props);
        const ring = () => container.querySelector(`.${prefixCls}-circle-ring`);
        expect(ring()).toHaveAttribute('width', '72');
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^40%$/);
        await rerender({ ...props, size: 'small' });
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
        expect(container.querySelector(`.${prefixCls}-track-inner`)?.getAttribute('style')).toContain('background: rgb(0, 0, 255)');
    });

    it('两种类型下 #format 都接收截断后的 percent', () => {
        const format = vi.fn<FormatSlot>(({ percent }) => [<span>{`${percent} pts`}</span>]);
        const line = renderProgress({ percent: 120, showInfo: true }, { format });
        expect(line.container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^100 pts$/);
        line.unmount();
        const { container: circle } = renderProgress({ type: 'circle', percent: -5, showInfo: true }, { format });
        expect(circle.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^0 pts$/);
    });

    it('未提供 #format 时两种类型都输出 N%', () => {
        const line = renderProgress({ percent: 35, showInfo: true });
        expect(line.container.querySelector(`.${prefixCls}-line-text`)).toHaveTextContent(/^35%$/);
        line.unmount();
        const { container: circle } = renderProgress({ type: 'circle', percent: 35, showInfo: true });
        expect(circle.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^35%$/);
    });

    it('文本不显示时不求值 #format', () => {
        const format = vi.fn<FormatSlot>(() => [<span>x</span>]);
        renderProgress({ percent: 50 }, { format }).unmount();
        renderProgress({ percent: 50, showInfo: true, indeterminate: true }, { format }).unmount();
        renderProgress({ percent: 50, showInfo: true, type: 'circle', size: 'small' }, { format }).unmount();
        expect(format).not.toHaveBeenCalled();
    });

    it('两种类型下 id、aria 与 data 属性都透传到根元素', async () => {
        const attrs = {
            id: 'p',
            'aria-label': 'upload',
            'aria-labelledby': 'lbl',
            'aria-valuetext': 'half',
            'data-testid': 'root',
        };
        const view = render(Progress, { attrs });
        for (const type of ['line', 'circle'] as const) {
            await view.rerender({ type });
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

    it('两种类型下组件 $el 都是根元素', async () => {
        const view = render(Instance);
        const lastEl = () => view.emitted<[Element]>().el.at(-1)?.[0];
        expect(lastEl()).toBe(getProgressbar());
        await view.rerender({ type: 'circle' });
        expect(getProgressbar()).toHaveClass(`${prefixCls}-circle`);
        expect(lastEl()).toBe(getProgressbar());
    });

    it('两种类型下其他 DOM 属性与事件都透传到根元素', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = render(Progress, { attrs: { title: 'tip', onClick } });
        for (const [index, type] of (['line', 'circle'] as const).entries()) {
            await view.rerender({ type });
            const node = getProgressbar();
            expect(node).toHaveAttribute('title', 'tip');
            node.click();
            expect(onClick).toHaveBeenCalledTimes(index + 1);
        }
    });

    it('读取注入的 semiGlobal overrideDefaultProps 中的默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Progress: { showInfo: true, type: 'circle', strokeWidth: 8 } };
        const { container } = render(Progress, {
            props: { percent: 25 },
            global: { provide: { [semiGlobalKey]: semi } },
        });
        expect(container.querySelector(`.${prefixCls}-circle-text`)).toHaveTextContent(/^25%$/);
        expect(container.querySelector('circle')).toHaveAttribute('stroke-width', '8');
    });
});
