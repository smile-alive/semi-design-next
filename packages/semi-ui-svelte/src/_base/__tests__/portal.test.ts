import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import PortalConfig from './portal-config.svelte';
import PortalEffect from './portal-effect.svelte';
import PortalFixture from './portal-fixture.svelte';
import { createStore } from './store.svelte';

const portalOf = (text: string) => screen.queryByText(text)?.closest<HTMLElement>('.semi-portal') ?? null;

function setup(props: { getPopupContainer?: () => HTMLElement | null; zIndex?: number } = {}) {
    const store = createStore({ open: true, content: false, global: false });
    const result = render(PortalFixture, { props: { store, ...props } });
    flushSync();
    return { store, ...result };
}

function sentinel(parent: HTMLElement = document.body) {
    const node = document.createElement('div');
    node.dataset.testid = 'sentinel';
    parent.append(node);
    onTestFinished(() => node.remove());
    return node;
}

describe('Svelte Portal', () => {
    it('挂载后移到 body，外层带 .semi-portal 与 zIndex，snippet 收到 inBody', () => {
        setup({ zIndex: 1000 });
        const portal = portalOf('inside');
        expect(portal?.parentElement).toBe(document.body);
        expect(portal?.style.zIndex).toBe('1000');
        expect(portal?.style.position).toBe('');
        expect(screen.getByText('inside')).toHaveAttribute('data-in-body', 'true');
        // the component's own place keeps only its siblings
        expect(screen.getByText('before').nextElementSibling).toBe(screen.getByText('after'));
    });

    it('自定义容器时外层 position 为 static，snippet 收到 inBody 为 false', () => {
        const container = document.createElement('div');
        document.body.append(container);
        onTestFinished(() => container.remove());
        setup({ getPopupContainer: () => container });
        expect(portalOf('inside')?.parentElement).toBe(container);
        expect(portalOf('inside')?.style.position).toBe('static');
        expect(screen.getByText('inside')).toHaveAttribute('data-in-body', 'false');
    });

    it('没有自身函数时用 ConfigProvider 的 getPopupContainer 并输出 dir；可以查询挂载后才在文档中的元素', () => {
        const container = document.createElement('div');
        document.body.append(container);
        onTestFinished(() => container.remove());
        render(PortalConfig, { props: { container } });
        flushSync();
        expect(portalOf('config')?.parentElement).toBe(container);
        expect(portalOf('config')).toHaveAttribute('dir', 'rtl');
        expect(portalOf('sibling')?.parentElement).toHaveClass('host');
    });

    it('子组件的 $effect 运行时元素已在目标容器内，effect 里的聚焦不被移动打断', () => {
        const container = document.createElement('div');
        document.body.append(container);
        onTestFinished(() => container.remove());
        const runs: boolean[] = [];
        render(PortalEffect, { props: { container, runs } });
        flushSync();
        const button = screen.getByRole('button', { name: 'focus target' });
        expect(container).toContainElement(button);
        expect(runs).toEqual([true]);
        expect(document.activeElement).toBe(button);
    });

    it('所在块卸载时移走的节点一起移除，容器里的其他节点保留', () => {
        const { store } = setup();
        const portal = portalOf('inside');
        const other = sentinel();
        store.open = false;
        flushSync();
        expect(portal?.isConnected).toBe(false);
        expect(other.isConnected).toBe(true);
        expect(screen.getByText('before').nextElementSibling).toBe(screen.getByText('after'));
    });

    it('整个组件卸载时移走的节点一起移除，自定义容器里的其他节点保留', () => {
        const container = document.createElement('div');
        document.body.append(container);
        onTestFinished(() => container.remove());
        const { unmount } = setup({ getPopupContainer: () => container });
        const portal = portalOf('inside');
        const other = sentinel(container);
        unmount();
        expect(portal?.isConnected).toBe(false);
        expect(other.isConnected).toBe(true);
        expect(container.children).toHaveLength(1);
    });
});
