/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useDidUpdate from '../use-did-update';

function setup(flush?: 'pre' | 'post') {
    const count = ref(0);
    const seen: string[] = [];
    const Probe = defineComponent({
        setup() {
            useDidUpdate(
                () => count.value,
                () => seen.push(document.querySelector('[data-testid="text"]')?.textContent ?? ''),
                Object.is,
                flush
            );
            return () => <span data-testid="text">{String(count.value)}</span>;
        },
    });
    render(Probe);
    return { count, seen };
}

describe('useDidUpdate flush', () => {
    it('默认在 DOM 更新后触发', async () => {
        const { count, seen } = setup();
        count.value = 1;
        await nextTick();
        expect(seen).toEqual(['1']);
    });

    it("'pre' 在 DOM 更新前触发", async () => {
        const { count, seen } = setup('pre');
        count.value = 1;
        await nextTick();
        expect(seen).toEqual(['0']);
    });
});
