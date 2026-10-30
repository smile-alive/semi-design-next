import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import FormSection from '../section.svelte';
import { prefix } from './helpers';

const textSelector = `.${prefix}-section-text`;
const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));

describe('FormSection', () => {
    it('class 与 style', () => {
        const { container } = render(FormSection, { props: { class: 'sec-test', style: 'color: red' } });
        const section = container.querySelector('section.sec-test');
        expect(section).not.toBeNull();
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('默认内容渲染在 section 内', () => {
        const { container } = render(FormSection, { props: { children: html('<div class="test"></div>') } });
        expect(container.querySelector('section .test')).not.toBeNull();
    });

    it('text snippet 渲染在标题里', () => {
        const view = render(FormSection, { props: { text: html('<span>semi</span>') } });
        expect(view.container.querySelector(textSelector)).toHaveTextContent('semi');
        view.unmount();
        render(FormSection, { props: { text: html('<div data-testid="node-text">semi</div>') } });
        expect(document.querySelector(textSelector)).toContainElement(document.querySelector('[data-testid="node-text"]'));
    });

    it('其他属性透传到 section 元素', () => {
        const { container } = render(FormSection, { props: { 'data-testid': 'sec' } });
        expect(container.querySelector('section')).toHaveAttribute('data-testid', 'sec');
    });

    it('没有 text 时不渲染空的 h5 标题', () => {
        const { container } = render(FormSection, { props: { children: html('<span>content</span>') } });
        expect(container.querySelector('h5')).toBeNull();
        expect(container.querySelector('section')).toHaveTextContent('content');
    });
});
