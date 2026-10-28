/** @jsxImportSource vue */
import { defineComponent, nextTick, onMounted } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useStoreSnapshot from '../use-store-snapshot';

function createStore() {
    let value = 0;
    const listeners = new Set<() => void>();
    return {
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSnapshot: () => value,
        set: (next: number) => {
            value = next;
            for (const listener of listeners) listener();
        },
        listenerCount: () => listeners.size,
    };
}

describe('useStoreSnapshot', () => {
    it('挂载期间子组件对 store 的改动、之后的推送都会显示，卸载后退订', async () => {
        const store = createStore();
        const Child = defineComponent(() => {
            onMounted(() => store.set(1));
            return () => null;
        });
        const view = render(
            defineComponent(() => {
                const snapshot = useStoreSnapshot(store);
                return () => (
                    <output>
                        {snapshot.value}
                        <Child />
                    </output>
                );
            })
        );
        await nextTick();
        expect(view.getByRole('status')).toHaveTextContent('1');

        store.set(2);
        await nextTick();
        expect(view.getByRole('status')).toHaveTextContent('2');

        view.unmount();
        expect(store.listenerCount()).toBe(0);
    });
});
