import { createContext, createEffect, createSignal, onCleanup, useContext } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import renderDetached from '../detached-render';

const microtask = () => Promise.resolve();

describe('renderDetached', () => {
    it('默认渲染到 body 下新建的容器；dispose 立即移除容器，当前任务结束后释放', async () => {
        const cleanup = vi.fn<() => void>();
        const dispose = renderDetached(() => {
            onCleanup(cleanup);
            return <span data-testid="detached">content</span>;
        });
        const container = screen.getByTestId('detached').parentElement;
        expect(container?.parentElement).toBe(document.body);

        dispose();
        expect(container?.isConnected).toBe(false);
        expect(cleanup).not.toHaveBeenCalled();
        await microtask();
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('渲染到给定容器，dispose 移除该容器', async () => {
        const container = document.createElement('section');
        document.body.append(container);
        const dispose = renderDetached(() => <span>content</span>, container);
        expect(container.textContent).toBe('content');

        dispose();
        expect(container.isConnected).toBe(false);
        await microtask();
    });

    it('不继承调用处组件的 context', async () => {
        const Theme = createContext('default');
        let dispose = () => {};
        function Caller() {
            dispose = renderDetached(() => <span data-testid="detached">{useContext(Theme)}</span>);
            return null;
        }
        render(() => (
            <Theme.Provider value="caller">
                <Caller />
            </Theme.Provider>
        ));
        expect(screen.getByTestId('detached').textContent).toBe('default');
        dispose();
        await microtask();
    });

    it('在树自己的更新中 dispose 时，这次更新照常完成', async () => {
        const [count, setCount] = createSignal(0);
        const later: number[] = [];
        const dispose = renderDetached(() => {
            createEffect(() => {
                if (count() === 1) {
                    dispose();
                }
            });
            createEffect(() => later.push(count()));
            return null;
        });

        setCount(1);
        expect(later).toEqual([0, 1]);
        await microtask();
        setCount(2);
        expect(later).toEqual([0, 1]);
    });
});
