/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useScrollLock from '../use-scroll-lock';

function setup(locked: boolean) {
    const state = ref(locked);
    const view = render(
        defineComponent({
            setup() {
                useScrollLock(() => state.value);
                return () => null;
            },
        })
    );
    return { state, ...view };
}

describe('useScrollLock', () => {
    it('locked 期间锁住页面滚动，与其它锁共用计数', async () => {
        const first = setup(false);
        expect(document.body.style.overflow).toBe('');
        first.state.value = true;
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        const second = setup(true);
        expect(document.body.style.overflow).toBe('hidden');
        first.state.value = false;
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        second.unmount();
        expect(document.body.style.overflow).toBe('');
    });
});
