import { screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import FullscreenStage from './fixtures/fullscreen-stage.vue';

describe('Portal（浏览器）', () => {
    afterEach(async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
    });

    it('全屏期间打开的 Modal 渲染在全屏元素内，可见、可聚焦，仍是模态对话框', async () => {
        render(FullscreenStage);
        const stage = screen.getByTestId('stage');
        await userEvent.click(screen.getByRole('button', { name: 'fullscreen' }));
        await waitFor(() => expect(document.fullscreenElement).toBe(stage));

        await userEvent.click(screen.getByRole('button', { name: 'open' }));
        const dialog = await screen.findByRole('dialog');
        expect(stage.contains(dialog)).toBe(true);
        expect(stage.inert).toBe(false);
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        const { left, top, width, height } = dialog.getBoundingClientRect();
        expect(dialog.contains(document.elementFromPoint(left + width / 2, top + height / 2))).toBe(true);
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });
});
