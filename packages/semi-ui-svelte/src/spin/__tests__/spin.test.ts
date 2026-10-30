import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { SpinProps } from '../interface';
import LocaleFixture from './locale-fixture.svelte';
import SpinFixture from './spin-fixture.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-spin`;

function setup(props: SpinProps = {}, extra: { content?: boolean; tip?: string; indicator?: boolean; button?: boolean } = {}) {
    const store = createStore({ props, ...extra });
    const view = render(SpinFixture, { props: { store } });
    const root = () => view.container.querySelector(`.${prefixCls}`) as HTMLElement;
    return { store, root, view };
}

describe('Svelte Spin', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('把加载状态作为具名 status 播报，空 spinner 不标记 busy', () => {
        const { root } = setup();
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        expect(root()).not.toHaveAttribute('aria-busy');
    });

    it('停止加载后移除 status', () => {
        setup({ spinning: false });
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('加载状态随 ConfigProvider 语言切换', () => {
        const store = createStore<{ locale?: typeof en_US; configLocale?: typeof en_US | null }>({});
        render(LocaleFixture, { props: { store } });
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        store.configLocale = en_US;
        flushSync();
        expect(screen.getByRole('status', { name: en_US.Spin.loading })).toBeInTheDocument();
    });

    it('status 包含 tip', () => {
        setup({}, { tip: 'Fetching' });
        expect(screen.getByRole('status')).toHaveTextContent('Fetching');
    });

    it('仅在加载时将包裹内容标记为 busy', () => {
        const { root, store } = setup({}, { content: true });
        expect(root()).toHaveAttribute('aria-busy', 'true');
        store.props.spinning = false;
        flushSync();
        expect(root()).not.toHaveAttribute('aria-busy');
    });

    it('spinning 控制显示', () => {
        const { root, store } = setup({ spinning: false });
        expect(root()).toHaveClass(`${prefixCls}-hidden`);
        store.props.spinning = true;
        flushSync();
        expect(root()).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('重新开始时等待 delay，初次加载立即显示', () => {
        vi.useFakeTimers();
        const { root, store } = setup({ delay: 1000 });
        expect(root()).not.toHaveClass(`${prefixCls}-hidden`);
        store.props.spinning = false;
        flushSync();
        expect(root()).toHaveClass(`${prefixCls}-hidden`);
        store.props.spinning = true;
        flushSync();
        vi.advanceTimersByTime(999);
        flushSync();
        expect(root()).toHaveClass(`${prefixCls}-hidden`);
        vi.advanceTimersByTime(1);
        flushSync();
        expect(root()).not.toHaveClass(`${prefixCls}-hidden`);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('停止及卸载取消尚未显示的定时器', () => {
        vi.useFakeTimers();
        const { root, store, view } = setup({ spinning: false, delay: 1000 });
        store.props.spinning = true;
        flushSync();
        vi.advanceTimersByTime(500);
        store.props.spinning = false;
        flushSync();
        vi.advanceTimersByTime(1000);
        flushSync();
        expect(root()).toHaveClass(`${prefixCls}-hidden`);
        store.props.spinning = true;
        flushSync();
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('class 与 wrapperClassName 及其余属性落在根元素', () => {
        const { root } = setup({ wrapperClassName: 'wrap', class: 'custom', 'data-x': '1', style: 'color: red' } as SpinProps);
        expect(root()).toHaveClass(prefixCls, 'wrap', 'custom');
        expect(root()).toHaveAttribute('data-x', '1');
        expect(root()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('渲染 indicator、tip、children、size 与 childStyle', () => {
        const { root, view } = setup({ size: 'large', childStyle: 'opacity: 0.5' }, { indicator: true, tip: 'loading', content: true });
        expect(root()).toHaveClass(`${prefixCls}-large`, `${prefixCls}-block`);
        expect(screen.getByTestId('indicator').parentElement).toHaveAttribute('x-semi-prop', 'indicator');
        expect(screen.getByText('loading').parentElement).toHaveAttribute('x-semi-prop', 'tip');
        expect(screen.getByText('content').parentElement).toHaveStyle({ opacity: '0.5' });
        expect(view.container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('全局默认值生效且显式 props 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Spin: { size: 'small', spinning: false } };
        const first = setup();
        expect(first.root()).toHaveClass(`${prefixCls}-small`, `${prefixCls}-hidden`);
        const second = setup({ size: 'large', spinning: true });
        expect(second.root()).toHaveClass(`${prefixCls}-large`);
        expect(second.root()).not.toHaveClass(`${prefixCls}-hidden`);
    });

    it('不同实例的图标引用各自渐变', () => {
        const first = setup();
        const second = setup();
        const firstId = first.view.container.querySelector('linearGradient')?.id;
        const secondId = second.view.container.querySelector('linearGradient')?.id;
        expect(firstId).toBeTruthy();
        expect(firstId).not.toBe(secondId);
        expect(first.view.container.querySelector('path')).toHaveAttribute('stroke', `url(#${firstId})`);
        expect(second.view.container.querySelector('path')).toHaveAttribute('stroke', `url(#${secondId})`);
    });
});
