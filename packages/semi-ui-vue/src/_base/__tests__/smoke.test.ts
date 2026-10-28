import { fireEvent, within } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { getData, mockMatchMedia, mockResizeObserver, render } from '@test/utils/vue';
import Smoke from './fixtures/smoke.vue';

describe('Vue 测试基建', () => {
    it('多次 render 的 id 唯一，事件与异步 mock 刷新 DOM，卸载清理资源', async () => {
        const media = mockMatchMedia();
        const resize = mockResizeObserver();
        const first = render(Smoke);
        const second = render(Smoke);
        const button = within(first.container as HTMLElement).getByRole('button', { name: '次数 0' });
        const otherButton = within(second.container as HTMLElement).getByRole('button', { name: '次数 0' });
        expect(button.id).not.toBe(otherButton.id);
        expect(first.container.querySelector('output')).toHaveAttribute('for', button.id);
        expect(getData(2)).toHaveLength(2);

        await fireEvent.click(button);
        expect(button).toHaveTextContent('次数 1');
        await media.fire('(min-width: 800px)', true);
        await resize.fire(button, [{ contentRect: { width: 123 } }]);
        expect(first.container.querySelector('output')).toHaveTextContent('宽屏，宽度 123');
        await resize.fireLive(() => ({ contentRect: { width: 456 } }));
        expect(second.container.querySelector('output')).toHaveTextContent('宽屏，宽度 456');

        first.unmount();
        second.unmount();
        expect(document.querySelector('[data-smoke-portal]')).toBeNull();
        expect(media.totalHandlers()).toBe(0);
        expect(resize.observed()).toHaveLength(0);
    });
});
