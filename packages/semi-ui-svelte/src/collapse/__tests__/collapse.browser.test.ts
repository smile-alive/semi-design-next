import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Tall from './tall.svelte';

describe('Svelte Collapse（浏览器）', () => {
    // Chrome makes an overflowing scroll container keyboard focusable; that focus must not show the default ring
    it('可滚动内容获得键盘焦点时显示主题焦点环', async () => {
        const { container } = render(Tall);
        const content = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-collapse-content`) as HTMLElement;
        // consumers such as Sidebar cap the height and let the content scroll
        content.style.cssText = 'max-height: 40px; overflow: auto';
        await tabTo(content);
        expectThemeFocusRing(content);
    });

    // the button covers only the title; the ring outlines the whole header row, the area the pointer toggles
    it('按钮获得键盘焦点时，标题行显示主题焦点环', async () => {
        render(Tall);
        const button = screen.getByRole('button', { name: 'panel' });
        await tabTo(button);
        expectThemeFocusRing(button.closest(`.${BASE_CLASS_PREFIX}-collapse-header`) as HTMLElement);
        expect(getComputedStyle(button).outlineStyle).toBe('none');
    });
});
