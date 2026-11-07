import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Annotation, { type AnnotationInfo } from '../annotation';
import RichTextSample from './fixtures/rich-text-sample.vue';

const info: AnnotationInfo[] = [
    {
        header: 'Sources',
        key: '1',
        annotations: [
            { type: 'text', title: 'Text title', url: 'https://semi.design/text', detail: 'detail', siteName: 'Semi' },
            { type: 'video', title: 'Video title', url: 'https://semi.design/video', siteName: 'Video site' },
        ],
    },
];

describe('Sidebar 富文本编辑器', () => {
    it('宿主 Preflight 重置下，标题、列表和链接仍可区分于正文', () => {
        // what Tailwind Preflight does, in a layer below Semi's like the docs site's reset
        const reset = document.createElement('style');
        reset.textContent = `@layer semi.reset {
            *, ::before, ::after { margin: 0; padding: 0; }
            h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
            ol, ul { list-style: none; }
            a { color: inherit; text-decoration: inherit; }
        }`;
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(RichTextSample);
        const style = (selector: string) => getComputedStyle(container.querySelector(selector) as Element);
        const bodySize = parseFloat(style('p').fontSize);
        for (const tag of ['h1', 'h2', 'h3']) {
            expect(parseFloat(style(tag).fontSize)).toBeGreaterThan(bodySize);
        }
        for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
            expect(Number(style(tag).fontWeight)).toBeGreaterThanOrEqual(600);
        }
        expect(style('ul').listStyleType).toBe('disc');
        expect(style('ol').listStyleType).toBe('decimal');
        expect(parseFloat(style('ul').paddingInlineStart)).toBeGreaterThan(0);
        expect(style('a').textDecorationLine).toBe('underline');
        expect(style('a').color).not.toBe(style('p').color);
    });
});

describe('Annotation', () => {
    it.each([/Text title/, /Video title/])('%s 项是可通过 Tab 到达的链接，不带链接样式，并显示主题焦点环', async (name) => {
        render(Annotation, { props: { activeKey: ['1'], info, visible: true } });
        const link = page.getByRole('link', { name }).element();
        const { display, textDecorationLine } = getComputedStyle(link);
        expect({ display, textDecorationLine }).toEqual({
            display: link.classList.contains('semi-sidebar-annotation-item-text') ? 'flex' : 'block',
            textDecorationLine: 'none',
        });
        await tabTo(link);
        expectThemeFocusRing(link);
    });
});
