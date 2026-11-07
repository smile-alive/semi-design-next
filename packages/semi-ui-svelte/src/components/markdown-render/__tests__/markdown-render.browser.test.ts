import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { setup } from './setup';

describe('Svelte MarkdownRender（浏览器）', () => {
    it('宿主 Preflight 重置下，无序和有序列表仍有项目符号、编号、缩进和块间距', async () => {
        // what Tailwind Preflight does to lists, in a layer below Semi's like the docs site's reset
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { margin: 0; padding: 0; } ol, ul { list-style: none; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = setup({ raw: '- a\n  - b\n\n1. c\n' });
        await expect.poll(() => container.querySelectorAll('ul').length).toBe(2);
        const [ul, nested] = container.querySelectorAll('ul');
        const ol = container.querySelector('ol') as HTMLOListElement;

        expect(getComputedStyle(ul).listStyleType).toBe('disc');
        expect(getComputedStyle(nested).listStyleType).not.toBe('none');
        expect(getComputedStyle(ol).listStyleType).toBe('decimal');
        for (const list of [ul, ol]) {
            const style = getComputedStyle(list);
            expect(parseFloat(style.paddingInlineStart)).toBeGreaterThan(0);
            expect(parseFloat(style.marginBlockStart)).toBeGreaterThan(0);
        }
    });

    it('各级标题（含 h6）都有上下间距', async () => {
        const { container } = setup({ raw: '###### six\n\n# one' });
        await expect.poll(() => container.querySelector('h6')).not.toBeNull();
        const style = getComputedStyle(container.querySelector('h6') as HTMLElement);
        expect(parseFloat(style.marginBlockStart)).toBe(16);
        expect(parseFloat(style.marginBlockEnd)).toBe(16);
    });

    it('表格渲染为 Semi Table：超过 10 行不分页，列对齐生效', async () => {
        const rows = Array.from({ length: 12 }, (_, i) => `| r${i} | ${i} |`).join('\n');
        const { container } = setup({ format: 'md', raw: `| A | B |\n| :-: | -: |\n${rows}` });
        await expect.poll(() => container.querySelectorAll('.semi-table-tbody .semi-table-row').length).toBe(12);
        expect(container.querySelector('.semi-page')).toBeNull();
        const cells = container.querySelectorAll<HTMLElement>('.semi-table-tbody tr:first-child td');
        expect(getComputedStyle(cells[0]).textAlign).toBe('center');
        expect(getComputedStyle(cells[1]).textAlign).toBe('right');
    });

    it('链接内的图片默认不可预览', async () => {
        const { container } = setup({ format: 'md', raw: '[![cat](a.png)](https://x.test)' });
        await expect.poll(() => container.querySelector('.semi-markdownRender-component-image')).not.toBeNull();
        container.querySelector('.semi-markdownRender-component-image img')?.dispatchEvent(new Event('load'));
        const link = container.querySelector('a') as HTMLElement;
        expect(link.querySelector('[role="button"], [tabindex="0"]')).toBeNull();
        expect(getComputedStyle(container.querySelector('.semi-markdownRender-component-image img') as Element).cursor).not.toBe('zoom-in');
    });
});
