/** @jsxImportSource vue */
import { defineComponent, nextTick, useTemplateRef } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useMutationObserver from '../use-mutation-observer';

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useMutationObserver', () => {
    it('挂载后以空记录调用一次，DOM 变化时再调用，卸载后不再调用', async () => {
        const onChange = vi.fn<(records: MutationRecord[]) => void>();
        const Host = defineComponent({
            setup() {
                const root = useTemplateRef<HTMLDivElement>('root');
                useMutationObserver(root, onChange, { attributes: true });
                return () => <div ref="root" />;
            },
        });
        const view = render(Host);
        await nextTick();
        expect(onChange.mock.calls).toEqual([[[]]]);

        const el = view.container.firstElementChild as HTMLElement;
        el.setAttribute('data-x', '1');
        await flushMutations();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0][0].attributeName).toBe('data-x');

        view.unmount();
        el.setAttribute('data-x', '2');
        await flushMutations();
        expect(onChange).toHaveBeenCalledTimes(2);
    });
});
