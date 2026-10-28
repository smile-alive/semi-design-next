import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import MarkdownRender from '../index';

describe('MarkdownRender（浏览器）', () => {
    it('宿主 Preflight 重置下，无序和有序列表仍有项目符号、编号、缩进和块间距', async () => {
        // what Tailwind Preflight does to lists, in a layer below Semi's like the docs site's reset
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { margin: 0; padding: 0; } ol, ul { list-style: none; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(<MarkdownRender raw={'- a\n  - b\n\n1. c\n'} />);
        const [ul, nested] = await waitFor(() => {
            const lists = container.querySelectorAll('ul');
            expect(lists).toHaveLength(2);
            return lists;
        });
        const ol = container.querySelector('ol');

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
        const { container } = render(<MarkdownRender raw={'###### six\n\n# one'} />);
        const h6 = await waitFor(() => {
            const node = container.querySelector('h6');
            expect(node).not.toBeNull();
            return node;
        });
        expect(parseFloat(getComputedStyle(h6).marginBlockStart)).toBe(16);
        expect(parseFloat(getComputedStyle(h6).marginBlockEnd)).toBe(16);
    });

    it('表格渲染为 Semi Table：超过 10 行不分页，列对齐生效', async () => {
        const rows = Array.from({ length: 12 }, (_, i) => `| r${i} | ${i} |`).join('\n');
        const { container } = render(<MarkdownRender format="md" raw={`| A | B |\n| :-: | -: |\n${rows}`} />);
        await waitFor(() => expect(container.querySelectorAll('.semi-table-tbody .semi-table-row')).toHaveLength(12));
        expect(container.querySelector('.semi-page')).toBeNull();
        const cells = container.querySelectorAll<HTMLElement>('.semi-table-tbody tr:first-child td');
        expect(getComputedStyle(cells[0]).textAlign).toBe('center');
        expect(getComputedStyle(cells[1]).textAlign).toBe('right');
    });

    it('链接内的图片默认不可预览', async () => {
        const { container } = render(<MarkdownRender format="md" raw="[![cat](a.png)](https://x.test)" />);
        const image = await waitFor(() => {
            const node = container.querySelector('.semi-markdownRender-component-image');
            expect(node).not.toBeNull();
            return node;
        });
        image.querySelector('img').dispatchEvent(new Event('load'));
        const link = container.querySelector('a');
        expect(link.querySelector('[role="button"], [tabindex="0"]')).toBeNull();
        expect(getComputedStyle(image.querySelector('img')).cursor).not.toBe('zoom-in');
    });
});
