import { describe, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Smoke from './fixtures/smoke.vue';

describe('Vue 测试基建（浏览器）', () => {
    it('SFC 加载主题 SCSS、处理键盘交互并清理 Teleport', async () => {
        const view = render(Smoke);
        const button = view.container.querySelector('button') as HTMLButtonElement;
        await tabTo(button);
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await expect.element(page.getByRole('button', { name: '次数 1' })).toBeVisible();
        expect(button.getBoundingClientRect().height).toBeGreaterThan(0);
        expect(view.container.querySelector('output')?.textContent).toContain('宽屏');
        expect(document.querySelector('[data-smoke-portal]')).not.toBeNull();
        view.unmount();
        expect(document.querySelector('[data-smoke-portal]')).toBeNull();
    });
});
