import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import ContentClick from './content-click.svelte';

describe('Svelte Tooltip 弹层内的点击', () => {
    it.each([false, true])('stopPropagation=%s 时，内容里的 onclick 都收到点击', async (stopPropagation) => {
        const store = { log: [] as string[] };
        render(ContentClick, { props: { store, props: { stopPropagation } } });
        const button = await screen.findByRole('button', { name: 'act' });
        button.click();
        expect(store.log).toEqual(['content click']);
    });

    it.each([false, true])('stopPropagation=%s 时，内容里的 onmousedown、onfocusin、onfocusout 都收到事件', async (stopPropagation) => {
        const store = { log: [] as string[] };
        render(ContentClick, { props: { store, props: { stopPropagation } } });
        const button = await screen.findByRole('button', { name: 'act' });
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.focus();
        button.blur();
        expect(store.log).toEqual(['content mousedown', 'content focusin', 'content focusout']);
    });

    it('stopPropagation=true 时 mousedown、focusin、focusout 不到达在 Svelte 之后注册的 document 监听，false 时到达', async () => {
        for (const stopPropagation of [true, false]) {
            const { unmount } = render(ContentClick, { props: { store: { log: [] }, props: { stopPropagation } } });
            const button = await screen.findByRole('button', { name: 'act' });
            const outside = vi.fn<(event: Event) => void>();
            for (const type of ['mousedown', 'focusin', 'focusout']) document.addEventListener(type, outside);
            button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            button.focus();
            button.blur();
            for (const type of ['mousedown', 'focusin', 'focusout']) document.removeEventListener(type, outside);
            expect(outside).toHaveBeenCalledTimes(stopPropagation ? 0 : 3);
            unmount();
        }
    });

    it('stopPropagation=true 时点击不到达在 Svelte 之后注册的 document 监听，false 时到达', async () => {
        for (const stopPropagation of [true, false]) {
            const store = { log: [] as string[] };
            const { unmount } = render(ContentClick, { props: { store, props: { stopPropagation } } });
            const button = await screen.findByRole('button', { name: 'act' });
            // Svelte registered its document listener when it mounted this tree
            const outside = vi.fn<(event: Event) => void>();
            document.addEventListener('click', outside);
            button.click();
            document.removeEventListener('click', outside);
            expect(store.log).toEqual(['content click']);
            expect(outside).toHaveBeenCalledTimes(stopPropagation ? 0 : 1);
            unmount();
        }
    });
});
