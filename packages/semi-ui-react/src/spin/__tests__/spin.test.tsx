import { StrictMode, createRef } from 'react';
import { render, act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Button from '@fibrae/semi-ui-react/button';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import Spin from '..';

const prefixCls = `${BASE_CLASS_PREFIX}-spin`;

const getSpin = (container) => container.querySelector(`.${BASE_CLASS_PREFIX}-spin`);

describe('Spin', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('以所选语言把加载状态作为具名 status 播报', () => {
        const { rerender } = render(<Spin />);
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        rerender(
            <ConfigProvider locale={en_US}>
                <Spin />
            </ConfigProvider>
        );
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('加载结束后不再有 status', () => {
        render(<Spin spinning={false} />);
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('status 包含 tip 文本', () => {
        render(<Spin tip="Fetching" />);
        expect(screen.getByRole('status')).toHaveTextContent('Fetching');
    });

    it('仅在加载时将被包裹内容标记为 busy', () => {
        const { container, rerender } = render(
            <Spin spinning>
                <p>content</p>
            </Spin>
        );
        expect(getSpin(container)).toHaveAttribute('aria-busy', 'true');
        rerender(
            <Spin spinning={false}>
                <p>content</p>
            </Spin>
        );
        expect(getSpin(container)).not.toHaveAttribute('aria-busy');
    });

    it('数字 0 的 tip 与 children 照常渲染', () => {
        const { container } = render(<Spin tip={0}>{0}</Spin>);
        expect(screen.getByRole('status')).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-children`)).toHaveTextContent(/^0$/);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-block`);
        expect(getSpin(container)).toHaveAttribute('aria-busy', 'true');
    });

    it('没有内容的 spinner 不标记 busy，它本身就是 status', () => {
        const { container } = render(<Spin />);
        expect(getSpin(container)).not.toHaveAttribute('aria-busy');
    });

    it('由 spinning 控制显示', () => {
        const { container, rerender } = render(<Spin spinning={false} />);
        expect(getSpin(container)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);

        rerender(<Spin spinning />);
        expect(getSpin(container)).not.toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);
    });

    it('delay 延迟', () => {
        vi.useFakeTimers();
        const { container, rerender } = render(<Spin delay={1000} spinning={false} />);
        expect(getSpin(container)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);

        rerender(<Spin delay={1000} spinning />);
        expect(getSpin(container)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);

        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getSpin(container)).toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getSpin(container)).not.toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);
    });

    it('delay 仅在重新开始加载时生效，停止时立即隐藏', () => {
        vi.useFakeTimers();
        const { container, rerender, unmount } = render(<Spin delay={1000} spinning />);
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-hidden`);

        rerender(<Spin delay={1000} spinning={false} />);
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);

        rerender(<Spin delay={1000} spinning />);
        void act(() => vi.advanceTimersByTime(500));
        rerender(<Spin delay={1000} spinning={false} />);
        void act(() => vi.advanceTimersByTime(1000));
        expect(getSpin(container)).toHaveClass(`${prefixCls}-hidden`);

        rerender(<Spin delay={1000} spinning />);
        unmount();
        void act(() => vi.advanceTimersByTime(2000));
    });

    it('延迟显示不遗留定时器，StrictMode 下同样如此', () => {
        vi.useFakeTimers();
        const ref = createRef<HTMLDivElement>();
        const { container, rerender } = render(
            <StrictMode>
                <Spin ref={ref} delay={1000} spinning={false} />
            </StrictMode>
        );
        expect(ref.current).toBe(getSpin(container));
        rerender(
            <StrictMode>
                <Spin ref={ref} delay={1000} spinning />
            </StrictMode>
        );
        void act(() => vi.advanceTimersByTime(1000));
        expect(getSpin(container)).not.toHaveClass(`${prefixCls}-hidden`);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('className 与 wrapperClassName 同时落在根元素', () => {
        const { container } = render(<Spin className="x" wrapperClassName="w" />);
        expect(getSpin(container)).toHaveClass('x', 'w', prefixCls);
    });

    it('渲染 indicator、tip、children，以及 size 和 block 类名', () => {
        const { container } = render(
            <Spin wrapperClassName="wrap" childStyle={{ opacity: 0.5 }} style={{ color: 'red' }} data-x="1" indicator={<i data-testid="indicator" />} size="large" tip="loading">
                <p>content</p>
            </Spin>
        );
        const spin = getSpin(container);
        expect(spin).toHaveClass(`${prefixCls}-large`, `${prefixCls}-block`, 'wrap');
        expect(spin).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(spin).toHaveAttribute('data-x', '1');
        expect(screen.getByTestId('indicator').parentElement).toHaveAttribute('x-semi-prop', 'indicator');
        expect(screen.getByText('loading')).toHaveAttribute('x-semi-prop', 'tip');
        const children = screen.getByText('content').parentElement;
        expect(children).toHaveClass(`${prefixCls}-children`);
        expect(children).toHaveStyle({ opacity: '0.5' });
        expect(container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('spin 从 semiGlobal overrideDefaultProps 读取默认值和 indicator', () => {
        semiGlobal.config.overrideDefaultProps = {
            Spin: { size: 'small', indicator: <i data-testid="global-indicator" /> },
        };
        try {
            const { container } = render(<Spin />);
            expect(getSpin(container)).toHaveClass(`${prefixCls}-small`);
            expect(screen.getByTestId('global-indicator')).toBeInTheDocument();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('按钮 loading 使用全局 indicator 时保留它自带的 className', () => {
        semiGlobal.config.overrideDefaultProps = {
            Spin: { indicator: <i className="mine" data-testid="global-indicator" /> },
        };
        try {
            render(<Button loading>go</Button>);
            expect(screen.getByTestId('global-indicator')).toHaveClass('mine');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('每个 spin 图标引用各自的渐变', () => {
        const { container } = render(
            <>
                <Spin />
                <Spin />
            </>
        );
        const ids = [...container.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
        expect(new Set(ids).size).toBe(2);
        container.querySelectorAll('[data-icon="spin"] path').forEach((path, index) => {
            expect(path).toHaveAttribute('stroke', `url(#${ids[index]})`);
        });
    });
});
