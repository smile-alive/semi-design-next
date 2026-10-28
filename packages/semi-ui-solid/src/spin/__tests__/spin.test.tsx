import { createSignal, onMount } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Spin, { type SpinProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-spin`;
const getSpin = (container: HTMLElement) => container.querySelector(`.${prefixCls}`) as HTMLElement;

describe('Spin', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('以所选语言把加载状态作为具名 status 播报', () => {
        const [locale, setLocale] = createSignal(zh_CN);
        render(() => (
            <ConfigProvider locale={locale()}>
                <Spin />
            </ConfigProvider>
        ));
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        setLocale(en_US);
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('加载结束后不再有 status', () => {
        render(() => <Spin spinning={false} />);
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('status 包含 tip 文本', () => {
        render(() => <Spin tip="Fetching" />);
        expect(screen.getByRole('status')).toHaveTextContent('Fetching');
    });

    it('仅在加载时将被包裹内容标记为 busy 与 inert', () => {
        const [spinning, setSpinning] = createSignal(true);
        const { container } = render(() => (
            <Spin spinning={spinning()}>
                <p>content</p>
            </Spin>
        ));
        expect(getSpin(container)).toHaveAttribute('aria-busy', 'true');
        expect((screen.getByText('content').parentElement as HTMLElement).inert).toBe(true);
        setSpinning(false);
        expect(getSpin(container)).not.toHaveAttribute('aria-busy');
        expect((screen.getByText('content').parentElement as HTMLElement).inert).toBe(false);
    });

    it('数字 0 的 tip 与 children 照常渲染', () => {
        const { container } = render(() => <Spin tip={0}>{0}</Spin>);
        expect(screen.getByRole('status')).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-children`)).toHaveTextContent(/^0$/);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-block`);
        expect(getSpin(container)).toHaveAttribute('aria-busy', 'true');
    });

    it('没有内容的 spinner 不标记 busy，它本身就是 status', () => {
        const { container } = render(() => <Spin />);
        expect(getSpin(container)).not.toHaveAttribute('aria-busy');
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-block`);
    });

    it('由 spinning 控制显示', () => {
        const [spinning, setSpinning] = createSignal(false);
        const { container } = render(() => <Spin spinning={spinning()} />);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);
        setSpinning(true);
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('使用方展开信号对象时，无关属性变化不重启 delay 计时', () => {
        vi.useFakeTimers();
        const [p, setP] = createSignal<SpinProps>({ delay: 1000, spinning: false });
        const { container } = render(() => <Spin {...p()} />);
        setP((prev) => ({ ...prev, spinning: true }));
        vi.advanceTimersByTime(600);
        setP((prev) => ({ ...prev, class: 'other' }));
        vi.advanceTimersByTime(400);
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('delay 延迟显示，且挂载时已在加载则立即显示', () => {
        vi.useFakeTimers();
        const [spinning, setSpinning] = createSignal(true);
        const { container } = render(() => <Spin delay={1000} spinning={spinning()} />);
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-hidden`);
        setSpinning(false);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);
        setSpinning(true);
        vi.advanceTimersByTime(999);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);
        vi.advanceTimersByTime(1);
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-hidden`);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('停止时立即隐藏并取消尚未显示的定时器，卸载同样取消', () => {
        vi.useFakeTimers();
        const [spinning, setSpinning] = createSignal(false);
        const { container, unmount } = render(() => <Spin delay={1000} spinning={spinning()} />);
        setSpinning(true);
        vi.advanceTimersByTime(500);
        setSpinning(false);
        vi.advanceTimersByTime(1000);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);
        expect(vi.getTimerCount()).toBe(0);
        setSpinning(true);
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('class 与 wrapperClassName 同时落在根元素，ref 与未声明属性落在根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <Spin ref={(node) => (ref = node)} class="x" wrapperClassName="w" data-x="1" style={{ color: 'red' }} />);
        expect(getSpin(container)).toHaveClass('x', 'w', prefixCls);
        expect(getSpin(container)).toHaveAttribute('data-x', '1');
        expect(getSpin(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(ref).toBe(getSpin(container));
    });

    it('渲染 indicator、tip、children，以及 size 和 block 类名', () => {
        const { container } = render(() => (
            <Spin childStyle={{ opacity: 0.5 }} indicator={<i data-testid="indicator" />} size="large" tip="loading">
                <p>content</p>
            </Spin>
        ));
        expect(getSpin(container)).toHaveClass(`${prefixCls}-large`, `${prefixCls}-block`);
        expect(screen.getByTestId('indicator').parentElement).toHaveAttribute('x-semi-prop', 'indicator');
        expect(screen.getByText('loading')).toHaveAttribute('x-semi-prop', 'tip');
        const children = screen.getByText('content').parentElement;
        expect(children).toHaveClass(`${prefixCls}-children`);
        expect(children).toHaveAttribute('x-semi-prop', 'children');
        expect(children).toHaveStyle({ opacity: '0.5' });
        expect(container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('size 随 signal 更新', () => {
        const [size, setSize] = createSignal<'small' | 'large'>('small');
        const { container } = render(() => <Spin size={size()} />);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-small`);
        setSize('large');
        expect(getSpin(container)).toHaveClass(`${prefixCls}-large`);
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-small`);
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Spin: { size: 'small', spinning: false } };
        const first = render(() => <Spin />);
        expect(getSpin(first.container)).toHaveClass(`${prefixCls}-small`, `${prefixCls}-hidden`);
        const second = render(() => <Spin size="large" spinning />);
        expect(getSpin(second.container)).toHaveClass(`${prefixCls}-large`);
        expect(getSpin(second.container)).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('全局字符串 tip 对每个实例生效', () => {
        semiGlobal.config.overrideDefaultProps = { Spin: { tip: '加载中' } };
        const { container } = render(() => (
            <>
                <Spin />
                <Spin />
            </>
        ));
        expect([...container.querySelectorAll('[x-semi-prop="tip"]')].map((tip) => tip.textContent)).toEqual(['加载中', '加载中']);
    });

    it('全局 indicator 与 tip 为节点时忽略并告警，各实例保留自己的默认图标', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const indicator = document.createElement('i');
        const tip = document.createElement('i');
        semiGlobal.config.overrideDefaultProps = { Spin: { indicator, tip } };
        const { container } = render(() => (
            <>
                <Spin />
                <Spin />
            </>
        ));
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(2);
        expect(indicator.isConnected).toBe(false);
        expect(tip.isConnected).toBe(false);
        expect(container.querySelector('[x-semi-prop="tip"]')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("'tip'"));
    });

    it('每个 spin 图标引用各自的渐变', () => {
        const { container } = render(() => (
            <>
                <Spin />
                <Spin />
            </>
        ));
        const ids = [...container.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
        expect(new Set(ids).size).toBe(2);
        container.querySelectorAll('[data-icon="spin"] path').forEach((path, index) => {
            expect(path).toHaveAttribute('stroke', `url(#${ids[index]})`);
        });
    });

    it('焦点在被包裹内容里时，开始加载后移到 Spin 根元素，结束后回到原控件', () => {
        const [spinning, setSpinning] = createSignal(false);
        const { container } = render(() => (
            <>
                <Spin spinning={spinning()}>
                    <button type="button">inside</button>
                </Spin>
                <button type="button">after</button>
            </>
        ));
        screen.getByRole('button', { name: 'inside' }).focus();
        setSpinning(true);
        expect(getSpin(container)).toHaveFocus();
        expect(getSpin(container)).toHaveAttribute('tabindex', '-1');
        setSpinning(false);
        expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();
        expect(getSpin(container)).not.toHaveAttribute('tabindex');
    });

    it('加载期间焦点已被用户移走时，结束后不抢焦点', () => {
        const [spinning, setSpinning] = createSignal(false);
        const { container } = render(() => (
            <>
                <Spin spinning={spinning()}>
                    <button type="button">inside</button>
                </Spin>
                <button type="button">after</button>
            </>
        ));
        screen.getByRole('button', { name: 'inside' }).focus();
        setSpinning(true);
        screen.getByRole('button', { name: 'after' }).focus();
        setSpinning(false);
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getSpin(container)).not.toHaveFocus();
    });

    it('父组件挂载时就关了带 delay 的 spinning，加载状态随之隐藏', () => {
        function Demo() {
            const [spinning, setSpinning] = createSignal(true);
            onMount(() => setSpinning(false));
            return <Spin spinning={spinning()} delay={100} />;
        }
        const { container } = render(() => <Demo />);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);
    });
});
