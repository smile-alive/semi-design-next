/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Spin from '..';
import semiGlobal from '../../_utils/semi-global';
import LocaleFixture from './fixtures/locale.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-spin`;

describe('Spin', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('把加载状态作为具名 status 播报，空 spinner 不标记 busy', () => {
        const { container } = render(Spin);
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
    });

    it('停止加载后移除 status', () => {
        render(Spin, { props: { spinning: false } });
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('加载状态随 ConfigProvider 语言切换', async () => {
        const view = render(LocaleFixture);
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        await view.rerender({ locale: en_US });
        expect(screen.getByRole('status', { name: en_US.Spin.loading })).toBeInTheDocument();
    });

    it('status 包含 tip 插槽', () => {
        render(Spin, { slots: { tip: () => <span>Fetching</span> } });
        expect(screen.getByRole('status')).toHaveTextContent('Fetching');
    });

    it('仅在加载时将包裹内容标记为 busy', async () => {
        const view = render(Spin, { slots: { default: () => <p>content</p> } });
        const { container } = view;
        expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
        await view.rerender({ spinning: false });
        expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
    });

    it('spinning 控制显示', async () => {
        const view = render(Spin, { props: { spinning: false } });
        const { container } = view;
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-hidden`);
        await view.rerender({ spinning: true });
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('重新开始时等待 delay，初次加载立即显示', async () => {
        vi.useFakeTimers();
        const view = render(Spin, { props: { delay: 1000 } });
        const { container } = view;
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-hidden`);
        await view.rerender({ spinning: false });
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-hidden`);
        await view.rerender({ spinning: true });
        vi.advanceTimersByTime(999);
        await nextTick();
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-hidden`);
        vi.advanceTimersByTime(1);
        await nextTick();
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-hidden`);
        expect(vi.getTimerCount()).toBe(0);
    });

    // Vue has no StrictMode double mount; ordinary unmount must still cancel the foundation timer.
    it('停止及卸载取消尚未显示的定时器', async () => {
        vi.useFakeTimers();
        const view = render(Spin, { props: { spinning: false, delay: 1000 } });
        const { container } = view;
        await view.rerender({ spinning: true });
        vi.advanceTimersByTime(500);
        await view.rerender({ spinning: false });
        vi.advanceTimersByTime(1000);
        await nextTick();
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-hidden`);
        await view.rerender({ spinning: true });
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('class 与 wrapperClassName 及 attrs 落在根元素', () => {
        const { container } = render(Spin, {
            props: { wrapperClassName: 'wrap' },
            attrs: { class: 'custom', 'data-x': '1', style: { color: 'red' } },
        });
        expect(container.firstElementChild).toHaveClass(prefixCls, 'wrap', 'custom');
        expect(container.firstElementChild).toHaveAttribute('data-x', '1');
        expect(container.firstElementChild).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('渲染 indicator、tip、children、size 与 childStyle', () => {
        const { container } = render(Spin, {
            props: { size: 'large', childStyle: { opacity: 0.5 } },
            slots: {
                indicator: () => <i data-testid="indicator" />,
                tip: () => <span>loading</span>,
                default: () => <p>content</p>,
            },
        });
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-large`, `${prefixCls}-block`);
        expect(screen.getByTestId('indicator').parentElement).toHaveAttribute('x-semi-prop', 'indicator');
        expect(screen.getByText('loading').parentElement).toHaveAttribute('x-semi-prop', 'tip');
        expect(screen.getByText('content').parentElement).toHaveStyle({ opacity: '0.5' });
        expect(container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Spin: { size: 'small', spinning: false } };
        const first = render(Spin);
        expect(first.container.firstElementChild).toHaveClass(`${prefixCls}-small`, `${prefixCls}-hidden`);
        const second = render(Spin, { props: { size: 'large', spinning: true } });
        expect(second.container.firstElementChild).toHaveClass(`${prefixCls}-large`);
        expect(second.container.firstElementChild).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('不同实例的图标引用各自渐变', () => {
        const first = render(Spin);
        const second = render(Spin);
        const firstId = first.container.querySelector('linearGradient')?.id;
        const secondId = second.container.querySelector('linearGradient')?.id;
        expect(firstId).not.toBe(secondId);
        expect(first.container.querySelector('path')).toHaveAttribute('stroke', `url(#${firstId})`);
        expect(second.container.querySelector('path')).toHaveAttribute('stroke', `url(#${secondId})`);
    });
});
