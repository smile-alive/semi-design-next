import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import NodeCollapsible from '../node-collapsible.vue';

const isOpen = () => !document.querySelector(`.${BASE_CLASS_PREFIX}-collapsible-wrapper > [x-semi-prop="children"]`)?.hasAttribute('inert');
async function flush() {
    await vi.advanceTimersByTimeAsync(0);
    await nextTick();
}

describe('NodeCollapsible', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('切换一次到挂载状态的相反值，之后忽略后续的 open 变化', async () => {
        const view = render(NodeCollapsible, { props: { open: false, motion: false, duration: 200 } });
        expect(isOpen()).toBe(false);
        await flush();
        expect(isOpen()).toBe(true);

        await view.rerender({ open: true });
        await flush();
        expect(isOpen()).toBe(true);
    });

    it('动画过程中树数据变化时，已折叠的分组保持折叠', async () => {
        const view = render(NodeCollapsible, { props: { open: true, motion: false, duration: 200 } });
        await flush();
        expect(isOpen()).toBe(false);

        await view.rerender({ open: false });
        await flush();
        expect(isOpen()).toBe(false);
    });
});
