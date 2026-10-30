import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import PortalEffect from './portal-effect.svelte';
import PortalFixture from './portal-fixture.svelte';
import { createStore } from './store.svelte';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function durationOf(node: Element) {
    const { animationDuration } = getComputedStyle(node);
    return parseFloat(animationDuration) * (animationDuration.endsWith('ms') ? 1 : 1000);
}

describe('Svelte Portal 子组件的 effect', () => {
    it('effect 里聚焦的元素在 Portal 落位后仍持有焦点', () => {
        const container = document.createElement('div');
        document.body.append(container);
        onTestFinished(() => container.remove());
        const runs: boolean[] = [];
        render(PortalEffect, { props: { container, runs } });
        flushSync();
        const button = screen.getByRole('button', { name: 'focus target' });
        expect(runs).toEqual([true]);
        expect(document.activeElement).toBe(button);
    });
});

describe('Svelte Portal 出场动画', () => {
    it('Portal 内的块出场期间节点留在容器里，结束后移除，Portal 保留', async () => {
        const store = createStore({ open: true, content: true, global: false });
        render(PortalFixture, { props: { store } });
        flushSync();
        const node = screen.getByTestId('local');
        const portal = node.closest('.semi-portal');
        expect(portal?.parentElement).toBe(document.body);

        store.content = false;
        flushSync();
        expect(node.isConnected).toBe(true);
        expect(node.parentElement?.closest('.semi-portal')).toBe(portal);
        expect(node).toHaveClass('semi-modal-content-animate-hide');
        await wait(durationOf(node) + 100);
        expect(node.isConnected).toBe(false);
        expect(portal?.isConnected).toBe(true);
    });

    it('包住 Portal 的块卸载时，global 出场期间整个 Portal 留在 body，结束后一起移除', async () => {
        const store = createStore({ open: true, content: false, global: true });
        render(PortalFixture, { props: { store } });
        flushSync();
        const node = screen.getByTestId('global');
        const portal = node.closest('.semi-portal');
        const other = document.createElement('div');
        document.body.append(other);

        store.open = false;
        flushSync();
        expect(portal?.parentElement).toBe(document.body);
        expect(node).toHaveClass('semi-modal-content-animate-hide');
        const duration = durationOf(node);
        expect(duration).toBeGreaterThan(0);
        await wait(duration + 100);
        expect(portal?.isConnected).toBe(false);
        expect(other.isConnected).toBe(true);
        expect(screen.getByText('before').nextElementSibling).toBe(screen.getByText('after'));
        other.remove();
    });
});
