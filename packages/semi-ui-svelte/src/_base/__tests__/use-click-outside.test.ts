import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import ClickOutsideFixture from './click-outside-fixture.svelte';
import { createStore } from './store.svelte';

function setup(enabled = true) {
    const store = createStore<{ enabled: boolean; log: string[] }>({ enabled, log: [] });
    render(ClickOutsideFixture, { props: { store } });
    flushSync();
    return store;
}

describe('useClickOutside', () => {
    it('在目标之外按下鼠标时回调，收到原生 MouseEvent', async () => {
        const store = setup();
        await fireEvent.mouseDown(screen.getByText('outside'));
        expect(store.log).toEqual(['outside true']);
    });

    it('在目标内按下鼠标不回调', async () => {
        const store = setup();
        await fireEvent.mouseDown(screen.getByText('inside'));
        await fireEvent.mouseDown(screen.getByTestId('target'));
        expect(store.log).toEqual([]);
    });

    it('nested 给出的弹层内按下鼠标不回调', async () => {
        const store = setup();
        await fireEvent.mouseDown(screen.getByText('nested'));
        expect(store.log).toEqual([]);
    });

    it('enabled 为 false 时不回调，改为 true 后开始回调，再关闭后停止', async () => {
        const store = setup(false);
        await fireEvent.mouseDown(screen.getByText('outside'));
        expect(store.log).toEqual([]);
        store.enabled = true;
        flushSync();
        await fireEvent.mouseDown(screen.getByText('outside'));
        expect(store.log).toEqual(['outside true']);
        store.enabled = false;
        flushSync();
        await fireEvent.mouseDown(screen.getByText('outside'));
        expect(store.log).toEqual(['outside true']);
    });

    it('卸载后不再监听', async () => {
        const store = createStore<{ enabled: boolean; log: string[] }>({ enabled: true, log: [] });
        const { unmount } = render(ClickOutsideFixture, { props: { store } });
        unmount();
        await fireEvent.mouseDown(document.body);
        expect(store.log).toEqual([]);
    });
});
