import { render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { FileItem } from '../widget/file';

describe('Sidebar.FileItem', () => {
    it('Tab 遍历工具栏时每个停靠点都是按钮，标题与链接下拉没有额外的空停靠点', async () => {
        const { container } = render(() => <FileItem content="<p>text</p>" />);
        const bar = await waitFor(() => {
            const el = container.querySelector('.semi-sidebar-file-menu-bar');
            expect(el).not.toBeNull();
            return el as HTMLElement;
        });
        const stops: Element[] = [];
        for (let i = 0; i < 40 && !bar.contains(document.activeElement); i++) {
            await userEvent.keyboard('{Tab}');
        }
        while (bar.contains(document.activeElement) && stops.length < 40) {
            stops.push(document.activeElement as Element);
            await userEvent.keyboard('{Tab}');
        }
        expect(stops.length).toBeGreaterThan(0);
        expect(stops.map((el) => el.tagName)).toEqual(stops.map(() => 'BUTTON'));
        expect(stops.every((el) => el.getAttribute('aria-label'))).toBe(true);
    });

    it('悬停标题按钮打开级别菜单，触发器暴露展开状态', async () => {
        render(() => <FileItem content="<p>text</p>" />);
        const heading = page.getByRole('button', { name: zh_CN.Sidebar.heading });
        await userEvent.hover(heading);
        await expect.element(page.getByRole('menuitem', { name: zh_CN.Sidebar.headingLevel.replace('${level}', '1') })).toBeVisible();
        await expect.element(heading).toHaveAttribute('aria-expanded', 'true');
    });
});
